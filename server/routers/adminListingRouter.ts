import { z } from "zod";
import { eq, desc, sql, and, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc";
import { createNotification, getDb } from "../db";
import { adminAuditLogs, listings, users } from "../../drizzle/schema";
import { dateToTimestamp } from "../lib/dbHelpers";

async function logListingAdminAction(
  db: Awaited<ReturnType<typeof getDb>>,
  admin: { id: number; name?: string | null; email?: string | null },
  action: string,
  listingId: number,
  details: Record<string, unknown>
) {
  if (!db) throw new Error("Database not available");
  await db.insert(adminAuditLogs).values({
    adminId: admin.id,
    adminName: admin.name ?? null,
    adminEmail: admin.email ?? null,
    action,
    resource: "listing",
    resourceId: listingId,
    details: JSON.stringify(details),
    status: "success",
  });
}

async function notifyListingSeller(
  sellerId: number,
  listingId: number,
  type: string,
  title: string,
  message: string,
) {
  await createNotification({
    userId: sellerId,
    type,
    title,
    message,
    relatedEntityType: "listing",
    relatedEntityId: listingId,
  });
}

export const adminListingRouter = router({
  // Get all listings with seller info for admin
  getAll: adminProcedure
    .input(z.object({
      status: z.enum(["draft", "active", "under_negotiation", "sold", "withdrawn"]).optional(),
      tier: z.enum(["free", "featured", "premium_featured"]).optional(),
      moderationStatus: z.enum(["pending_review", "needs_information", "approved", "rejected"]).optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { status, tier, moderationStatus, search, limit = 50, offset = 0 } = input || {};

      // Build conditions
      const conditions = [];
      if (status) conditions.push(eq(listings.status, status));
      if (tier) conditions.push(eq(listings.tier, tier));
      if (moderationStatus) conditions.push(eq(listings.moderationStatus, moderationStatus));
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
          moderationStatus: listings.moderationStatus,
          submittedAt: listings.submittedAt,
          reviewedAt: listings.reviewedAt,
          reviewedBy: listings.reviewedBy,
          reviewNotes: listings.reviewNotes,
          rejectionReason: listings.rejectionReason,
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
      let featuredUntilDate: Date | null = null;
      if (input.tier !== "free" && input.featuredDuration) {
        featuredUntilDate = new Date();
        featuredUntilDate.setDate(featuredUntilDate.getDate() + input.featuredDuration);
      }
      const featuredUntil = featuredUntilDate ? dateToTimestamp(featuredUntilDate) : null;
      
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
      .where(eq(listings.isPublished, 1));

    // Moderation counts
    const moderationCounts = await db
      .select({
        moderationStatus: listings.moderationStatus,
        count: sql<number>`count(*)`,
      })
      .from(listings)
      .groupBy(listings.moderationStatus);

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
      byModerationStatus: moderationCounts.reduce((acc, { moderationStatus, count }) => {
        acc[moderationStatus] = count;
        return acc;
      }, {} as Record<string, number>),
    };
  }),

  requestMoreInfo: adminProcedure
    .input(z.object({
      listingId: z.number(),
      notes: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });

      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      await db.update(listings).set({
        moderationStatus: "needs_information",
        reviewedAt: now,
        reviewedBy: ctx.user.id,
        reviewNotes: input.notes,
        rejectionReason: null,
        isPublished: 0,
      }).where(eq(listings.id, input.listingId));

      await logListingAdminAction(db, ctx.user, "listing_requested_more_info", input.listingId, { notes: input.notes });
      await notifyListingSeller(
        listing.sellerId,
        listing.id,
        "listing_review_update",
        "More information requested",
        `AM requested additional information for your listing: ${listing.businessName}`,
      );

      return { success: true };
    }),

  approve: adminProcedure
    .input(z.object({
      listingId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });

      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      await db.update(listings).set({
        moderationStatus: "approved",
        reviewedAt: now,
        reviewedBy: ctx.user.id,
        reviewNotes: input.notes || null,
        rejectionReason: null,
      }).where(eq(listings.id, input.listingId));

      await logListingAdminAction(db, ctx.user, "listing_approved", input.listingId, { notes: input.notes || null });
      await notifyListingSeller(
        listing.sellerId,
        listing.id,
        "listing_review_update",
        "Listing approved",
        `Your listing has been approved and is ready for publication: ${listing.businessName}`,
      );

      return { success: true };
    }),

  reject: adminProcedure
    .input(z.object({
      listingId: z.number(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });

      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      await db.update(listings).set({
        moderationStatus: "rejected",
        reviewedAt: now,
        reviewedBy: ctx.user.id,
        reviewNotes: null,
        rejectionReason: input.reason,
        isPublished: 0,
      }).where(eq(listings.id, input.listingId));

      await logListingAdminAction(db, ctx.user, "listing_rejected", input.listingId, { reason: input.reason });
      await notifyListingSeller(
        listing.sellerId,
        listing.id,
        "listing_review_update",
        "Listing rejected",
        `Your listing was not approved: ${listing.businessName}`,
      );

      return { success: true };
    }),

  publish: adminProcedure
    .input(z.object({
      listingId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      if (listing.moderationStatus !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only approved listings can be published" });
      }

      await db.update(listings).set({
        isPublished: 1,
        status: "active",
      }).where(eq(listings.id, input.listingId));

      await logListingAdminAction(db, ctx.user, "listing_published", input.listingId, { previousStatus: listing.status });
      await notifyListingSeller(
        listing.sellerId,
        listing.id,
        "listing_published",
        "Listing published",
        `Your listing is now live on AM: ${listing.businessName}`,
      );

      return { success: true };
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
      let featuredUntilDate: Date | null = null;
      if (input.tier !== "free" && input.featuredDuration) {
        featuredUntilDate = new Date();
        featuredUntilDate.setDate(featuredUntilDate.getDate() + input.featuredDuration);
      }
      const featuredUntilStr = featuredUntilDate ? dateToTimestamp(featuredUntilDate) : null;
      
      // Update all listings
      for (const listingId of input.listingIds) {
        await db
          .update(listings)
          .set({
            tier: input.tier,
            featuredUntil: featuredUntilStr,
          })
          .where(eq(listings.id, listingId));
      }
      
      return { 
        success: true,
        updatedCount: input.listingIds.length,
      };
    }),
});
