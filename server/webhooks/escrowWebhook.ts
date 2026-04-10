import { Request, Response } from 'express';
import { getDb } from '../db';
import { deals, users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendEmail, EmailTemplates } from '../lib/emailService';

interface EscrowWebhookPayload {
  action: string;
  action_type?: string;
  initiator?: string;
  by_customer?: string;
  transaction?: {
    id: string | number;
    status: string;
    title?: string;
    description?: string;
    currency?: string;
    items?: Array<{
      id: number;
      title: string;
      description: string;
      schedule?: Array<{
        amount: string;
        payer_customer: string;
        payee_customer: string;
        status: string;
      }>;
    }>;
    parties?: Array<{
      role: string;
      customer: string;
      agreed: boolean;
    }>;
  };
}

// Stages that can auto-advance via escrow events (in order)
const ESCROW_STAGE_TRANSITIONS: Record<string, string> = {
  funded: 'closing',
  completed: 'closed',
};

export async function handleEscrowWebhook(req: Request, res: Response) {
  // ── Authenticate webhook ──────────────────────────────────────────────────
  const secret = process.env.ESCROW_WEBHOOK_SECRET;
  if (secret) {
    const provided =
      req.headers['x-escrow-token'] ||
      req.headers['x-escrow-webhook-token'] ||
      req.query.token;
    if (provided !== secret) {
      console.warn('[EscrowWebhook] Rejected: invalid webhook secret');
      return res.status(401).json({ error: 'Unauthorized' });
    }
  } else {
    console.warn('[EscrowWebhook] ESCROW_WEBHOOK_SECRET is not set — webhook is unauthenticated');
  }

  try {
    const db = getDb();
    const payload = req.body as EscrowWebhookPayload;

    if (!payload.action || !payload.transaction) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const escrowTransactionId = String(payload.transaction.id);
    const escrowStatus = payload.transaction.status;

    // Find deal by escrow transaction ID
    const [deal] = await db
      .select()
      .from(deals)
      .where(eq(deals.escrowTransactionId, escrowTransactionId))
      .limit(1);

    if (!deal) {
      console.log(`[EscrowWebhook] No deal found for transaction ${escrowTransactionId}`);
      return res.status(200).json({ received: true });
    }

    // Map Escrow.com status to our enum values
    type EscrowStatus = 'not_started' | 'created' | 'agreed' | 'funded' | 'shipped' | 'received' | 'accepted' | 'completed' | 'cancelled';
    const statusMap: Record<string, EscrowStatus> = {
      created: 'created',
      agreed: 'agreed',
      funded: 'funded',
      in_escrow: 'funded',
      shipped: 'shipped',
      received: 'received',
      accepted: 'accepted',
      completed: 'completed',
      cancelled: 'cancelled',
      canceled: 'cancelled',
    };

    const mappedStatus = statusMap[escrowStatus];

    if (mappedStatus) {
      const updateData: Record<string, unknown> = {
        escrowStatus: mappedStatus,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
      };

      if (mappedStatus === 'funded') {
        updateData.escrowFundedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
      if (mappedStatus === 'completed') {
        updateData.escrowCompletedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }

      await db
        .update(deals)
        .set(updateData)
        .where(eq(deals.escrowTransactionId, escrowTransactionId));

      // ── Auto-advance deal stage ────────────────────────────────────────────
      const nextStage = ESCROW_STAGE_TRANSITIONS[mappedStatus];
      if (nextStage) {
        await db
          .update(deals)
          .set({ stage: nextStage as any, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') })
          .where(eq(deals.id, deal.id));
        console.log(`[EscrowWebhook] Deal ${deal.id} stage advanced to "${nextStage}" (escrow: ${mappedStatus})`);
      }

      // ── Send notifications to both parties ────────────────────────────────
      const appUrl = process.env.VITE_APP_URL || 'https://acquisitions.market';
      const dealUrl = `${appUrl}/deal/${deal.id}`;

      const [buyer] = await db.select().from(users).where(eq(users.id, deal.buyerId)).limit(1);
      const [seller] = await db.select().from(users).where(eq(users.id, deal.sellerId)).limit(1);

      if (mappedStatus === 'funded' && (buyer?.email || seller?.email)) {
        const subject = 'Escrow Funded — Deal Moving to Closing';
        const html = (name: string) => `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2>Escrow Has Been Funded</h2>
            <p>Hi ${name},</p>
            <p>The escrow for your deal has been <strong>funded</strong>. The deal is now moving to the <strong>Closing</strong> stage.</p>
            <p><a href="${dealUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px">View Deal</a></p>
          </div>`;
        const text = (name: string) => `Hi ${name},\n\nThe escrow for your deal has been funded. The deal is now moving to the Closing stage.\n\nView deal: ${dealUrl}`;
        if (buyer?.email) await sendEmail({ to: buyer.email, subject, html: html(buyer.name || 'Buyer'), text: text(buyer.name || 'Buyer') });
        if (seller?.email) await sendEmail({ to: seller.email, subject, html: html(seller.name || 'Seller'), text: text(seller.name || 'Seller') });
      }

      if (mappedStatus === 'completed' && (buyer?.email || seller?.email)) {
        const subject = 'Deal Closed — Escrow Complete';
        const html = (name: string) => `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
            <h2>Your Deal Is Closed</h2>
            <p>Hi ${name},</p>
            <p>The escrow transaction has been <strong>completed</strong> and the deal is now <strong>closed</strong>. Congratulations!</p>
            <p><a href="${dealUrl}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px">View Deal</a></p>
          </div>`;
        const text = (name: string) => `Hi ${name},\n\nThe escrow transaction has been completed and the deal is now closed. Congratulations!\n\nView deal: ${dealUrl}`;
        if (buyer?.email) await sendEmail({ to: buyer.email, subject, html: html(buyer.name || 'Buyer'), text: text(buyer.name || 'Buyer') });
        if (seller?.email) await sendEmail({ to: seller.email, subject, html: html(seller.name || 'Seller'), text: text(seller.name || 'Seller') });
      }

    } else {
      console.log(`[EscrowWebhook] Unhandled status "${escrowStatus}" for transaction ${escrowTransactionId}`);
    }

    console.log(`[EscrowWebhook] Processed: transaction ${escrowTransactionId}, status ${escrowStatus}`);
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('[EscrowWebhook] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
