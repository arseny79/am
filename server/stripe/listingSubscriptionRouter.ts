import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import Stripe from "stripe";
import { getDb } from "../db";
import { listings, pricePlans, users } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

/**
 * Listing Subscription Router
 * Handles recurring weekly subscriptions for Featured ($99/week) and Premium ($249/week) listings
 * 
 * Flow:
 * 1. User selects tier and creates/upgrades listing
 * 2. Create Stripe Checkout Session in subscription mode
 * 3. User completes payment
 * 4. Webhook receives subscription.created event
 * 5. Listing tier is updated and activated
 * 6. Weekly billing continues until canceled
 */
export const listingSubscriptionRouter = router({
  /**
   * Create a subscription checkout session for a listing
   */
  createSubscription: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        tier: z.enum(["featured", "premium_featured"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verify listing exists and belongs to user
      const [listing] = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.id, input.listingId),
            eq(listings.sellerId, ctx.user.id)
          )
        )
        .limit(1);

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found or you don't have permission",
        });
      }

      // Check if listing already has an active subscription
      if (listing.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Listing already has an active subscription. Please cancel it first or use upgrade.",
        });
      }

      // Get pricing from database
      const [plan] = await db
        .select()
        .from(pricePlans)
        .where(and(eq(pricePlans.tier, input.tier), eq(pricePlans.isActive, 1)))
        .limit(1);

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Pricing plan not found for tier: ${input.tier}`,
        });
      }

      // Get or create Stripe customer
      let stripeCustomerId = ctx.user.stripeCustomerId;
      
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: ctx.user.email || undefined,
          name: ctx.user.name || undefined,
          metadata: {
            userId: ctx.user.id.toString(),
          },
        });
        stripeCustomerId = customer.id;
        
        // Update user with Stripe customer ID
        await db
          .update(users)
          .set({ stripeCustomerId: customer.id })
          .where(eq(users.id, ctx.user.id));
      }

      // Get origin for redirect URLs
      const origin = ctx.req.headers.origin || "http://localhost:3000";

      // Create or get Stripe Price for weekly subscription
      // Using price_data for dynamic pricing from database
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${plan.name} - ${listing.businessName}`,
                description: plan.description || `Weekly subscription for ${plan.name}`,
                metadata: {
                  tier: input.tier,
                  listingId: input.listingId.toString(),
                },
              },
              unit_amount: plan.price, // Already in cents from database
              recurring: {
                interval: "week",
                interval_count: 1,
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/my-listings?subscription=success&listing_id=${input.listingId}`,
        cancel_url: `${origin}/my-listings?subscription=cancelled&listing_id=${input.listingId}`,
        subscription_data: {
          metadata: {
            listingId: input.listingId.toString(),
            userId: ctx.user.id.toString(),
            tier: input.tier,
          },
        },
        allow_promotion_codes: true,
        metadata: {
          listingId: input.listingId.toString(),
          userId: ctx.user.id.toString(),
          tier: input.tier,
          type: "listing_subscription",
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  /**
   * Cancel a listing subscription
   */
  cancelSubscription: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        cancelImmediately: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verify listing exists and belongs to user
      const [listing] = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.id, input.listingId),
            eq(listings.sellerId, ctx.user.id)
          )
        )
        .limit(1);

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found or you don't have permission",
        });
      }

      if (!listing.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Listing does not have an active subscription",
        });
      }

      // Cancel the subscription
      if (input.cancelImmediately) {
        // Cancel immediately
        await stripe.subscriptions.cancel(listing.stripeSubscriptionId);
      } else {
        // Cancel at end of current period
        await stripe.subscriptions.update(listing.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });
      }

      return {
        success: true,
        message: input.cancelImmediately
          ? "Subscription cancelled immediately"
          : "Subscription will cancel at the end of the current billing period",
      };
    }),

  /**
   * Upgrade subscription (Featured -> Premium)
   */
  upgradeSubscription: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        newTier: z.enum(["premium_featured"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verify listing exists and belongs to user
      const [listing] = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.id, input.listingId),
            eq(listings.sellerId, ctx.user.id)
          )
        )
        .limit(1);

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found or you don't have permission",
        });
      }

      if (!listing.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Listing does not have an active subscription to upgrade",
        });
      }

      if (listing.tier === "premium_featured") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Listing is already at the highest tier",
        });
      }

      // Get new pricing
      const [newPlan] = await db
        .select()
        .from(pricePlans)
        .where(and(eq(pricePlans.tier, input.newTier), eq(pricePlans.isActive, 1)))
        .limit(1);

      if (!newPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Pricing plan not found for tier: ${input.newTier}`,
        });
      }

      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(listing.stripeSubscriptionId);
      
      // Create new price for the upgrade
      const newPrice = await stripe.prices.create({
        currency: "usd",
        unit_amount: newPlan.price,
        recurring: {
          interval: "week",
          interval_count: 1,
        },
        product_data: {
          name: `${newPlan.name} - ${listing.businessName}`,
          metadata: {
            tier: input.newTier,
            listingId: input.listingId.toString(),
          },
        },
      });

      // Update subscription with new price (prorated)
      await stripe.subscriptions.update(listing.stripeSubscriptionId, {
        items: [
          {
            id: subscription.items.data[0]?.id,
            price: newPrice.id,
          },
        ],
        proration_behavior: "create_prorations",
        metadata: {
          ...subscription.metadata,
          tier: input.newTier,
        },
      });

      // Update listing tier in database
      await db
        .update(listings)
        .set({
          tier: input.newTier,
        })
        .where(eq(listings.id, input.listingId));

      return {
        success: true,
        message: `Subscription upgraded to ${newPlan.name}`,
        newTier: input.newTier,
      };
    }),

  /**
   * Downgrade subscription (Premium -> Featured)
   */
  downgradeSubscription: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        newTier: z.enum(["featured"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verify listing exists and belongs to user
      const [listing] = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.id, input.listingId),
            eq(listings.sellerId, ctx.user.id)
          )
        )
        .limit(1);

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found or you don't have permission",
        });
      }

      if (!listing.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Listing does not have an active subscription to downgrade",
        });
      }

      if (listing.tier !== "premium_featured") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Listing is not at Premium tier",
        });
      }

      // Get new pricing
      const [newPlan] = await db
        .select()
        .from(pricePlans)
        .where(and(eq(pricePlans.tier, input.newTier), eq(pricePlans.isActive, 1)))
        .limit(1);

      if (!newPlan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Pricing plan not found for tier: ${input.newTier}`,
        });
      }

      // Get current subscription
      const subscription = await stripe.subscriptions.retrieve(listing.stripeSubscriptionId);
      
      // Create new price for the downgrade
      const newPrice = await stripe.prices.create({
        currency: "usd",
        unit_amount: newPlan.price,
        recurring: {
          interval: "week",
          interval_count: 1,
        },
        product_data: {
          name: `${newPlan.name} - ${listing.businessName}`,
          metadata: {
            tier: input.newTier,
            listingId: input.listingId.toString(),
          },
        },
      });

      // Update subscription - downgrade takes effect at end of period
      await stripe.subscriptions.update(listing.stripeSubscriptionId, {
        items: [
          {
            id: subscription.items.data[0]?.id,
            price: newPrice.id,
          },
        ],
        proration_behavior: "none", // No proration for downgrades
        metadata: {
          ...subscription.metadata,
          tier: input.newTier,
          pendingDowngrade: "true",
        },
      });

      return {
        success: true,
        message: `Subscription will downgrade to ${newPlan.name} at the end of the current billing period`,
        newTier: input.newTier,
      };
    }),

  /**
   * Get subscription status for a listing
   */
  getSubscriptionStatus: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verify listing exists and belongs to user
      const [listing] = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.id, input.listingId),
            eq(listings.sellerId, ctx.user.id)
          )
        )
        .limit(1);

      if (!listing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found or you don't have permission",
        });
      }

      if (!listing.stripeSubscriptionId) {
        return {
          hasSubscription: false,
          tier: listing.tier,
          status: "none",
        };
      }

      // Get subscription from Stripe
      const subscriptionResponse = await stripe.subscriptions.retrieve(listing.stripeSubscriptionId);
      const subscription = subscriptionResponse as Stripe.Subscription;

      return {
        hasSubscription: true,
        tier: listing.tier,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: subscription.items.data[0]?.current_period_end 
          ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
          : null,
        currentPeriodStart: subscription.items.data[0]?.current_period_start
          ? new Date(subscription.items.data[0].current_period_start * 1000).toISOString()
          : null,
      };
    }),
});
