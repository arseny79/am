import { Request, Response } from 'express';
import db from '../db';
import { deals, escrowTransactions } from '../db/schema';
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
    const payload = req.body as EscrowWebhookPayload;

    if (!payload.action || !payload.transaction) {
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const escrowTransactionId = String(payload.transaction.id);

    // Find the escrow transaction in our database
    const [escrowTx] = await db
      .select()
      .from(escrowTransactions)
      .where(eq(escrowTransactions.escrowTransactionId, escrowTransactionId))
      .limit(1);

    if (!escrowTx) {
      // Transaction not found — might be a test webhook, acknowledge it
      console.log(`Escrow webhook: transaction ${escrowTransactionId} not found in DB`);
      return res.status(200).json({ received: true });
    }

    const dealId = escrowTx.dealId;

    // Map Escrow.com status to our internal status
    let newStatus: string | null = null;
    const escrowStatus = payload.transaction.status;

    switch (escrowStatus) {
      case 'in_escrow':
        newStatus = 'funds_in_escrow';
        break;
      case 'inspection_period':
        newStatus = 'inspection_period';
        break;
      case 'delivered':
        newStatus = 'delivered';
        break;
      case 'completed':
        newStatus = 'completed';
        break;
      case 'cancelled':
        newStatus = 'cancelled';
        break;
      case 'disputed':
        newStatus = 'disputed';
        break;
      default:
        console.log(`Escrow webhook: unhandled status ${escrowStatus}`);
    }

    // Update escrow transaction status
    await db
      .update(escrowTransactions)
      .set({
        status: escrowStatus,
        updatedAt: new Date(),
      })
      .where(eq(escrowTransactions.escrowTransactionId, escrowTransactionId));

    // Update deal stage if we have a mapped status
    if (newStatus && dealId) {
      await db
        .update(deals)
        .set({
          escrowStatus: newStatus,
          updatedAt: new Date(),
        })
        .where(eq(deals.id, dealId));
    }

    console.log(`Escrow webhook processed: transaction ${escrowTransactionId}, status ${escrowStatus}`);
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Escrow webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
