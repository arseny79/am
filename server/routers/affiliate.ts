import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { affiliates, affiliateTiers, referrals, affiliateCommissions, users } from "../../drizzle/schema";
import crypto from "crypto";

// Generate a unique referral code
function generateReferralCode(): string {
  return crypto.randomBytes(6).toString("hex").toUpperCase();
}

export const affiliateRouter = router({
  // Apply to become an affiliate
  applyForProgram: protectedProcedure
    .input(z.object({
      paypalEmail: z.string().email().optional(),
      bankDetails: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Check if user already has an affiliate account
      const [existing] = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.userId, ctx.user.id))
        .limit(1);
      
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "You already have an affiliate account" });
      }
      
      // Get the default tier (level 1)
      const [defaultTier] = await db
        .select()
        .from(affiliateTiers)
        .where(and(eq(affiliateTiers.level, 1), eq(affiliateTiers.isActive, true)))
        .limit(1);
      
      if (!defaultTier) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "No default affiliate tier configured" });
      }
      
      // Generate unique referral code
      let referralCode = generateReferralCode();
      let attempts = 0;
      while (attempts < 10) {
        const [existingCode] = await db
          .select()
          .from(affiliates)
          .where(eq(affiliates.referralCode, referralCode))
          .limit(1);
        
        if (!existingCode) break;
        referralCode = generateReferralCode();
        attempts++;
      }
      
      const [result] = await db.insert(affiliates).values({
        userId: ctx.user.id,
        referralCode,
        tierId: defaultTier.id,
        status: "pending",
        paypalEmail: input.paypalEmail || null,
        bankDetails: input.bankDetails || null,
      });
      
      return { 
        id: result.insertId, 
        referralCode,
        status: "pending",
        message: "Your affiliate application has been submitted for review" 
      };
    }),
  
  // Get current user's affiliate status
  getMyStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const [affiliate] = await db
      .select({
        id: affiliates.id,
        referralCode: affiliates.referralCode,
        status: affiliates.status,
        totalReferrals: affiliates.totalReferrals,
        successfulReferrals: affiliates.successfulReferrals,
        totalEarnings: affiliates.totalEarnings,
        pendingEarnings: affiliates.pendingEarnings,
        paidEarnings: affiliates.paidEarnings,
        paypalEmail: affiliates.paypalEmail,
        appliedAt: affiliates.appliedAt,
        approvedAt: affiliates.approvedAt,
        rejectionReason: affiliates.rejectionReason,
        tierName: affiliateTiers.name,
        tierLevel: affiliateTiers.level,
        commissionPercent: affiliateTiers.commissionPercent,
      })
      .from(affiliates)
      .leftJoin(affiliateTiers, eq(affiliates.tierId, affiliateTiers.id))
      .where(eq(affiliates.userId, ctx.user.id))
      .limit(1);
    
    return affiliate || null;
  }),
  
  // Get affiliate's referrals
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    // Get affiliate ID
    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, ctx.user.id))
      .limit(1);
    
    if (!affiliate) {
      return [];
    }
    
    const referralList = await db
      .select({
        id: referrals.id,
        status: referrals.status,
        createdAt: referrals.createdAt,
        qualifiedAt: referrals.qualifiedAt,
        convertedAt: referrals.convertedAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(referrals)
      .leftJoin(users, eq(referrals.referredUserId, users.id))
      .where(eq(referrals.affiliateId, affiliate.id))
      .orderBy(desc(referrals.createdAt));
    
    return referralList;
  }),
  
  // Get affiliate's commissions
  getMyCommissions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    // Get affiliate ID
    const [affiliate] = await db
      .select()
      .from(affiliates)
      .where(eq(affiliates.userId, ctx.user.id))
      .limit(1);
    
    if (!affiliate) {
      return [];
    }
    
    const commissions = await db
      .select()
      .from(affiliateCommissions)
      .where(eq(affiliateCommissions.affiliateId, affiliate.id))
      .orderBy(desc(affiliateCommissions.createdAt));
    
    return commissions;
  }),
  
  // Update payment info
  updatePaymentInfo: protectedProcedure
    .input(z.object({
      paypalEmail: z.string().email().optional(),
      bankDetails: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [affiliate] = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.userId, ctx.user.id))
        .limit(1);
      
      if (!affiliate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Affiliate account not found" });
      }
      
      await db
        .update(affiliates)
        .set({
          paypalEmail: input.paypalEmail || affiliate.paypalEmail,
          bankDetails: input.bankDetails || affiliate.bankDetails,
        })
        .where(eq(affiliates.id, affiliate.id));
      
      return { success: true };
    }),
  
  // ============ ADMIN PROCEDURES ============
  
  // Get all affiliates (admin)
  getAllAffiliates: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "active", "suspended", "rejected"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { status, limit = 50, offset = 0 } = input || {};
      
      let query = db
        .select({
          id: affiliates.id,
          userId: affiliates.userId,
          referralCode: affiliates.referralCode,
          status: affiliates.status,
          totalReferrals: affiliates.totalReferrals,
          successfulReferrals: affiliates.successfulReferrals,
          totalEarnings: affiliates.totalEarnings,
          pendingEarnings: affiliates.pendingEarnings,
          paidEarnings: affiliates.paidEarnings,
          paypalEmail: affiliates.paypalEmail,
          appliedAt: affiliates.appliedAt,
          approvedAt: affiliates.approvedAt,
          adminNotes: affiliates.adminNotes,
          rejectionReason: affiliates.rejectionReason,
          userName: users.name,
          userEmail: users.email,
          tierName: affiliateTiers.name,
          tierLevel: affiliateTiers.level,
          commissionPercent: affiliateTiers.commissionPercent,
        })
        .from(affiliates)
        .leftJoin(users, eq(affiliates.userId, users.id))
        .leftJoin(affiliateTiers, eq(affiliates.tierId, affiliateTiers.id))
        .orderBy(desc(affiliates.appliedAt))
        .limit(limit)
        .offset(offset);
      
      if (status) {
        query = query.where(eq(affiliates.status, status)) as typeof query;
      }
      
      const results = await query;
      
      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(affiliates);
      
      return {
        affiliates: results,
        total: countResult?.count || 0,
      };
    }),
  
  // Approve affiliate (admin)
  approve: adminProcedure
    .input(z.object({
      affiliateId: z.number(),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [affiliate] = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.id, input.affiliateId))
        .limit(1);
      
      if (!affiliate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Affiliate not found" });
      }
      
      if (affiliate.status === "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Affiliate is already active" });
      }
      
      await db
        .update(affiliates)
        .set({
          status: "active",
          approvedAt: new Date(),
          adminNotes: input.adminNotes || affiliate.adminNotes,
        })
        .where(eq(affiliates.id, input.affiliateId));
      
      return { success: true };
    }),
  
  // Reject affiliate (admin)
  reject: adminProcedure
    .input(z.object({
      affiliateId: z.number(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db
        .update(affiliates)
        .set({
          status: "rejected",
          rejectionReason: input.reason,
        })
        .where(eq(affiliates.id, input.affiliateId));
      
      return { success: true };
    }),
  
  // Suspend affiliate (admin)
  suspend: adminProcedure
    .input(z.object({
      affiliateId: z.number(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      await db
        .update(affiliates)
        .set({
          status: "suspended",
          adminNotes: input.reason,
        })
        .where(eq(affiliates.id, input.affiliateId));
      
      return { success: true };
    }),
  
  // Reactivate suspended affiliate (admin)
  reactivate: adminProcedure
    .input(z.object({
      affiliateId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [affiliate] = await db
        .select()
        .from(affiliates)
        .where(eq(affiliates.id, input.affiliateId))
        .limit(1);
      
      if (!affiliate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Affiliate not found" });
      }
      
      if (affiliate.status !== "suspended") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Affiliate is not suspended" });
      }
      
      await db
        .update(affiliates)
        .set({ status: "active" })
        .where(eq(affiliates.id, input.affiliateId));
      
      return { success: true };
    }),
  
  // Change affiliate tier (admin)
  changeTier: adminProcedure
    .input(z.object({
      affiliateId: z.number(),
      tierId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Verify tier exists
      const [tier] = await db
        .select()
        .from(affiliateTiers)
        .where(eq(affiliateTiers.id, input.tierId))
        .limit(1);
      
      if (!tier) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tier not found" });
      }
      
      await db
        .update(affiliates)
        .set({ tierId: input.tierId })
        .where(eq(affiliates.id, input.affiliateId));
      
      return { success: true };
    }),
  
  // Get affiliate stats summary (admin)
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    // Count by status
    const statusCounts = await db
      .select({
        status: affiliates.status,
        count: sql<number>`count(*)`,
      })
      .from(affiliates)
      .groupBy(affiliates.status);
    
    // Total earnings and payouts
    const [totals] = await db
      .select({
        totalEarnings: sql<number>`COALESCE(SUM(totalEarnings), 0)`,
        pendingEarnings: sql<number>`COALESCE(SUM(pendingEarnings), 0)`,
        paidEarnings: sql<number>`COALESCE(SUM(paidEarnings), 0)`,
        totalReferrals: sql<number>`COALESCE(SUM(totalReferrals), 0)`,
        successfulReferrals: sql<number>`COALESCE(SUM(successfulReferrals), 0)`,
      })
      .from(affiliates)
      .where(eq(affiliates.status, "active"));
    
    return {
      statusCounts: statusCounts.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {} as Record<string, number>),
      totals: totals || {
        totalEarnings: 0,
        pendingEarnings: 0,
        paidEarnings: 0,
        totalReferrals: 0,
        successfulReferrals: 0,
      },
    };
  }),
});
