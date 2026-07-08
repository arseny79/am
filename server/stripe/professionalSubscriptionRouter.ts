import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import Stripe from "stripe";
import { getDb } from "../db";
import { professionals } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-11-17.clover" })
  : null;

function getStripe(): Stripe {
  if (!stripe) {
    throw new Error("Stripe is not configured");
  }
  return stripe;
}

// Professional tier pricing (in cents)
const PROFESSIONAL_TIER_PRICING = {
  professional: {
    name: "Professional Directory Listing",
    description: "Priority placement, lead notifications, and verified badge",
    priceMonthly: 9900, // $99/month
    priceYearly: 99000, // $990/year (save $198)
  },
  premium: {
    name: "Premium Directory Listing",
    description: "Top placement, featured badge, analytics dashboard, and priority support",
    priceMonthly: 24900, // $249/month
    priceYearly: 249000, // $2,490/year (save $498)
  },
};

export const professionalSubscriptionRouter = router({
  /**
   * Create a subscription checkout session for professional tier upgrade
   */
  createSubscriptionCheckout: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["professional", "premium"]),
        billingPeriod: z.enum(["monthly", "yearly"]).default("monthly"),
        professionalId: z.number(),
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

      // Verify the professional belongs to this user
      const [professional] = await db
        .select()
        .from(professionals)
        .where(eq(professionals.id, input.professionalId))
        .limit(1);

      if (!professional) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Professional profile not found",
        });
      }

      if (professional.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only upgrade your own professional profile",
        });
      }

      const tierPricing = PROFESSIONAL_TIER_PRICING[input.tier];
      const price = input.billingPeriod === "yearly" ? tierPricing.priceYearly : tierPricing.priceMonthly;
      const interval = input.billingPeriod === "yearly" ? "year" : "month";

      // Get the origin from request headers for redirect URLs
      const origin = ctx.req.headers.origin || "http://localhost:3000";

      // Create Stripe checkout session for subscription
      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: tierPricing.name,
                description: tierPricing.description,
              },
              unit_amount: price,
              recurring: {
                interval: interval,
              },
            },
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${origin}/professionals/${input.professionalId}?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/professionals/join?subscription=cancelled`,
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          professionalId: input.professionalId.toString(),
          tier: input.tier,
          userId: ctx.user.id.toString(),
          type: "professional_subscription",
        },
        subscription_data: {
          metadata: {
            professionalId: input.professionalId.toString(),
            tier: input.tier,
            userId: ctx.user.id.toString(),
          },
        },
      });

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  /**
   * Get current subscription status for a professional
   */
  getSubscriptionStatus: protectedProcedure
    .input(z.object({ professionalId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const [professional] = await db
        .select()
        .from(professionals)
        .where(eq(professionals.id, input.professionalId))
        .limit(1);

      if (!professional) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Professional profile not found",
        });
      }

      // Only allow owner or admin to view subscription status
      if (professional.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Access denied",
        });
      }

      if (!professional.stripeSubscriptionId) {
        return {
          hasSubscription: false,
          tier: professional.tier,
          expiresAt: professional.tierExpiresAt,
        };
      }

      try {
        const subscription = await getStripe().subscriptions.retrieve(professional.stripeSubscriptionId) as any;
        
        return {
          hasSubscription: true,
          tier: professional.tier,
          status: subscription.status,
          currentPeriodEnd: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          expiresAt: professional.tierExpiresAt,
        };
      } catch (error) {
        // Subscription might have been deleted
        return {
          hasSubscription: false,
          tier: professional.tier,
          expiresAt: professional.tierExpiresAt,
        };
      }
    }),

  /**
   * Cancel subscription (at end of billing period)
   */
  cancelSubscription: protectedProcedure
    .input(z.object({ professionalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      const [professional] = await db
        .select()
        .from(professionals)
        .where(eq(professionals.id, input.professionalId))
        .limit(1);

      if (!professional) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Professional profile not found",
        });
      }

      if (professional.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only cancel your own subscription",
        });
      }

      if (!professional.stripeSubscriptionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No active subscription found",
        });
      }

      // Cancel at end of billing period
      await getStripe().subscriptions.update(professional.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      return { success: true };
    }),

  /**
   * Get tier pricing info
   */
  getTierPricing: protectedProcedure.query(async () => {
    return {
      professional: {
        ...PROFESSIONAL_TIER_PRICING.professional,
        priceMonthlyFormatted: "$99/month",
        priceYearlyFormatted: "$990/year",
        savings: "$198/year",
      },
      premium: {
        ...PROFESSIONAL_TIER_PRICING.premium,
        priceMonthlyFormatted: "$249/month",
        priceYearlyFormatted: "$2,490/year",
        savings: "$498/year",
      },
    };
  }),
});

export type ProfessionalSubscriptionRouter = typeof professionalSubscriptionRouter;
