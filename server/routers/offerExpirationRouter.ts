import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { offerHistory } from "../../drizzle/schema";
import { eq, and, lt } from "drizzle-orm";
import * as db from "../db";

export const offerExpirationRouter = router({
  // Check and mark expired offers
  checkExpiredOffers: protectedProcedure
    .mutation(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const now = new Date();

      // Find all pending offers that have expired
      const expiredOffers = await database
        .select()
        .from(offerHistory)
        .where(
          and(
            eq(offerHistory.status, "pending"),
            lt(offerHistory.expiresAt, now)
          )
        );

      if (expiredOffers.length === 0) {
        return { expiredCount: 0, expiredOffers: [] };
      }

      // Mark each offer as expired
      for (const offer of expiredOffers) {
        await database
          .update(offerHistory)
          .set({
            status: "expired",
            respondedAt: now,
          })
          .where(eq(offerHistory.id, offer.id));

        // Log activity for each expired offer
        await db.createDealActivity({
          dealId: offer.dealId,
          userId: offer.offeredBy,
          activityType: "negotiation_update",
          description: `Offer of $${offer.amount.toLocaleString()} expired after 72 hours.`,
          metadata: JSON.stringify({
            offerId: offer.id,
            offerType: offer.offerType,
            amount: offer.amount,
            expiresAt: offer.expiresAt,
          }),
        });

        // Notify the offer creator that their offer expired
        const offerCreator = await db.getUserById(offer.offeredBy);
        if (offerCreator) {
          await db.createNotification({
            userId: offer.offeredBy,
            type: "negotiation_update",
            title: "Offer expired",
            message: `Your offer of $${offer.amount.toLocaleString()} expired after 72 hours without a response.`,
            relatedEntityType: "deal",
            relatedEntityId: offer.dealId,
            isRead: 0,
            emailSent: 0,
          });
        }
      }

      return {
        expiredCount: expiredOffers.length,
        expiredOffers: expiredOffers.map(o => ({
          id: o.id,
          dealId: o.dealId,
          amount: o.amount,
          offerType: o.offerType,
        })),
      };
    }),

  // Get offers expiring soon (within 24 or 48 hours)
  getExpiringSoon: protectedProcedure
    .input(z.object({
      dealId: z.number().optional(),
      hoursThreshold: z.number().default(48), // Default to 48 hours
    }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const now = new Date();
      const threshold = new Date();
      threshold.setHours(threshold.getHours() + input.hoursThreshold);

      let query = database
        .select()
        .from(offerHistory)
        .where(
          and(
            eq(offerHistory.status, "pending"),
            lt(offerHistory.expiresAt, threshold)
          )
        );

      const expiringSoonOffers = await query;

      // Filter by dealId if provided
      const filtered = input.dealId
        ? expiringSoonOffers.filter(o => o.dealId === input.dealId)
        : expiringSoonOffers;

      // Filter to only offers where current user is involved
      const userDeals = await Promise.all(
        filtered.map(async (offer) => {
          const deal = await db.getDealById(offer.dealId);
          if (!deal) return null;
          
          // Only return offers where user is buyer or seller
          if (deal.buyerId === ctx.user.id || deal.sellerId === ctx.user.id || ctx.user.role === 'admin') {
            return {
              ...offer,
              deal,
              hoursRemaining: Math.max(0, Math.floor((offer.expiresAt!.getTime() - now.getTime()) / (1000 * 60 * 60))),
            };
          }
          return null;
        })
      );

      return userDeals.filter(o => o !== null);
    }),
});
