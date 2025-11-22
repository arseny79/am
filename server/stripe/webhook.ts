import express from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { listings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

/**
 * Stripe webhook handler
 * CRITICAL: This route must be registered with express.raw() middleware BEFORE express.json()
 * See server/_core/index.ts for proper setup
 */
export async function handleStripeWebhook(
  req: express.Request,
  res: express.Response
) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Webhook] Missing stripe-signature header");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  // CRITICAL: Handle test events by returning verification response
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  console.log(`[Webhook] Processing event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Webhook] Payment succeeded: ${paymentIntent.id}`);
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Webhook] Payment failed: ${paymentIntent.id}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Handle successful checkout session completion
 * Updates listing payment status and activates the listing
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log(`[Webhook] Checkout completed: ${session.id}`);
  console.log(`[Webhook] Metadata:`, session.metadata);

  const listingId = session.metadata?.listing_id;
  const tier = session.metadata?.tier;
  const userId = session.metadata?.user_id;

  if (!listingId) {
    console.warn("[Webhook] No listing_id in metadata, skipping listing update");
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    // Update listing payment status
    await db
      .update(listings)
      .set({
        paymentStatus: "paid",
        stripeSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string | null,
        paidAt: new Date(),
        isPublished: true, // Automatically publish after payment
        status: "active",
      })
      .where(eq(listings.id, parseInt(listingId)));

    console.log(`[Webhook] Updated listing ${listingId}: payment confirmed, published`);
  } catch (error) {
    console.error(`[Webhook] Failed to update listing ${listingId}:`, error);
    throw error;
  }
}
