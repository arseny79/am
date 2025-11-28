import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import Stripe from "stripe";
import { getProductForTier } from "./products";
import type { ListingTier } from "@shared/pricing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

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
      const product = getProductForTier(input.tier as ListingTier);
      
      // Get the origin from request headers for redirect URLs
      const origin = ctx.req.headers.origin || "http://localhost:3000";
      
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: product.name,
                description: product.description,
              },
              unit_amount: product.priceAmount,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
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
