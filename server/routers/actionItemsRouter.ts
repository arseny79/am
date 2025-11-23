import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { actionItems, deals } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const actionItemsRouter = router({
  /**
   * Get all action items for a deal
   */
  getByDeal: protectedProcedure
    .input(
      z.object({
        dealId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      }

      // Verify user is part of this deal
      const dealResult = await db
        .select()
        .from(deals)
        .where(eq(deals.id, input.dealId))
        .limit(1);

      if (dealResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const deal = dealResult[0]!;
      if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this deal",
        });
      }

      // Get all action items for this deal
      const items = await db
        .select()
        .from(actionItems)
        .where(eq(actionItems.dealId, input.dealId))
        .orderBy(desc(actionItems.createdAt));

      return items;
    }),

  /**
   * Create a new action item
   */
  create: protectedProcedure
    .input(
      z.object({
        dealId: z.number(),
        title: z.string().min(1).max(500),
        description: z.string().optional(),
        assignedTo: z.enum(["buyer", "seller", "both"]),
        priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
        dueDate: z.date().optional(),
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

      // Verify user is part of this deal
      const dealResult = await db
        .select()
        .from(deals)
        .where(eq(deals.id, input.dealId))
        .limit(1);

      if (dealResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const deal = dealResult[0]!;
      if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this deal",
        });
      }

      // Create action item
      await db.insert(actionItems).values({
        dealId: input.dealId,
        title: input.title,
        description: input.description || null,
        assignedTo: input.assignedTo,
        priority: input.priority,
        dueDate: input.dueDate || null,
        createdBy: ctx.user.id,
        status: "pending",
      });

      return { success: true };
    }),

  /**
   * Update action item status
   */
  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pending", "in_progress", "completed", "blocked"]),
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

      // Get action item and verify access
      const itemResult = await db
        .select()
        .from(actionItems)
        .where(eq(actionItems.id, input.id))
        .limit(1);

      if (itemResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Action item not found",
        });
      }

      const item = itemResult[0]!;

      // Verify user is part of the deal
      const dealResult = await db
        .select()
        .from(deals)
        .where(eq(deals.id, item.dealId))
        .limit(1);

      if (dealResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const deal = dealResult[0]!;
      if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this deal",
        });
      }

      // Update status
      const updateData: any = {
        status: input.status,
      };

      if (input.status === "completed") {
        updateData.completedAt = new Date();
        updateData.completedBy = ctx.user.id;
      } else if (item.status === "completed") {
        // Uncompleting - clear completion data
        updateData.completedAt = null;
        updateData.completedBy = null;
      }

      await db
        .update(actionItems)
        .set(updateData)
        .where(eq(actionItems.id, input.id));

      return { success: true };
    }),

  /**
   * Delete an action item
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.number(),
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

      // Get action item and verify access
      const itemResult = await db
        .select()
        .from(actionItems)
        .where(eq(actionItems.id, input.id))
        .limit(1);

      if (itemResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Action item not found",
        });
      }

      const item = itemResult[0]!;

      // Verify user is part of the deal
      const dealResult = await db
        .select()
        .from(deals)
        .where(eq(deals.id, item.dealId))
        .limit(1);

      if (dealResult.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Deal not found",
        });
      }

      const deal = dealResult[0]!;
      if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this deal",
        });
      }

      // Delete action item
      await db.delete(actionItems).where(eq(actionItems.id, input.id));

      return { success: true };
    }),

  /**
   * Get action items summary for a user (across all their deals)
   */
  getMySummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    }

    // Get all deals where user is buyer or seller
    const userDeals = await db
      .select()
      .from(deals)
      .where(
        and(
          eq(deals.buyerId, ctx.user.id),
          eq(deals.sellerId, ctx.user.id)
        )
      );

    if (userDeals.length === 0) {
      return {
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        blocked: 0,
      };
    }

    const dealIds = userDeals.map((d) => d.id);

    // Get all action items for these deals
    const items = await db
      .select()
      .from(actionItems)
      .where(eq(actionItems.dealId, dealIds[0]!)); // Simplified for now

    return {
      total: items.length,
      pending: items.filter((i) => i.status === "pending").length,
      inProgress: items.filter((i) => i.status === "in_progress").length,
      completed: items.filter((i) => i.status === "completed").length,
      blocked: items.filter((i) => i.status === "blocked").length,
    };
  }),
});
