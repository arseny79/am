import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { affiliates, referrals, users } from "../../drizzle/schema";
import { dateToTimestamp, nowTimestamp } from "../lib/dbHelpers";

// Attribution window in days (how long a referral cookie is valid)
const ATTRIBUTION_WINDOW_DAYS = 90;

export const referralRouter = router({
  // Validate a referral code (public - for signup page)
  validateCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [affiliate] = await db
        .select({
          id: affiliates.id,
          referralCode: affiliates.referralCode,
          status: affiliates.status,
          userName: users.name,
        })
        .from(affiliates)
        .leftJoin(users, eq(affiliates.userId, users.id))
        .where(and(
          eq(affiliates.referralCode, input.code.toUpperCase()),
          eq(affiliates.status, "active")
        ))
        .limit(1);
      
      if (!affiliate) {
        return { valid: false, message: "Invalid or inactive referral code" };
      }
      
      return { 
        valid: true, 
        affiliateName: affiliate.userName || "Anonymous",
        message: "Valid referral code" 
      };
    }),
  
  // Track a referral (called during user registration)
  trackReferral: publicProcedure
    .input(z.object({
      referralCode: z.string(),
      referredUserId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Find the affiliate
      const [affiliate] = await db
        .select()
        .from(affiliates)
        .where(and(
          eq(affiliates.referralCode, input.referralCode.toUpperCase()),
          eq(affiliates.status, "active")
        ))
        .limit(1);
      
      if (!affiliate) {
        return { success: false, message: "Invalid referral code" };
      }
      
      // Check if user is already referred
      const [existingReferral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referredUserId, input.referredUserId))
        .limit(1);
      
      if (existingReferral) {
        return { success: false, message: "User already has a referral" };
      }
      
      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ATTRIBUTION_WINDOW_DAYS);
      
      // Create referral record
      await db.insert(referrals).values({
        affiliateId: affiliate.id,
        referredUserId: input.referredUserId,
        referralCode: input.referralCode.toUpperCase(),
        status: "registered",
        expiresAt: dateToTimestamp(expiresAt),
      });
      
      // Update affiliate's total referrals count
      await db
        .update(affiliates)
        .set({
          totalReferrals: sql`${affiliates.totalReferrals} + 1`,
        })
        .where(eq(affiliates.id, affiliate.id));
      
      return { success: true, message: "Referral tracked successfully" };
    }),
  
  // Mark referral as qualified (called when user completes KYC or creates listing)
  markQualified: adminProcedure
    .input(z.object({ referralId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [referral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.id, input.referralId))
        .limit(1);
      
      if (!referral) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Referral not found" });
      }
      
      if (referral.status !== "registered") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Referral is not in registered status" });
      }
      
      await db
        .update(referrals)
        .set({
          status: "qualified",
          qualifiedAt: nowTimestamp(),
        })
        .where(eq(referrals.id, input.referralId));
      
      return { success: true };
    }),
  
  // Get all referrals (admin)
  getAllReferrals: adminProcedure
    .input(z.object({
      status: z.enum(["registered", "qualified", "converted", "expired"]).optional(),
      affiliateId: z.number().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { status, affiliateId, limit = 50, offset = 0 } = input || {};
      
      // Build conditions
      const conditions = [];
      if (status) conditions.push(eq(referrals.status, status));
      if (affiliateId) conditions.push(eq(referrals.affiliateId, affiliateId));
      
      let query = db
        .select({
          id: referrals.id,
          affiliateId: referrals.affiliateId,
          referredUserId: referrals.referredUserId,
          referralCode: referrals.referralCode,
          status: referrals.status,
          qualifiedAt: referrals.qualifiedAt,
          convertedAt: referrals.convertedAt,
          convertedDealId: referrals.convertedDealId,
          expiresAt: referrals.expiresAt,
          createdAt: referrals.createdAt,
          referredUserName: users.name,
          referredUserEmail: users.email,
        })
        .from(referrals)
        .leftJoin(users, eq(referrals.referredUserId, users.id))
        .orderBy(desc(referrals.createdAt))
        .limit(limit)
        .offset(offset);
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }
      
      const results = await query;
      
      return results;
    }),
  
  // Get referral stats (admin)
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const statusCounts = await db
      .select({
        status: referrals.status,
        count: sql<number>`count(*)`,
      })
      .from(referrals)
      .groupBy(referrals.status);
    
    // Calculate conversion rate
    const [totals] = await db
      .select({
        total: sql<number>`count(*)`,
        converted: sql<number>`SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END)`,
      })
      .from(referrals);
    
    const conversionRate = totals && totals.total > 0 
      ? ((totals.converted || 0) / totals.total * 100).toFixed(2)
      : "0.00";
    
    return {
      statusCounts: statusCounts.reduce((acc, { status, count }) => {
        acc[status] = count;
        return acc;
      }, {} as Record<string, number>),
      total: totals?.total || 0,
      converted: totals?.converted || 0,
      conversionRate,
    };
  }),
});
