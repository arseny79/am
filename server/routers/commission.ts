import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { affiliates, affiliateTiers, referrals, affiliateCommissions, deals, listings } from "../../drizzle/schema";

export const commissionRouter = router({
  // Calculate and create commission for a converted deal
  createCommission: adminProcedure
    .input(z.object({
      dealId: z.number(),
      dealAmount: z.number().min(0), // Total deal value in cents
      platformFee: z.number().min(0), // Platform's success fee in cents (3% of deal)
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Get the deal to find the buyer
      const [deal] = await db
        .select()
        .from(deals)
        .where(eq(deals.id, input.dealId))
        .limit(1);
      
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }
      
      // Check if buyer was referred
      const [referral] = await db
        .select({
          id: referrals.id,
          affiliateId: referrals.affiliateId,
          status: referrals.status,
        })
        .from(referrals)
        .where(eq(referrals.referredUserId, deal.buyerId))
        .limit(1);
      
      if (!referral) {
        return { success: false, message: "Buyer was not referred" };
      }
      
      if (referral.status === "converted") {
        return { success: false, message: "Referral already converted" };
      }
      
      // Get affiliate and their tier
      const [affiliate] = await db
        .select({
          id: affiliates.id,
          tierId: affiliates.tierId,
          status: affiliates.status,
        })
        .from(affiliates)
        .where(eq(affiliates.id, referral.affiliateId))
        .limit(1);
      
      if (!affiliate || affiliate.status !== "active") {
        return { success: false, message: "Affiliate not active" };
      }
      
      const [tier] = await db
        .select()
        .from(affiliateTiers)
        .where(eq(affiliateTiers.id, affiliate.tierId))
        .limit(1);
      
      if (!tier) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Affiliate tier not found" });
      }
      
      // Calculate commission (percentage of platform fee)
      const commissionPercent = parseFloat(tier.commissionPercent);
      const commissionAmount = Math.floor(input.platformFee * (commissionPercent / 100));
      
      // Create commission record
      const [result] = await db.insert(affiliateCommissions).values({
        affiliateId: affiliate.id,
        referralId: referral.id,
        dealId: input.dealId,
        dealAmount: input.dealAmount,
        platformFee: input.platformFee,
        commissionPercent: tier.commissionPercent,
        commissionAmount,
        status: "pending",
      });
      
      // Update referral status to converted
      await db
        .update(referrals)
        .set({
          status: "converted",
          convertedAt: new Date(),
          convertedDealId: input.dealId,
        })
        .where(eq(referrals.id, referral.id));
      
      // Update affiliate stats
      await db
        .update(affiliates)
        .set({
          successfulReferrals: sql`${affiliates.successfulReferrals} + 1`,
          totalEarnings: sql`${affiliates.totalEarnings} + ${commissionAmount}`,
          pendingEarnings: sql`${affiliates.pendingEarnings} + ${commissionAmount}`,
        })
        .where(eq(affiliates.id, affiliate.id));
      
      return { 
        success: true, 
        commissionId: result.insertId,
        commissionAmount,
        commissionPercent,
      };
    }),
  
  // Get all commissions (admin)
  getAllCommissions: adminProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "paid", "cancelled"]).optional(),
      affiliateId: z.number().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const { status, affiliateId, limit = 50, offset = 0 } = input || {};
      
      const conditions = [];
      if (status) conditions.push(eq(affiliateCommissions.status, status));
      if (affiliateId) conditions.push(eq(affiliateCommissions.affiliateId, affiliateId));
      
      let query = db
        .select()
        .from(affiliateCommissions)
        .orderBy(desc(affiliateCommissions.createdAt))
        .limit(limit)
        .offset(offset);
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }
      
      const results = await query;
      
      return results;
    }),
  
  // Approve commission for payout (admin)
  approveCommission: adminProcedure
    .input(z.object({
      commissionId: z.number(),
      adminNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [commission] = await db
        .select()
        .from(affiliateCommissions)
        .where(eq(affiliateCommissions.id, input.commissionId))
        .limit(1);
      
      if (!commission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Commission not found" });
      }
      
      if (commission.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Commission is not pending" });
      }
      
      await db
        .update(affiliateCommissions)
        .set({
          status: "approved",
          approvedAt: new Date(),
          approvedBy: ctx.user.id,
          adminNotes: input.adminNotes,
        })
        .where(eq(affiliateCommissions.id, input.commissionId));
      
      return { success: true };
    }),
  
  // Mark commission as paid (admin)
  markPaid: adminProcedure
    .input(z.object({
      commissionId: z.number(),
      paymentReference: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [commission] = await db
        .select()
        .from(affiliateCommissions)
        .where(eq(affiliateCommissions.id, input.commissionId))
        .limit(1);
      
      if (!commission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Commission not found" });
      }
      
      if (commission.status !== "approved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Commission must be approved before marking as paid" });
      }
      
      await db
        .update(affiliateCommissions)
        .set({
          status: "paid",
          paidAt: new Date(),
          paymentReference: input.paymentReference,
        })
        .where(eq(affiliateCommissions.id, input.commissionId));
      
      // Update affiliate's pending/paid earnings
      await db
        .update(affiliates)
        .set({
          pendingEarnings: sql`${affiliates.pendingEarnings} - ${commission.commissionAmount}`,
          paidEarnings: sql`${affiliates.paidEarnings} + ${commission.commissionAmount}`,
          lastPayoutAt: new Date(),
        })
        .where(eq(affiliates.id, commission.affiliateId));
      
      return { success: true };
    }),
  
  // Cancel commission (admin)
  cancelCommission: adminProcedure
    .input(z.object({
      commissionId: z.number(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      const [commission] = await db
        .select()
        .from(affiliateCommissions)
        .where(eq(affiliateCommissions.id, input.commissionId))
        .limit(1);
      
      if (!commission) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Commission not found" });
      }
      
      if (commission.status === "paid") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot cancel a paid commission" });
      }
      
      // If commission was pending, remove from affiliate's pending earnings
      if (commission.status === "pending" || commission.status === "approved") {
        await db
          .update(affiliates)
          .set({
            pendingEarnings: sql`${affiliates.pendingEarnings} - ${commission.commissionAmount}`,
            totalEarnings: sql`${affiliates.totalEarnings} - ${commission.commissionAmount}`,
          })
          .where(eq(affiliates.id, commission.affiliateId));
      }
      
      await db
        .update(affiliateCommissions)
        .set({
          status: "cancelled",
          adminNotes: input.reason,
        })
        .where(eq(affiliateCommissions.id, input.commissionId));
      
      return { success: true };
    }),
  
  // Get commission stats (admin)
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
    
    const statusCounts = await db
      .select({
        status: affiliateCommissions.status,
        count: sql<number>`count(*)`,
        totalAmount: sql<number>`COALESCE(SUM(commissionAmount), 0)`,
      })
      .from(affiliateCommissions)
      .groupBy(affiliateCommissions.status);
    
    return {
      byStatus: statusCounts.reduce((acc, { status, count, totalAmount }) => {
        acc[status] = { count, totalAmount };
        return acc;
      }, {} as Record<string, { count: number; totalAmount: number }>),
    };
  }),
});
