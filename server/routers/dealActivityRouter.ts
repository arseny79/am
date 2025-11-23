import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dealActivities, deals } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Log a new activity in the deal timeline
 */
export async function logDealActivity(params: {
  dealId: number;
  userId?: number;
  activityType: string;
  description: string;
  metadata?: Record<string, any>;
}) {
  const db = await getDb();
  if (!db) {
    console.error("[Deal Activity] Database not available");
    return;
  }

  try {
    await db.insert(dealActivities).values({
      dealId: params.dealId,
      userId: params.userId || null,
      activityType: params.activityType as any,
      description: params.description,
      metadata: params.metadata ? JSON.stringify(params.metadata) : null,
    });
  } catch (error) {
    console.error("[Deal Activity] Failed to log activity:", error);
  }
}

export const dealActivityRouter = router({
  /**
   * Get all activities for a deal
   */
  getByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify user has access to this deal
      const dealResult = await db
        .select()
        .from(deals)
        .where(eq(deals.id, input.dealId))
        .limit(1);

      if (dealResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      const deal = dealResult[0]!;
      if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      // Get all activities for this deal
      const activities = await db
        .select()
        .from(dealActivities)
        .where(eq(dealActivities.dealId, input.dealId))
        .orderBy(dealActivities.createdAt); // Most recent first handled by desc() in column definition

      return activities.map((activity) => ({
        ...activity,
        metadata: activity.metadata ? JSON.parse(activity.metadata) : null,
      }));
    }),

  /**
   * Manually log an activity (for testing or admin purposes)
   */
  create: protectedProcedure
    .input(
      z.object({
        dealId: z.number(),
        activityType: z.enum([
          "deal_created",
          "stage_changed",
          "document_uploaded",
          "message_sent",
          "action_item_created",
          "action_item_completed",
          "nda_signed",
          "escrow_initiated",
          "payment_received",
          "deal_closed",
          "deal_cancelled",
        ]),
        description: z.string(),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify user has access to this deal
      const dealResult = await db
        .select()
        .from(deals)
        .where(eq(deals.id, input.dealId))
        .limit(1);

      if (dealResult.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      const deal = dealResult[0]!;
      if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }

      await logDealActivity({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: input.activityType,
        description: input.description,
        metadata: input.metadata,
      });

      return { success: true };
    }),
});
