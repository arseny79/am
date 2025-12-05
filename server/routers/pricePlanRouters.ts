import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { pricePlans } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const pricePlanRouter = router({
  // Public: Get all active price plans (for pricing page)
  getActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const plans = await db
      .select()
      .from(pricePlans)
      .where(eq(pricePlans.isActive, true))
      .orderBy(pricePlans.displayOrder);

    return plans;
  }),

  // Public: Get all price plans (for admin)
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const plans = await db
      .select()
      .from(pricePlans)
      .orderBy(pricePlans.displayOrder);

    return plans;
  }),

  // Public: Get single price plan by tier
  getByTier: publicProcedure
    .input(z.object({
      tier: z.enum(["free", "featured", "premium_featured"]),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [plan] = await db
        .select()
        .from(pricePlans)
        .where(eq(pricePlans.tier, input.tier))
        .limit(1);

      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Price plan not found" });
      }

      return plan;
    }),

  // Admin: Update price plan
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      successFeePercentage: z.number().optional(), // in basis points (300 = 3.00%)
      billingPeriod: z.enum(["one_time", "weekly", "monthly", "annual"]).optional(),
      features: z.array(z.string()).optional(),
      displayOrder: z.number().optional(),
      isActive: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      allowsThumbnail: z.boolean().optional(),
      carouselPlacement: z.boolean().optional(),
      prioritySupport: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, ...updates } = input;

      await db
        .update(pricePlans)
        .set(updates)
        .where(eq(pricePlans.id, id));

      return { success: true };
    }),

  // Admin: Toggle plan active status
  toggleActive: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get current status
      const [plan] = await db
        .select()
        .from(pricePlans)
        .where(eq(pricePlans.id, input.id))
        .limit(1);

      if (!plan) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Price plan not found" });
      }

      // Toggle status
      await db
        .update(pricePlans)
        .set({ isActive: !plan.isActive })
        .where(eq(pricePlans.id, input.id));

      return { success: true, isActive: !plan.isActive };
    }),

  // Admin: Update display order
  updateOrder: protectedProcedure
    .input(z.object({
      planIds: z.array(z.number()), // Array of plan IDs in desired order
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Update display order for each plan
      for (let i = 0; i < input.planIds.length; i++) {
        await db
          .update(pricePlans)
          .set({ displayOrder: i + 1 })
          .where(eq(pricePlans.id, input.planIds[i]));
      }

      return { success: true };
    }),
});
