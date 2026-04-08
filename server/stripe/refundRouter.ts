import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import Stripe from "stripe";
import { getDb } from "../db";
import { listings, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { sendRefundConfirmationEmail } from "./emailReceipts";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-11-17.clover" })
  : null;

export const refundRouter = router({
  /**
   * Process a refund for a listing fee payment (admin only)
   */
  processRefund: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        reason: z.string().min(10, "Please provide a detailed reason for the refund"),
        refundAmount: z.number().optional(), // Optional: partial refund
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify admin role
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can process refunds",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Get listing details
      const listingResult = await db
        .select({
          id: listings.id,
          businessName: listings.businessName,
          sellerId: listings.sellerId,
          paymentStatus: listings.paymentStatus,
          stripePaymentIntentId: listings.stripePaymentIntentId,
          listingTier: listings.listingTier,
        })
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (listingResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Listing not found",
        });
      }

      const listing = listingResult[0]!;

      if (listing.paymentStatus !== "paid") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot refund a listing that hasn't been paid",
        });
      }

      if (!listing.stripePaymentIntentId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No payment intent found for this listing",
        });
      }

      // Get seller details
      const sellerResult = await db
        .select({
          email: users.email,
          name: users.name,
        })
        .from(users)
        .where(eq(users.id, listing.sellerId))
        .limit(1);

      if (sellerResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Seller not found",
        });
      }

      const seller = sellerResult[0]!;

      try {
        // Process refund through Stripe
        const refund = await stripe.refunds.create({
          payment_intent: listing.stripePaymentIntentId,
          amount: input.refundAmount
            ? Math.round(input.refundAmount * 100) // Convert to cents
            : undefined, // Full refund if not specified
          reason: "requested_by_customer",
          metadata: {
            listing_id: input.listingId.toString(),
            admin_reason: input.reason,
            processed_by: ctx.user.id.toString(),
          },
        });

        // Update listing status
        await db
          .update(listings)
          .set({
            paymentStatus: "refunded",
            isPublished: 0,
            status: "withdrawn",
          })
          .where(eq(listings.id, input.listingId));

        // Send refund confirmation email
        if (seller.email) {
          await sendRefundConfirmationEmail(
            seller.email,
            seller.name || "Customer",
            listing.businessName,
            refund.amount / 100, // Convert cents to dollars
            input.reason
          );
        }

        return {
          success: true,
          refundId: refund.id,
          amount: refund.amount / 100,
          status: refund.status,
        };
      } catch (error) {
        console.error("[Refund] Failed to process refund:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to process refund",
        });
      }
    }),

  /**
   * Get refund history for a listing (admin only)
   */
  getRefundHistory: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify admin role
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only administrators can view refund history",
        });
      }

      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Get listing payment details
      const listingResult = await db
        .select({
          stripePaymentIntentId: listings.stripePaymentIntentId,
          paymentStatus: listings.paymentStatus,
        })
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (listingResult.length === 0 || !listingResult[0]?.stripePaymentIntentId) {
        return [];
      }

      try {
        // Fetch refunds from Stripe
        const refunds = await stripe.refunds.list({
          payment_intent: listingResult[0].stripePaymentIntentId,
          limit: 10,
        });

        return refunds.data.map((refund) => ({
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status,
          reason: refund.reason,
          created: new Date(refund.created * 1000),
          metadata: refund.metadata,
        }));
      } catch (error) {
        console.error("[Refund] Failed to fetch refund history:", error);
        return [];
      }
    }),
});
