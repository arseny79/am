import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { offerHistory, deals } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import * as db from "../db";
import * as emailNotifications from "../emailNotifications";

export const offerHistoryRouter = router({
  // Get all offers for a deal
  getByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Allow admins to view all deals, otherwise restrict to buyer/seller
      if (ctx.user.role !== 'admin' && deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const offers = await database
        .select()
        .from(offerHistory)
        .where(eq(offerHistory.dealId, input.dealId))
        .orderBy(desc(offerHistory.createdAt));

      // Enrich with user info
      const enriched = await Promise.all(
        offers.map(async (offer) => {
          const offeredByUser = await db.getUserById(offer.offeredBy);
          const respondedByUser = offer.respondedBy ? await db.getUserById(offer.respondedBy) : null;
          
          return {
            ...offer,
            offeredByUser,
            respondedByUser,
          };
        })
      );

      return enriched;
    }),

  // Seller responds to buyer's counter-offer with their own counter
  sellerCounterOffer: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      buyerOfferId: z.number(), // The buyer's offer being responded to
      counterAmount: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Only seller can make seller counter-offers
      if (deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the seller can make counter-offers" });
      }

      // Must be in negotiation stage
      if (deal.stage !== "negotiation") {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Can only counter-offer during negotiation stage" 
        });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Mark buyer's offer as superseded
      await database
        .update(offerHistory)
        .set({
          status: "superseded",
          respondedBy: ctx.user.id,
          respondedAt: new Date(),
        })
        .where(eq(offerHistory.id, input.buyerOfferId));

      // Create seller's counter-offer
      await database.insert(offerHistory).values({
        dealId: input.dealId,
        offeredBy: ctx.user.id,
        offerType: "seller_counter_offer",
        amount: input.counterAmount,
        reason: input.reason,
        status: "pending",
      });

      // Log activity
      const listing = await db.getListingById(deal.listingId);
      await db.createDealActivity({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: "negotiation_update",
        description: `Seller proposed counter-offer of $${input.counterAmount.toLocaleString()}.`,
        metadata: JSON.stringify({
          counterAmount: input.counterAmount,
          reason: input.reason,
        }),
      });

      // Notify buyer
      const buyer = await db.getUserById(deal.buyerId);
      await db.createNotification({
        userId: deal.buyerId,
        type: "negotiation_update",
        title: "Seller counter-offer received",
        message: `${ctx.user.name} proposed a counter-offer of $${input.counterAmount.toLocaleString()} for ${listing?.businessName}.`,
        relatedEntityType: "deal",
        relatedEntityId: deal.id,
        isRead: 0,
        emailSent: 0,
      });

      return { success: true };
    }),

  // Accept an offer (buyer accepts seller's counter, or seller accepts buyer's counter)
  acceptOffer: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      offerId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Must be buyer or seller
      if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Get the offer being accepted
      const offers = await database
        .select()
        .from(offerHistory)
        .where(eq(offerHistory.id, input.offerId))
        .limit(1);

      if (offers.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offer not found" });
      }

      const offer = offers[0];

      // Validate: buyer can only accept seller offers, seller can only accept buyer offers
      const isBuyer = deal.buyerId === ctx.user.id;
      const isSellerOffer = offer.offerType === "seller_counter_offer";
      const isBuyerOffer = offer.offerType === "buyer_counter_offer";

      if (isBuyer && !isSellerOffer) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Buyers can only accept seller counter-offers" });
      }

      if (!isBuyer && !isBuyerOffer) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sellers can only accept buyer counter-offers" });
      }

      // Mark offer as accepted
      await database
        .update(offerHistory)
        .set({
          status: "accepted",
          respondedBy: ctx.user.id,
          respondedAt: new Date(),
          responseNotes: input.notes,
        })
        .where(eq(offerHistory.id, input.offerId));

      // Mark all other pending offers as superseded
      await database
        .update(offerHistory)
        .set({ status: "superseded" })
        .where(
          and(
            eq(offerHistory.dealId, input.dealId),
            eq(offerHistory.status, "pending")
          )
        );

      // Create final accepted offer record
      await database.insert(offerHistory).values({
        dealId: input.dealId,
        offeredBy: ctx.user.id,
        offerType: "final_accepted_offer",
        amount: offer.amount,
        reason: `Accepted ${isSellerOffer ? "seller's" : "buyer's"} offer`,
        status: "accepted",
      });

      // Update deal to move to next stage (escrow)
      await database
        .update(deals)
        .set({
          stage: "escrow",
          updatedAt: new Date(),
        })
        .where(eq(deals.id, input.dealId));

      // Log activity
      const listing = await db.getListingById(deal.listingId);
      await db.createDealActivity({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: "stage_changed",
        description: `${isBuyer ? "Buyer" : "Seller"} accepted offer of $${offer.amount.toLocaleString()}. Deal advanced to escrow stage.`,
        metadata: JSON.stringify({
          oldStage: deal.stage,
          newStage: "escrow",
          acceptedAmount: offer.amount,
          notes: input.notes,
        }),
      });

      // Notify other party
      const otherPartyId = isBuyer ? deal.sellerId : deal.buyerId;
      const otherParty = await db.getUserById(otherPartyId);
      
      await db.createNotification({
        userId: otherPartyId,
        type: "deal_stage_changed",
        title: "Offer accepted!",
        message: `${ctx.user.name} accepted your offer of $${offer.amount.toLocaleString()} for ${listing?.businessName}. Deal is now in escrow.`,
        relatedEntityType: "deal",
        relatedEntityId: deal.id,
        isRead: 0,
        emailSent: 0,
      });

      // Send email notification
      await emailNotifications.sendDealStageChangeNotification({
        buyerName: isBuyer ? ctx.user.name || "Buyer" : otherParty?.name || "Buyer",
        sellerName: isBuyer ? otherParty?.name || "Seller" : ctx.user.name || "Seller",
        listingName: listing?.businessName || "the listing",
        newStage: "escrow",
      });

      return { success: true };
    }),

  // Reject an offer
  rejectOffer: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      offerId: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Must be buyer or seller
      if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Get the offer being rejected
      const offers = await database
        .select()
        .from(offerHistory)
        .where(eq(offerHistory.id, input.offerId))
        .limit(1);

      if (offers.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Offer not found" });
      }

      const offer = offers[0];

      // Mark offer as rejected
      await database
        .update(offerHistory)
        .set({
          status: "rejected",
          respondedBy: ctx.user.id,
          respondedAt: new Date(),
          responseNotes: input.reason,
        })
        .where(eq(offerHistory.id, input.offerId));

      // Log activity
      const listing = await db.getListingById(deal.listingId);
      const isBuyer = deal.buyerId === ctx.user.id;
      
      await db.createDealActivity({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: "negotiation_update",
        description: `${isBuyer ? "Buyer" : "Seller"} rejected offer of $${offer.amount.toLocaleString()}.`,
        metadata: JSON.stringify({
          rejectedAmount: offer.amount,
          reason: input.reason,
        }),
      });

      // Notify other party
      const otherPartyId = isBuyer ? deal.sellerId : deal.buyerId;
      
      await db.createNotification({
        userId: otherPartyId,
        type: "negotiation_update",
        title: "Offer rejected",
        message: `${ctx.user.name} rejected your offer of $${offer.amount.toLocaleString()} for ${listing?.businessName}.`,
        relatedEntityType: "deal",
        relatedEntityId: deal.id,
        isRead: 0,
        emailSent: 0,
      });

      return { success: true };
    }),
});
