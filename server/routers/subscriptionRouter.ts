import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { subscriptions } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-11-17.clover" })
  : null;

export const subscriptionRouter = router({
  /**
   * Get user's active subscriptions
   */
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userSubs = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, ctx.user.id),
          eq(subscriptions.status, "active")
        )
      );

    return userSubs;
  }),

  /**
   * Get all user's subscriptions (including canceled/expired)
   */
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const userSubs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id));

    return userSubs;
  }),

  /**
   * Cancel subscription at period end
   */
  cancel: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify subscription belongs to user
      const sub = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.id, input.subscriptionId),
            eq(subscriptions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (sub.length === 0) {
        throw new Error("Subscription not found");
      }

      const subscription = sub[0]!;

      // Cancel subscription in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      // Update database
      await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: 1,
        })
        .where(eq(subscriptions.id, input.subscriptionId));

      return { success: true };
    }),

  /**
   * Reactivate a canceled subscription (remove cancel_at_period_end)
   */
  reactivate: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify subscription belongs to user
      const sub = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.id, input.subscriptionId),
            eq(subscriptions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (sub.length === 0) {
        throw new Error("Subscription not found");
      }

      const subscription = sub[0]!;

      // Reactivate subscription in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      // Update database
      await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: 0,
        })
        .where(eq(subscriptions.id, input.subscriptionId));

      return { success: true };
    }),

  /**
   * Create Stripe Customer Portal session for managing billing
   */
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get user's most recent subscription to find customer ID
    const userSubs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id))
      .limit(1);

    if (userSubs.length === 0) {
      throw new Error("No subscriptions found");
    }

    const customerId = userSubs[0]!.stripeCustomerId;

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.VITE_APP_URL || "https://acquisition.market"}/dashboard/payments`,
    });

    return { url: session.url };
  }),

  /**
   * Upgrade/change subscription to a different tier
   */
  upgrade: protectedProcedure
    .input(
      z.object({
        subscriptionId: z.number(),
        newProductId: z.enum(["featured_weekly", "premium_weekly"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify subscription belongs to user
      const sub = await db
        .select()
        .from(subscriptions)
        .where(
          and(
            eq(subscriptions.id, input.subscriptionId),
            eq(subscriptions.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (sub.length === 0) {
        throw new Error("Subscription not found");
      }

      const subscription = sub[0]!;

      // Get the Stripe subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(
        subscription.stripeSubscriptionId
      );

      // Get the new price ID based on product
      const priceId =
        input.newProductId === "featured_weekly"
          ? process.env.STRIPE_PRICE_FEATURED_WEEKLY
          : process.env.STRIPE_PRICE_PREMIUM_WEEKLY;

      if (!priceId) {
        throw new Error("Price ID not configured");
      }

      // Update subscription in Stripe
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [
          {
            id: stripeSubscription.items.data[0]!.id,
            price: priceId,
          },
        ],
        proration_behavior: "create_prorations",
      });

      // Update database
      await db
        .update(subscriptions)
        .set({
          productId: input.newProductId,
        })
        .where(eq(subscriptions.id, input.subscriptionId));

      return { success: true };
    }),
});
