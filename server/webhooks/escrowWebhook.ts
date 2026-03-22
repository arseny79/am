import { Request, Response } from 'express';
import { getDb } from '../db';
import { deals } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

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

export async function handleEscrowWebhook(req: Request, res: Response) {
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
      console.log(`Escrow webhook: no deal found for transaction ${escrowTransactionId}`);
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
    } else {
      console.log(`Escrow webhook: unhandled status "${escrowStatus}" for transaction ${escrowTransactionId}`);
    }

    console.log(`Escrow webhook processed: transaction ${escrowTransactionId}, status ${escrowStatus}`);
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Escrow webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
