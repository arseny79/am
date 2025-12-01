import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { dealMilestones, deals } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";
import * as db from "../db";

export const milestoneRouter = router({
  // Get all milestones for a deal
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

      const milestones = await database
        .select()
        .from(dealMilestones)
        .where(eq(dealMilestones.dealId, input.dealId));

      // Enrich with user info
      const enrichedMilestones = await Promise.all(
        milestones.map(async (milestone) => {
          const completedByUser = milestone.completedBy 
            ? await db.getUserById(milestone.completedBy)
            : null;
          
          return {
            ...milestone,
            completedByUser,
          };
        })
      );

      return enrichedMilestones;
    }),

  // Complete a milestone
  complete: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      milestoneType: z.enum([
        "nda_signed",
        "financials_reviewed",
        "offer_submitted",
        "loi_signed",
        "final_agreement_signed",
        "escrow_funded",
        "assets_transferred"
      ]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Allow admins to access all deals, otherwise restrict to buyer/seller
      if (ctx.user.role !== 'admin' && deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Check if milestone already exists
      const existing = await database
        .select()
        .from(dealMilestones)
        .where(
          and(
            eq(dealMilestones.dealId, input.dealId),
            eq(dealMilestones.milestoneType, input.milestoneType)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing milestone
        await database
          .update(dealMilestones)
          .set({
            completedAt: new Date(),
            completedBy: ctx.user.id,
            notes: input.notes,
          })
          .where(eq(dealMilestones.id, existing[0].id));
      } else {
        // Create new milestone
        await database.insert(dealMilestones).values({
          dealId: input.dealId,
          milestoneType: input.milestoneType,
          completedAt: new Date(),
          completedBy: ctx.user.id,
          notes: input.notes,
        });
      }

      // Log activity
      const milestoneLabels: Record<string, string> = {
        nda_signed: "NDA Signed",
        financials_reviewed: "Financials Reviewed",
        offer_submitted: "Offer Submitted",
        loi_signed: "Letter of Intent Signed",
        final_agreement_signed: "Final Agreement Signed",
        escrow_funded: "Escrow Funded",
        assets_transferred: "Assets Transferred",
      };

      await db.createDealActivity({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: "milestone_completed",
        description: `Milestone completed: ${milestoneLabels[input.milestoneType]}`,
        metadata: JSON.stringify({
          milestoneType: input.milestoneType,
          notes: input.notes,
        }),
      });

      // Notify other party
      const otherUserId = ctx.user.id === deal.buyerId ? deal.sellerId : deal.buyerId;
      const listing = await db.getListingById(deal.listingId);

      await db.createNotification({
        userId: otherUserId,
        type: "milestone_completed",
        title: "Deal milestone completed",
        message: `${ctx.user.name} completed milestone: ${milestoneLabels[input.milestoneType]} for "${listing?.businessName}"`,
        relatedEntityType: "deal",
        relatedEntityId: deal.id,
        isRead: 0,
        emailSent: 0,
      });

      return { success: true };
    }),

  // Uncomplete a milestone (admin or deal participants)
  uncomplete: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      milestoneType: z.enum([
        "nda_signed",
        "financials_reviewed",
        "offer_submitted",
        "loi_signed",
        "final_agreement_signed",
        "escrow_funded",
        "assets_transferred"
      ]),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Allow admins to access all deals, otherwise restrict to buyer/seller
      if (ctx.user.role !== 'admin' && deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Delete the milestone
      await database
        .delete(dealMilestones)
        .where(
          and(
            eq(dealMilestones.dealId, input.dealId),
            eq(dealMilestones.milestoneType, input.milestoneType)
          )
        );

      return { success: true };
    }),
});
