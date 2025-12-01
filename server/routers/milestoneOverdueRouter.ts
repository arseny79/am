import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { dealMilestones, deals } from "../../drizzle/schema";
import { eq, and, isNull, lt } from "drizzle-orm";
import * as db from "../db";
import * as emailNotifications from "../emailNotifications";

export const milestoneOverdueRouter = router({
  // Get overdue milestones for a specific deal
  getOverdueByDeal: protectedProcedure
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

      const now = new Date();
      const overdueMilestones = await database
        .select()
        .from(dealMilestones)
        .where(
          and(
            eq(dealMilestones.dealId, input.dealId),
            isNull(dealMilestones.completedAt), // Not completed
            lt(dealMilestones.expectedCompletionDate, now) // Past due date
          )
        );

      return overdueMilestones;
    }),

  // Get all overdue milestones for current user's deals
  getMyOverdueMilestones: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Get all deals where user is buyer or seller
      const userDeals = await db.getDealsByUser(ctx.user.id);
      const dealIds = userDeals.map(d => d.id);

      if (dealIds.length === 0) {
        return [];
      }

      const now = new Date();
      const overdueMilestones = await database
        .select()
        .from(dealMilestones)
        .where(
          and(
            isNull(dealMilestones.completedAt),
            lt(dealMilestones.expectedCompletionDate, now)
          )
        );

      // Filter to only user's deals
      const userOverdueMilestones = overdueMilestones.filter(m => 
        dealIds.includes(m.dealId)
      );

      // Enrich with deal info
      const enriched = await Promise.all(
        userOverdueMilestones.map(async (milestone) => {
          const deal = await db.getDealById(milestone.dealId);
          const listing = deal ? await db.getListingById(deal.listingId) : null;
          
          return {
            ...milestone,
            deal,
            listing,
          };
        })
      );

      return enriched;
    }),

  // Set expected completion date for a milestone
  setExpectedDate: protectedProcedure
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
      expectedDate: z.string(), // ISO date string
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

      // Check if milestone exists
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

      const expectedDate = new Date(input.expectedDate);

      if (existing.length > 0) {
        // Update existing milestone
        await database
          .update(dealMilestones)
          .set({
            expectedCompletionDate: expectedDate,
          })
          .where(eq(dealMilestones.id, existing[0].id));
      } else {
        // Create new milestone with expected date
        await database.insert(dealMilestones).values({
          dealId: input.dealId,
          milestoneType: input.milestoneType,
          expectedCompletionDate: expectedDate,
        });
      }

      return { success: true };
    }),

  // Send reminder emails for overdue milestones (called by cron job)
  sendOverdueReminders: protectedProcedure
    .mutation(async ({ ctx }) => {
      // Only admins can trigger reminder emails
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const now = new Date();
      const overdueMilestones = await database
        .select()
        .from(dealMilestones)
        .where(
          and(
            isNull(dealMilestones.completedAt),
            lt(dealMilestones.expectedCompletionDate, now)
          )
        );

      let remindersSent = 0;

      for (const milestone of overdueMilestones) {
        const deal = await database
          .select()
          .from(deals)
          .where(eq(deals.id, milestone.dealId))
          .limit(1);

        if (deal.length === 0) continue;

        const dealData = deal[0];
        const listing = await db.getListingById(dealData.listingId);
        const buyer = await db.getUserById(dealData.buyerId);
        const seller = await db.getUserById(dealData.sellerId);

        if (!buyer || !seller || !listing) continue;

        const milestoneLabels: Record<string, string> = {
          nda_signed: "NDA Signed",
          financials_reviewed: "Financials Reviewed",
          offer_submitted: "Offer Submitted",
          loi_signed: "Letter of Intent Signed",
          final_agreement_signed: "Final Agreement Signed",
          escrow_funded: "Escrow Funded",
          assets_transferred: "Assets Transferred",
        };

        const daysOverdue = Math.floor(
          (now.getTime() - new Date(milestone.expectedCompletionDate!).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Notify both parties
        for (const userId of [dealData.buyerId, dealData.sellerId]) {
          await db.createNotification({
            userId,
            type: "milestone_completed",
            title: "Milestone overdue",
            message: `The milestone "${milestoneLabels[milestone.milestoneType]}" for ${listing.businessName} is ${daysOverdue} days overdue.`,
            relatedEntityType: "deal",
            relatedEntityId: dealData.id,
            isRead: 0,
            emailSent: 0,
          });
        }

        remindersSent += 2; // One for buyer, one for seller
      }

      return { success: true, remindersSent };
    }),
});
