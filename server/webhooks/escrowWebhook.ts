import type { Request, Response } from "express";
import { getDb } from "../db";
import { deals } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { createNotification } from "../db";

/**
 * Escrow.com Webhook Handler
 * 
 * Receives status updates from Escrow.com and automatically advances deal stages
 * 
 * Webhook Events:
 * - transaction.funded: Buyer has funded the escrow account
 * - transaction.shipped: Seller has marked assets as transferred
 * - transaction.completed: Transaction completed, funds released
 * - transaction.cancelled: Transaction cancelled, funds refunded
 */

interface EscrowWebhookPayload {
  event: string;
  transaction_id: string;
  status: string;
  amount: number;
  buyer_email?: string;
  seller_email?: string;
  timestamp: string;
}

export async function handleEscrowWebhook(req: Request, res: Response) {
  try {
    const payload = req.body as EscrowWebhookPayload;
    
    console.log("[Escrow Webhook] Received event:", payload.event, "for transaction:", payload.transaction_id);

    // Verify webhook signature (if Escrow.com provides one)
    // const signature = req.headers["x-escrow-signature"];
    // if (!verifyEscrowSignature(signature, req.body)) {
    //   console.error("[Escrow Webhook] Invalid signature");
    //   return res.status(401).json({ error: "Invalid signature" });
    // }

    const db = await getDb();
    if (!db) {
      console.error("[Escrow Webhook] Database not available");
      return res.status(500).json({ error: "Database not available" });
    }

    // Find the deal associated with this escrow transaction
    const dealResults = await db
      .select()
      .from(deals)
      .where(eq(deals.escrowTransactionId, payload.transaction_id))
      .limit(1);

    if (dealResults.length === 0) {
      console.error("[Escrow Webhook] Deal not found for transaction:", payload.transaction_id);
      return res.status(404).json({ error: "Deal not found" });
    }

    const deal = dealResults[0];

    // Update escrow status in database
    // Map Escrow.com status to our enum values
    const statusMap: Record<string, string> = {
      "pending": "created",
      "funded": "funded",
      "shipped": "shipped",
      "completed": "completed",
      "cancelled": "cancelled",
    };
    
    const mappedStatus = statusMap[payload.status.toLowerCase()] || "created";
    
    await db
      .update(deals)
      .set({
        escrowStatus: mappedStatus as any, // Cast to any to avoid enum type error
        updatedAt: new Date(),
      })
      .where(eq(deals.id, deal.id));

    // Handle different webhook events
    switch (payload.event) {
      case "transaction.funded":
        await handleFundedEvent(deal, payload);
        break;
      
      case "transaction.shipped":
        await handleShippedEvent(deal, payload);
        break;
      
      case "transaction.completed":
        await handleCompletedEvent(deal, payload);
        break;
      
      case "transaction.cancelled":
        await handleCancelledEvent(deal, payload);
        break;
      
      default:
        console.log("[Escrow Webhook] Unknown event type:", payload.event);
    }

    // Acknowledge receipt
    res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error("[Escrow Webhook] Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function handleFundedEvent(deal: any, payload: EscrowWebhookPayload) {
  console.log("[Escrow Webhook] Processing funded event for deal:", deal.id);

  const db = await getDb();
  if (!db) return;

  // Advance deal stage to closing (assets being transferred)
  if (deal.stage === "escrow") {
    await db
      .update(deals)
      .set({
        stage: "closing",
        updatedAt: new Date(),
      })
      .where(eq(deals.id, deal.id));

    console.log("[Escrow Webhook] Advanced deal", deal.id, "to closing stage");
  }

  // Send notifications to both parties
  await createNotification({
    userId: deal.buyerId,
    title: "Escrow Funded",
    message: `Your escrow payment of $${payload.amount.toLocaleString()} has been received. The seller will now transfer assets.`,
    type: "deal_update",
    relatedEntityType: "deal",
    relatedEntityId: deal.id,
    isRead: 0,
    emailSent: 0,
  });

  await createNotification({
    userId: deal.sellerId,
    title: "Escrow Funded",
    message: `Buyer has funded the escrow account with $${payload.amount.toLocaleString()}. You can now begin transferring assets.`,
    type: "deal_update",
    relatedEntityType: "deal",
    relatedEntityId: deal.id,
    isRead: 0,
    emailSent: 0,
  });

  // Send email notifications
  // Note: You'll need to fetch user emails from the database
  // await sendEmail({
  //   to: buyerEmail,
  //   subject: "Escrow Payment Received",
  //   html: `<p>Your escrow payment has been received...</p>`,
  // });
}

async function handleShippedEvent(deal: any, payload: EscrowWebhookPayload) {
  console.log("[Escrow Webhook] Processing shipped event for deal:", deal.id);

  // Send notifications
  await createNotification({
    userId: deal.buyerId,
    title: "Assets Transferred",
    message: "The seller has marked assets as transferred. Please review and confirm receipt on Escrow.com.",
    type: "deal_update",
    relatedEntityType: "deal",
    relatedEntityId: deal.id,
    isRead: 0,
    emailSent: 0,
  });

  await createNotification({
    userId: deal.sellerId,
    title: "Assets Marked as Transferred",
    message: "You've marked assets as transferred. Waiting for buyer confirmation to release funds.",
    type: "deal_update",
    relatedEntityType: "deal",
    relatedEntityId: deal.id,
    isRead: 0,
    emailSent: 0,
  });
}

async function handleCompletedEvent(deal: any, payload: EscrowWebhookPayload) {
  console.log("[Escrow Webhook] Processing completed event for deal:", deal.id);

  const db = await getDb();
  if (!db) return;

  // Advance deal stage to closed
  await db
    .update(deals)
    .set({
      stage: "closed",
      updatedAt: new Date(),
    })
    .where(eq(deals.id, deal.id));

  console.log("[Escrow Webhook] Advanced deal", deal.id, "to closed stage");

  // Send notifications
  await createNotification({
    userId: deal.buyerId,
    title: "Transaction Completed",
    message: `Congratulations! The transaction is complete. Funds have been released to the seller.`,
    type: "deal_update",
    relatedEntityType: "deal",
    relatedEntityId: deal.id,
    isRead: 0,
    emailSent: 0,
  });

  await createNotification({
    userId: deal.sellerId,
    title: "Transaction Completed",
    message: `Congratulations! The transaction is complete. You've received $${payload.amount.toLocaleString()}.`,
    type: "deal_update",
    relatedEntityType: "deal",
    relatedEntityId: deal.id,
    isRead: 0,
    emailSent: 0,
  });
}

async function handleCancelledEvent(deal: any, payload: EscrowWebhookPayload) {
  console.log("[Escrow Webhook] Processing cancelled event for deal:", deal.id);

  const db = await getDb();
  if (!db) return;

  // Advance deal stage to cancelled
  await db
    .update(deals)
    .set({
      stage: "cancelled",
      updatedAt: new Date(),
    })
    .where(eq(deals.id, deal.id));

  console.log("[Escrow Webhook] Advanced deal", deal.id, "to cancelled stage");

  // Send notifications
  await createNotification({
    userId: deal.buyerId,
    title: "Transaction Cancelled",
    message: "The escrow transaction has been cancelled. Any funds have been refunded.",
    type: "deal_update",
    relatedEntityType: "deal",
    relatedEntityId: deal.id,
    isRead: 0,
    emailSent: 0,
  });

  await createNotification({
    userId: deal.sellerId,
    title: "Transaction Cancelled",
    message: "The escrow transaction has been cancelled.",
    type: "deal_update",
    relatedEntityType: "deal",
    relatedEntityId: deal.id,
    isRead: 0,
    emailSent: 0,
  });
}

/**
 * Verify Escrow.com webhook signature
 * (Implement this if Escrow.com provides signature verification)
 */
function verifyEscrowSignature(signature: string | undefined, body: any): boolean {
  // TODO: Implement signature verification based on Escrow.com documentation
  // This would typically involve:
  // 1. Getting the webhook secret from environment variables
  // 2. Creating a hash of the request body using the secret
  // 3. Comparing the hash with the provided signature
  
  return true; // For now, accept all webhooks (insecure - implement properly)
}
