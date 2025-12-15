import { z } from "zod";
import { eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { affiliateTiers } from "../../drizzle/schema";

export const affiliateTierRouter = router({
  // Get all tiers (public - for affiliate signup page)
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const tiers = await db
      .select()
      .from(affiliateTiers)
      .where(eq(affiliateTiers.isActive, true))
      .orderBy(asc(affiliateTiers.level));
    
    return tiers;
  }),
  
  // Get all tiers including inactive (admin only)
  getAllAdmin: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const tiers = await db
      .select()
      .from(affiliateTiers)
      .orderBy(asc(affiliateTiers.level));
    
    return tiers;
  }),
  
  // Get tier by ID
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [tier] = await db
        .select()
        .from(affiliateTiers)
        .where(eq(affiliateTiers.id, input.id))
        .limit(1);
      
      if (!tier) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tier not found" });
      }
      
      return tier;
    }),
  
  // Create new tier (admin only)
  create: adminProcedure
    .input(z.object({
      level: z.number().min(1).max(10),
      name: z.string().min(1).max(100),
      commissionPercent: z.number().min(0).max(100),
      minReferrals: z.number().min(0).default(0),
      minEarnings: z.number().min(0).default(0),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Check if level already exists
      const [existing] = await db
        .select()
        .from(affiliateTiers)
        .where(eq(affiliateTiers.level, input.level))
        .limit(1);
      
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: `Tier level ${input.level} already exists` });
      }
      
      const [result] = await db.insert(affiliateTiers).values({
        level: input.level,
        name: input.name,
        commissionPercent: input.commissionPercent.toFixed(2),
        minReferrals: input.minReferrals,
        minEarnings: input.minEarnings,
        isActive: input.isActive,
      });
      
      return { id: result.insertId, ...input };
    }),
  
  // Update tier (admin only)
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      commissionPercent: z.number().min(0).max(100).optional(),
      minReferrals: z.number().min(0).optional(),
      minEarnings: z.number().min(0).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { id, ...updates } = input;
      
      // Build update object
      const updateData: Record<string, unknown> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.commissionPercent !== undefined) updateData.commissionPercent = updates.commissionPercent.toFixed(2);
      if (updates.minReferrals !== undefined) updateData.minReferrals = updates.minReferrals;
      if (updates.minEarnings !== undefined) updateData.minEarnings = updates.minEarnings;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      
      if (Object.keys(updateData).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No updates provided" });
      }
      
      await db
        .update(affiliateTiers)
        .set(updateData)
        .where(eq(affiliateTiers.id, id));
      
      return { success: true };
    }),
  
  // Delete tier (admin only)
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Check if any affiliates are using this tier
      const { affiliates } = await import("../../drizzle/schema");
      const [affiliateUsingTier] = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.tierId, input.id))
        .limit(1);
      
      if (affiliateUsingTier) {
        throw new TRPCError({ 
          code: "PRECONDITION_FAILED", 
          message: "Cannot delete tier: affiliates are using this tier" 
        });
      }
      
      await db.delete(affiliateTiers).where(eq(affiliateTiers.id, input.id));
      
      return { success: true };
    }),
});
