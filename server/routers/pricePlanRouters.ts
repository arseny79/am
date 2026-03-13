import { z } from "zod";
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { pricePlans } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { boolToInt } from "../lib/dbHelpers";

export const pricePlanRouter = router({
  // Public: Get all active price plans (for pricing page)
  getActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const plans = await db
      .select()
      .from(pricePlans)
      .where(eq(pricePlans.isActive, 1))
      .orderBy(pricePlans.displayOrder);

    return plans;
  }),

  // H4: Admin-only: Get all price plans (including inactive)
  getAll: adminProcedure.query(async () => {
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

  // H6: Admin-only: Update price plan (upgraded from protectedProcedure + manual role check)
  update: adminProcedure
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
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { id, prioritySupport, isActive, isFeatured, allowsThumbnail, carouselPlacement, ...updates } = input;

      await db
        .update(pricePlans)
        .set({
          ...updates,
          ...(prioritySupport !== undefined && { prioritySupport: boolToInt(prioritySupport) }),
          ...(isActive !== undefined && { isActive: boolToInt(isActive) }),
          ...(isFeatured !== undefined && { isFeatured: boolToInt(isFeatured) }),
          ...(allowsThumbnail !== undefined && { allowsThumbnail: boolToInt(allowsThumbnail) }),
          ...(carouselPlacement !== undefined && { carouselPlacement: boolToInt(carouselPlacement) }),
        })
        .where(eq(pricePlans.id, id));

      return { success: true };
    }),

  // H6: Admin-only: Toggle plan active status
  toggleActive: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
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
      const newIsActive = plan.isActive === 1 ? 0 : 1;
      await db
        .update(pricePlans)
        .set({ isActive: newIsActive })
        .where(eq(pricePlans.id, input.id));

      return { success: true, isActive: newIsActive === 1 };
    }),

  // H6: Admin-only: Update display order
  updateOrder: adminProcedure
    .input(z.object({
      planIds: z.array(z.number()), // Array of plan IDs in desired order
    }))
    .mutation(async ({ input }) => {
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
