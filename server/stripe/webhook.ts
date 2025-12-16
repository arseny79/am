import Stripe from "stripe";
import type { Request, Response } from "express";
import { ENV } from "../_core/env";
import { getDb, getUserById } from "../db";
import { listings, professionals } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { sendEmail, EmailTemplates } from "../lib/emailService";
import type { ListingTier } from "@shared/pricing";
import { handlePaymentFailure } from "./paymentRetry";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

/**
 * Stripe webhook handler
 * CRITICAL: This route must be registered with express.raw() middleware BEFORE express.json()
 * See server/_core/index.ts for proper setup
 */
export async function handleStripeWebhook(
  req: Request,
  res: Response
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
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[Webhook] Checkout session expired: ${session.id}`);
        await handleCheckoutSessionExpired(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
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
 * Handle expired checkout session
 */
async function handleCheckoutSessionExpired(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email || session.customer_details?.email;
  const customerName = session.metadata?.customer_name || "Customer";
  
  if (customerEmail) {
    await handlePaymentFailure(
      session.id,
      customerEmail,
      customerName,
      "Payment session expired. Please try again."
    );
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const customerEmail = paymentIntent.receipt_email || "";
  const customerName = paymentIntent.metadata?.customer_name || "Customer";
  const failureMessage = paymentIntent.last_payment_error?.message || "Payment declined";
  
  if (customerEmail) {
    await handlePaymentFailure(
      paymentIntent.id,
      customerEmail,
      customerName,
      failureMessage
    );
  }
}

/**
 * Handle successful checkout completion completion
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

    // Get updated listing details for receipt
    const updatedListing = await db
      .select()
      .from(listings)
      .where(eq(listings.id, parseInt(listingId)))
      .limit(1);

    if (updatedListing.length > 0) {
      const listing = updatedListing[0]!;
      
      // Send listing published email to seller
      const seller = await getUserById(listing.sellerId);
      if (seller?.email) {
        const listingUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL?.replace('/api', '') || 'https://mspmarketplace.com'}/listing/${listing.id}`;
        await sendEmail({
          to: seller.email,
          ...EmailTemplates.listingPublished({
            recipientName: seller.name || 'there',
            listingTitle: listing.businessName,
            listingUrl,
          }),
        });
      }
    }
  } catch (error) {
    console.error(`[Webhook] Failed to update listing ${listingId}:`, error);
    throw error;
  }
}


/**
 * Handle subscription created or updated
 * Updates professional tier based on subscription status
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata;
  const professionalId = metadata?.professionalId;
  const tier = metadata?.tier as "professional" | "premium" | undefined;

  if (!professionalId || !tier) {
    console.log("[Webhook] No professionalId or tier in subscription metadata, checking if professional subscription");
    return;
  }

  console.log(`[Webhook] Updating professional ${professionalId} subscription to tier: ${tier}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    const subData = subscription as any;
    const currentPeriodEnd = subData.current_period_end 
      ? new Date(subData.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default 30 days

    await db
      .update(professionals)
      .set({
        tier: tier,
        stripeSubscriptionId: subscription.id,
        tierExpiresAt: currentPeriodEnd,
        status: "active", // Ensure professional is active when subscription is active
      })
      .where(eq(professionals.id, parseInt(professionalId)));

    console.log(`[Webhook] Professional ${professionalId} tier updated to ${tier}`);
  } catch (error) {
    console.error(`[Webhook] Failed to update professional ${professionalId}:`, error);
    throw error;
  }
}

/**
 * Handle subscription canceled/deleted
 * Downgrades professional to basic tier
 */
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata;
  const professionalId = metadata?.professionalId;

  if (!professionalId) {
    console.log("[Webhook] No professionalId in canceled subscription metadata");
    return;
  }

  console.log(`[Webhook] Subscription canceled for professional ${professionalId}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    await db
      .update(professionals)
      .set({
        tier: "basic",
        stripeSubscriptionId: null,
        tierExpiresAt: null,
      })
      .where(eq(professionals.id, parseInt(professionalId)));

    console.log(`[Webhook] Professional ${professionalId} downgraded to basic tier`);
  } catch (error) {
    console.error(`[Webhook] Failed to downgrade professional ${professionalId}:`, error);
    throw error;
  }
}
