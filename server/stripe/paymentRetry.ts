import { getDb } from "../db";
import { listings } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { sendPaymentFailureEmail } from "./emailReceipts";

/**
 * Handle failed payment and notify customer
 */
export async function handlePaymentFailure(
  sessionId: string,
  customerEmail: string,
  customerName: string,
  failureReason: string
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Payment Retry] Database not available");
    return;
  }

  try {
    // Find listing associated with this session
    const listingResult = await db
      .select()
      .from(listings)
      .where(
        and(
          eq(listings.stripeSessionId, sessionId),
          eq(listings.paymentStatus, "pending")
        )
      )
      .limit(1);

    if (listingResult.length > 0) {
      const listing = listingResult[0]!;

      // Update listing to mark payment as failed
      await db
        .update(listings)
        .set({
          paymentStatus: "pending", // Keep as pending for retry
          // Don't publish the listing
          isPublished: 0,
        })
        .where(eq(listings.id, listing.id));

      console.log(`[Payment Retry] Marked listing ${listing.id} payment as failed`);
    }

    // Send failure notification email
    await sendPaymentFailureEmail(customerEmail, customerName, failureReason);

    console.log(`[Payment Retry] Sent failure notification to ${customerEmail}`);
  } catch (error) {
    console.error("[Payment Retry] Failed to handle payment failure:", error);
  }
}

/**
 * Check if a listing has a pending payment that can be retried
 */
export async function canRetryPayment(listingId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    return false;
  }

  const result = await db
    .select({
      paymentStatus: listings.paymentStatus,
      stripeSessionId: listings.stripeSessionId,
    })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);

  if (result.length === 0) {
    return false;
  }

  const listing = result[0]!;

  // Can retry if payment is pending and there's a session ID
  return listing.paymentStatus === "pending" && !!listing.stripeSessionId;
}

/**
 * Get retry payment URL for a listing
 */
export function getRetryPaymentUrl(listingId: number, origin: string): string {
  return `${origin}/create-listing?retry=${listingId}`;
}
