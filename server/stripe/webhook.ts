import Stripe from "stripe";
import type { Request, Response } from "express";
import { ENV } from "../_core/env";
import { getDb, getUserById } from "../db";
import { listings, professionals, users, subscriptions } from "../../drizzle/schema";
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

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case "identity.verification_session.verified": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        await handleIdentityVerified(session);
        break;
      }

      case "identity.verification_session.requires_input": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        console.log(`[Webhook] Identity verification requires input: ${session.id}`);
        break;
      }

      case "identity.verification_session.canceled": {
        const session = event.data.object as Stripe.Identity.VerificationSession;
        console.log(`[Webhook] Identity verification canceled: ${session.id}`);
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
        paidAt: new Date().toISOString(),
        isPublished: 1, // Automatically publish after payment
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
        const listingUrl = `${process.env.VITE_APP_URL || 'https://msp.investments'}/listing/${listing.id}`;
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
 * Handle listing tier subscription (Featured/Premium)
 * Persists subscription data and updates listing tiers
 */
async function handleListingTierSubscription(
  subscription: Stripe.Subscription,
  productId: string,
  userId: string | undefined
) {
  if (!userId) {
    console.error("[Webhook] No userId in listing tier subscription metadata");
    return;
  }

  const tier = productId === "featured_weekly" ? "featured" : "premium";
  console.log(`[Webhook] Listing tier subscription for user ${userId}: ${tier}`);

  const customerId = subscription.customer as string;
  const subData = subscription as any;
  const currentPeriodEnd = subData.current_period_end 
    ? new Date(subData.current_period_end * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    // Upsert subscription record
    const existingSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
      .limit(1);

    const subscriptionData = {
      userId: parseInt(userId),
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      productId: productId,
      status: subscription.status,
      currentPeriodEnd: currentPeriodEnd.toISOString().slice(0, 19).replace('T', ' '),
      cancelAtPeriodEnd: subscription.cancel_at_period_end ? 1 : 0,
    };

    if (existingSub.length > 0) {
      // Update existing subscription
      await db
        .update(subscriptions)
        .set(subscriptionData)
        .where(eq(subscriptions.id, existingSub[0]!.id));
      console.log(`[Webhook] Updated subscription ${subscription.id}`);
    } else {
      // Insert new subscription
      await db.insert(subscriptions).values(subscriptionData);
      console.log(`[Webhook] Created subscription ${subscription.id}`);
    }

    // Update all active listings for this user to the subscribed tier
    const listingTier = tier as "featured" | "premium";
    const updateResult = await db
      .update(listings)
      .set({ listingTier: listingTier })
      .where(
        eq(listings.sellerId, parseInt(userId))
      );
    
    console.log(`[Webhook] Updated user ${userId} listings to ${tier} tier`);
    
    // Send email notification to user about tier upgrade
    const user = await getUserById(parseInt(userId));
    if (user?.email) {
      await sendEmail({
        to: user.email,
        subject: `Your listings have been upgraded to ${tier === 'featured' ? 'Featured' : 'Premium'} tier`,
        text: `Congratulations! All your active listings have been upgraded to ${tier === 'featured' ? 'Featured' : 'Premium'} tier. Your listings will now receive priority placement and enhanced visibility.`,
        html: `<p>Congratulations!</p><p>All your active listings have been upgraded to <strong>${tier === 'featured' ? 'Featured' : 'Premium'}</strong> tier.</p><p>Your listings will now receive priority placement and enhanced visibility.</p>`,
      });
    }
  } catch (error) {
    console.error(`[Webhook] Failed to persist subscription:`, error);
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
  const productId = metadata?.productId;
  const userId = metadata?.userId;

  // Handle listing tier subscriptions (Featured/Premium)
  if (productId && (productId === "featured_weekly" || productId === "premium_weekly")) {
    await handleListingTierSubscription(subscription, productId, userId);
    return;
  }

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
        tierExpiresAt: currentPeriodEnd?.toISOString(),
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
 * Updates subscription status and downgrades professional to basic tier
 */
async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const metadata = subscription.metadata;
  const professionalId = metadata?.professionalId;
  const productId = metadata?.productId;
  const userId = metadata?.userId;

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    // Update subscription status to canceled
    await db
      .update(subscriptions)
      .set({
        status: "canceled",
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

    console.log(`[Webhook] Subscription ${subscription.id} marked as canceled`);

    // If this was a professional subscription, downgrade to basic tier
    if (professionalId) {
      await db
        .update(professionals)
        .set({
          tier: "basic",
          stripeSubscriptionId: null,
          tierExpiresAt: null,
        })
        .where(eq(professionals.id, parseInt(professionalId)));

      console.log(`[Webhook] Professional ${professionalId} downgraded to basic tier`);
    }

    // If this was a listing tier subscription, downgrade user's listings to standard tier
    if (productId && (productId === "featured_weekly" || productId === "premium_weekly") && userId) {
      await db
        .update(listings)
        .set({ listingTier: "standard" })
        .where(eq(listings.sellerId, parseInt(userId)));
      
      console.log(`[Webhook] Downgraded user ${userId} listings to standard tier`);
      
      // Send email notification to user about tier downgrade
      const user = await getUserById(parseInt(userId));
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: "Your subscription has been canceled",
          text: `Your subscription has been canceled. Your listings have been reverted to standard tier. You can resubscribe anytime to regain Featured or Premium benefits.`,
          html: `<p>Your subscription has been canceled.</p><p>Your listings have been reverted to <strong>standard</strong> tier.</p><p>You can resubscribe anytime to regain Featured or Premium benefits.</p>`,
        });
      }
    }
  } catch (error) {
    console.error(`[Webhook] Failed to handle subscription cancellation:`, error);
    throw error;
  }
}


/**
 * Handle invoice payment succeeded (subscription renewal)
 * Updates subscription status and extends period
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;
  const subscriptionId = invoiceData.subscription as string | null;
  if (!subscriptionId) {
    console.log("[Webhook] No subscription ID in invoice");
    return;
  }

  console.log(`[Webhook] Invoice payment succeeded for subscription ${subscriptionId}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    // Fetch the full subscription from Stripe to get updated period end
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const subData = subscription as any;
    const currentPeriodEnd = new Date(subData.current_period_end * 1000);

    // Update subscription status to active and extend period
    await db
      .update(subscriptions)
      .set({
        status: "active",
        currentPeriodEnd: currentPeriodEnd.toISOString().slice(0, 19).replace('T', ' '),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`[Webhook] Subscription ${subscriptionId} renewed until ${currentPeriodEnd}`);
  } catch (error) {
    console.error(`[Webhook] Failed to update subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Handle invoice payment failed
 * Updates subscription status to past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const invoiceData = invoice as any;
  const subscriptionId = invoiceData.subscription as string | null;
  if (!subscriptionId) {
    console.log("[Webhook] No subscription ID in invoice");
    return;
  }

  console.log(`[Webhook] Invoice payment failed for subscription ${subscriptionId}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    // Update subscription status to past_due
    await db
      .update(subscriptions)
      .set({
        status: "past_due",
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

    console.log(`[Webhook] Subscription ${subscriptionId} marked as past_due`);

    // Send email notification to user about payment failure (maintain tier during grace period)
    const sub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1);
    
    if (sub.length > 0 && sub[0]) {
      const user = await getUserById(sub[0].userId);
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: "Payment failed for your subscription",
          text: `Your recent payment failed. Your listings will remain at their current tier during the grace period. Please update your payment method to avoid service interruption.`,
          html: `<p><strong>Payment Failed</strong></p><p>Your recent payment failed. Your listings will remain at their current tier during the grace period.</p><p>Please update your payment method to avoid service interruption.</p>`,
        });
      }
    }
  } catch (error) {
    console.error(`[Webhook] Failed to update subscription ${subscriptionId}:`, error);
    throw error;
  }
}

/**
 * Handle Stripe Identity verification completed
 * Updates user as verified when identity check passes
 */
async function handleIdentityVerified(session: Stripe.Identity.VerificationSession) {
  const metadata = session.metadata;
  const userId = metadata?.userId;

  if (!userId) {
    console.error("[Webhook] No userId in identity verification session metadata");
    return;
  }

  console.log(`[Webhook] Identity verification completed for user ${userId}`);

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database not available");
    return;
  }

  try {
    const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await db
      .update(users)
      .set({
        stripeIdentityVerified: 1,
        stripeIdentityVerifiedAt: nowStr,
        verificationStatus: 'verified',
        verificationTier: 'verified',
        verifiedAt: nowStr,
        verificationExpiresAt: oneYearFromNow,
      })
      .where(eq(users.id, parseInt(userId)));

    console.log(`[Webhook] User ${userId} marked as Stripe Identity verified`);

    // Send email notification
    const user = await getUserById(parseInt(userId));
    if (user?.email) {
      const emailTemplate = EmailTemplates.stripeIdentityVerified({
        recipientName: user.name || 'User',
        dashboardUrl: `${ENV.frontendUrl}/create-listing`,
      });
      await sendEmail({
        to: user.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html,
      });
      console.log(`[Webhook] Verification success email sent to ${user.email}`);
    }
  } catch (error) {
    console.error(`[Webhook] Failed to update user ${userId}:`, error);
    throw error;
  }
}
