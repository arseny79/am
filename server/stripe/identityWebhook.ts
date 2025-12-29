import { Request, Response } from "express";
import Stripe from "stripe";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(ENV.stripeSecretKey, {
  apiVersion: "2025-11-17.clover",
});

/**
 * Webhook handler for Stripe Identity verification events
 * Listens for: identity.verification_session.verified, identity.verification_session.requires_input
 */
export async function handleIdentityWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Stripe Identity Webhook] No signature found");
    return res.status(400).send("No signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.stripeWebhookSecret
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("[Stripe Identity Webhook] Signature verification failed:", errorMessage);
    return res.status(400).send(`Webhook Error: ${errorMessage}`);
  }

  console.log("[Stripe Identity Webhook] Received event:", event.type);

  try {
    switch (event.type) {
      case "identity.verification_session.verified": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        await handleVerificationVerified(session);
        break;
      }

      case "identity.verification_session.requires_input": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        await handleVerificationRequiresInput(session);
        break;
      }

      case "identity.verification_session.canceled": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        console.log("[Stripe Identity] Verification canceled:", session.id);
        // Could send email notification here
        break;
      }

      default:
        console.log("[Stripe Identity Webhook] Unhandled event type:", event.type);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Identity Webhook] Error processing event:", error);
    res.status(500).send("Webhook processing failed");
  }
}

/**
 * Handle successful verification
 */
async function handleVerificationVerified(session: Stripe.Identity.VerificationSession) {
  const db = await getDb();
  if (!db) {
    console.error("[Stripe Identity] Database not available");
    return;
  }

  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("[Stripe Identity] No userId in session metadata");
    return;
  }

  console.log(`[Stripe Identity] Verification verified for user ${userId}, session ${session.id}`);

  // Update user as verified
  await db.update(users)
    .set({
      stripeIdentityVerified: true,
      stripeIdentityVerifiedAt: new Date(),
    })
    .where(eq(users.id, parseInt(userId)));

  console.log(`[Stripe Identity] User ${userId} marked as verified`);

  // TODO: Send email notification to user
  // await sendVerificationSuccessEmail(userId);
}

/**
 * Handle verification that requires additional input
 */
async function handleVerificationRequiresInput(session: Stripe.Identity.VerificationSession) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("[Stripe Identity] No userId in session metadata");
    return;
  }

  console.log(`[Stripe Identity] Verification requires input for user ${userId}, session ${session.id}`);
  console.log("[Stripe Identity] Last error:", session.last_error);

  // TODO: Send email notification to user about issue
  // await sendVerificationIssueEmail(userId, session.last_error?.reason);
}
