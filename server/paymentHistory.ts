import { eq, and, desc } from "drizzle-orm";
import { getDb } from "./db";
import { listings } from "../drizzle/schema";
import { protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const paymentHistoryRouter = router({
  /**
   * Get payment history for the current user's listings
   */
  getMyPayments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const payments = await db
      .select({
        id: listings.id,
        businessName: listings.businessName,
        listingTier: listings.listingTier,
        paymentStatus: listings.paymentStatus,
        paidAt: listings.paidAt,
        stripeSessionId: listings.stripeSessionId,
        stripePaymentIntentId: listings.stripePaymentIntentId,
        createdAt: listings.createdAt,
      })
      .from(listings)
      .where(
        and(
          eq(listings.sellerId, ctx.user.id),
          eq(listings.paymentStatus, "paid")
        )
      )
      .orderBy(desc(listings.paidAt));

    return payments;
  }),

  /**
   * Get payment details for a specific listing
   */
  getPaymentDetails: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const result = await db
        .select({
          id: listings.id,
          businessName: listings.businessName,
          listingTier: listings.listingTier,
          paymentStatus: listings.paymentStatus,
          paidAt: listings.paidAt,
          stripeSessionId: listings.stripeSessionId,
          stripePaymentIntentId: listings.stripePaymentIntentId,
          sellerId: listings.sellerId,
        })
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (result.length === 0) {
        throw new Error("Listing not found");
      }

      const payment = result[0];

      // Verify user owns this listing
      if (payment.sellerId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return payment;
    }),
});
