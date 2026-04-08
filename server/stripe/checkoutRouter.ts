import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import Stripe from "stripe";
import { getProductForTier } from "./products";
import type { ListingTier } from "@shared/pricing";
import { getDb } from "../db";
import { pricePlans, listings } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-11-17.clover" })
  : null;

export const stripeCheckoutRouter = router({
  /**
   * Create a checkout session for listing fee payment
   */
  createListingFeeCheckout: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["standard", "featured", "premium"]),
        listingId: z.number().optional(), // Optional: link to existing draft listing
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch dynamic pricing from database
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Map tier names to database tier values
      const tierMap: Record<string, string> = {
        standard: "free",
        featured: "featured",
        premium: "premium_featured",
      };

      const dbTier = tierMap[input.tier] as "free" | "featured" | "premium_featured";
      const [plan] = await db
        .select()
        .from(pricePlans)
        .where(and(eq(pricePlans.tier, dbTier), eq(pricePlans.isActive, 1)))
        .limit(1);

      if (!plan) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Pricing plan not found for tier: ${input.tier}`,
        });
      }

      // Get the origin from request headers for redirect URLs
      const origin = ctx.req.headers.origin || "http://localhost:3000";
      
      // Create Stripe checkout session with dynamic pricing
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: plan.name,
                description: plan.description || `${plan.name} - ${plan.successFeePercentage / 100}% success fee`,
              },
              unit_amount: plan.price * 100, // Convert dollars to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/my-listings?payment=success&listing_id=${input.listingId || ''}`,
        cancel_url: `${origin}/create-listing?payment=cancelled`,
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          customer_email: ctx.user.email || "",
          customer_name: ctx.user.name || "",
          tier: input.tier,
          listing_id: input.listingId?.toString() || "",
        },
        allow_promotion_codes: true,
      });

      // Update listing with stripe session ID if listingId provided
      if (input.listingId) {
        await db
          .update(listings)
          .set({
            stripeSessionId: session.id,
            paymentStatus: "pending",
          })
          .where(eq(listings.id, input.listingId));
      }

      return {
        sessionId: session.id,
        url: session.url,
      };
    }),

  /**
   * Verify a checkout session was completed
   */
  verifyCheckoutSession: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .query(async ({ input }) => {
      const session = await stripe.checkout.sessions.retrieve(input.sessionId);
      
      return {
        status: session.payment_status,
        tier: session.metadata?.tier as ListingTier | undefined,
        listingId: session.metadata?.listing_id
          ? parseInt(session.metadata.listing_id)
          : undefined,
        amountTotal: session.amount_total,
        customerEmail: session.customer_email,
      };
    }),
});
