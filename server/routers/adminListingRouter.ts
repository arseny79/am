import { z } from "zod";
import { eq, desc, sql, and, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { listings, users } from "../../drizzle/schema";

export const adminListingRouter = router({
  // Get all listings with seller info for admin
  getAll: adminProcedure
    .input(z.object({
      status: z.enum(["draft", "active", "under_negotiation", "sold", "withdrawn"]).optional(),
      tier: z.enum(["free", "featured", "premium_featured"]).optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { status, tier, search, limit = 50, offset = 0 } = input || {};
      
      // Build conditions
      const conditions = [];
      if (status) conditions.push(eq(listings.status, status));
      if (tier) conditions.push(eq(listings.tier, tier));
      if (search) {
        conditions.push(or(
          like(listings.businessName, `%${search}%`),
          like(listings.location, `%${search}%`)
        ));
      }
      
      let query = db
        .select({
          id: listings.id,
          businessName: listings.businessName,
          location: listings.location,
          status: listings.status,
          tier: listings.tier,
          featuredUntil: listings.featuredUntil,
          isPublished: listings.isPublished,
          askingPrice: listings.askingPrice,
          annualRevenue: listings.annualRevenue,
          monthlyRecurringRevenue: listings.monthlyRecurringRevenue,
          createdAt: listings.createdAt,
          updatedAt: listings.updatedAt,
          sellerId: listings.sellerId,
          sellerName: users.name,
          sellerEmail: users.email,
        })
        .from(listings)
        .leftJoin(users, eq(listings.sellerId, users.id))
        .orderBy(desc(listings.createdAt))
        .limit(limit)
        .offset(offset);
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }
      
      const results = await query;
      
      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(listings)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      return {
        listings: results,
        total: countResult?.count || 0,
      };
    }),
  
  // Update listing tier (admin only)
  updateTier: adminProcedure
    .input(z.object({
      listingId: z.number(),
      tier: z.enum(["free", "featured", "premium_featured"]),
      featuredDuration: z.number().optional(), // Duration in days, null for indefinite
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Verify listing exists
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);
      
      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      }
      
      // Calculate featuredUntil date
      let featuredUntil: Date | null = null;
      if (input.tier !== "free" && input.featuredDuration) {
        featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + input.featuredDuration);
      }
      
      // Update listing tier
      await db
        .update(listings)
        .set({
          tier: input.tier,
          featuredUntil: featuredUntil,
        })
        .where(eq(listings.id, input.listingId));
      
      return { 
        success: true,
        tier: input.tier,
        featuredUntil,
      };
    }),
  
  // Get listing stats for admin dashboard
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    // Count by status
    const statusCounts = await db
      .select({
        status: listings.status,
        count: sql<number>`count(*)`,
      })
      .from(listings)
      .groupBy(listings.status);
    
    // Count by tier
    const tierCounts = await db
      .select({
        tier: listings.tier,
        count: sql<number>`count(*)`,
      })
      .from(listings)
      .groupBy(listings.tier);
    
    // Total published
    const [publishedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(eq(listings.isPublished, true));
    
    return {
      byStatus: statusCounts.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {} as Record<string, number>),
      byTier: tierCounts.reduce((acc, { tier, count }) => {
        acc[tier] = count;
        return acc;
      }, {} as Record<string, number>),
      totalPublished: publishedCount?.count || 0,
    };
  }),
  
  // Bulk update listing tiers
  bulkUpdateTier: adminProcedure
    .input(z.object({
      listingIds: z.array(z.number()),
      tier: z.enum(["free", "featured", "premium_featured"]),
      featuredDuration: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Calculate featuredUntil date
      let featuredUntil: Date | null = null;
      if (input.tier !== "free" && input.featuredDuration) {
        featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + input.featuredDuration);
      }
      
      // Update all listings
      for (const listingId of input.listingIds) {
        await db
          .update(listings)
          .set({
            tier: input.tier,
            featuredUntil: featuredUntil,
          })
          .where(eq(listings.id, listingId));
      }
      
      return { 
        success: true,
        updatedCount: input.listingIds.length,
      };
    }),
});
