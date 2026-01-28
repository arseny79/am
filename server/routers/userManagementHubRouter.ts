import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { 
  users, 
  kycDocuments, 
  affiliates, 
  affiliateTiers, 
  referrals, 
  affiliateCommissions,
  adminAuditLogs,
  userNotes
} from "../../drizzle/schema";
import { eq, desc, asc, and, or, like, sql, isNull, isNotNull, count, sum } from "drizzle-orm";
import { sendEmail } from "../lib/emailService";

/**
 * User Management Hub Router
 * 
 * Consolidates user administration, KYC verification, and affiliate tracking
 * into a unified interface for admins.
 */

export const userManagementHubRouter = router({
  // ==================== USERS TAB ====================
  
  /**
   * Get all users with search and filter capabilities
   */
  getUsers: adminProcedure
    .input(z.object({
      search: z.string().optional(),
      kycStatus: z.enum(["all", "unverified", "pending", "verified", "rejected"]).optional(),
      hasAffiliate: z.enum(["all", "yes", "no"]).optional(),
      sortBy: z.enum(["createdAt", "name", "email", "kycStatus"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { search, kycStatus, hasAffiliate, sortBy = "createdAt", sortOrder = "desc", page, limit } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions: any[] = [];
      
      if (search) {
        conditions.push(
          or(
            like(users.name, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.companyName, `%${search}%`)
          )
        );
      }
      
      if (kycStatus && kycStatus !== "all") {
        conditions.push(eq(users.kycStatus, kycStatus));
      }

      // Get users with affiliate status
      const baseQuery = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          companyName: users.companyName,
          phoneNumber: users.phoneNumber,
          location: users.location,
          role: users.role,
          kycStatus: users.kycStatus,
          kycMethod: users.kycMethod,
          kycSubmittedAt: users.kycSubmittedAt,
          kycReviewedAt: users.kycReviewedAt,
          kycVerified: users.kycVerified,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
          affiliateId: affiliates.id,
          affiliateStatus: affiliates.status,
        })
        .from(users)
        .leftJoin(affiliates, eq(users.id, affiliates.userId));

      // Build conditions array including affiliate filter
      if (hasAffiliate === "yes") {
        conditions.push(isNotNull(affiliates.id));
      } else if (hasAffiliate === "no") {
        conditions.push(isNull(affiliates.id));
      }

      // Apply conditions
      const query = conditions.length > 0 
        ? baseQuery.where(and(...conditions))
        : baseQuery;

      // Get total count
      const countResult = await db
        .select({ count: count() })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      const total = countResult[0]?.count || 0;

      // Get paginated results with proper ordering
      const orderColumn = sortBy === "name" ? users.name 
        : sortBy === "email" ? users.email 
        : sortBy === "kycStatus" ? users.kycStatus 
        : users.createdAt;
      
      const result = await query
        .orderBy(sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn))
        .limit(limit)
        .offset(offset);

      return {
        users: result,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * Get detailed user information for the context panel
   */
  getUserDetails: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get user with affiliate info
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          companyName: users.companyName,
          phoneNumber: users.phoneNumber,
          location: users.location,
          role: users.role,
          bio: users.bio,
          kycStatus: users.kycStatus,
          kycMethod: users.kycMethod,
          kycSubmittedAt: users.kycSubmittedAt,
          kycReviewedAt: users.kycReviewedAt,
          kycReviewedBy: users.kycReviewedBy,
          kycRejectionReason: users.kycRejectionReason,
          kycVerified: users.kycVerified,
          emailVerified: users.emailVerified,
          createdAt: users.createdAt,
          lastSignedIn: users.lastSignedIn,
          affiliateId: affiliates.id,
          affiliateStatus: affiliates.status,
          affiliateReferralCode: affiliates.referralCode,
          affiliateTotalReferrals: affiliates.totalReferrals,
          affiliateTotalEarnings: affiliates.totalEarnings,
        })
        .from(users)
        .leftJoin(affiliates, eq(users.id, affiliates.userId))
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Get KYC documents
      const documents = await db
        .select()
        .from(kycDocuments)
        .where(eq(kycDocuments.userId, input.userId))
        .orderBy(desc(kycDocuments.createdAt));

      // Get user notes
      const notes = await db
        .select()
        .from(userNotes)
        .where(eq(userNotes.userId, input.userId))
        .orderBy(desc(userNotes.isPinned), desc(userNotes.createdAt));

      return {
        user,
        documents,
        notes,
      };
    }),

  /**
   * Update user account status
   */
  updateUserStatus: adminProcedure
    .input(z.object({
      userId: z.number(),
      action: z.enum(["suspend", "activate", "reset_password", "verify_email"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { userId, action, reason } = input;

      // Get current user state
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      let updateData: any = {};
      let actionDescription = "";

      switch (action) {
        case "suspend":
          updateData = { role: "suspended" };
          actionDescription = `Account suspended${reason ? `: ${reason}` : ""}`;
          break;
        case "activate":
          updateData = { role: "user" };
          actionDescription = "Account activated";
          break;
        case "verify_email":
          updateData = { emailVerified: 1 };
          actionDescription = "Email manually verified by admin";
          break;
        case "reset_password":
          // In a real implementation, this would trigger a password reset email
          actionDescription = "Password reset initiated";
          break;
      }

      if (Object.keys(updateData).length > 0) {
        await db.update(users).set(updateData).where(eq(users.id, userId));
      }

      // Log admin action
      await db.insert(adminAuditLogs).values({
        adminId: ctx.user.id,
        adminName: ctx.user.name,
        adminEmail: ctx.user.email,
        action: `user_${action}`,
        resource: "user",
        resourceId: userId,
        details: JSON.stringify({ reason, previousState: user.role }),
        status: "success",
      });

      return { success: true, message: actionDescription };
    }),

  // ==================== USER NOTES ====================

  /**
   * Add a note to a user
   */
  addUserNote: adminProcedure
    .input(z.object({
      userId: z.number(),
      content: z.string().min(1),
      category: z.enum(["general", "kyc", "affiliate", "support", "compliance", "fraud"]).default("general"),
      isPinned: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.insert(userNotes).values({
        userId: input.userId,
        authorId: ctx.user.id,
        authorName: ctx.user.name || null,
        content: input.content,
        category: input.category,
        isPinned: input.isPinned ? 1 : 0,
      });

      // Log action
      await db.insert(adminAuditLogs).values({
        adminId: ctx.user.id,
        adminName: ctx.user.name,
        adminEmail: ctx.user.email,
        action: "add_user_note",
        resource: "user_note",
        resourceId: input.userId,
        details: JSON.stringify({ category: input.category }),
        status: "success",
      });

      return { success: true };
    }),

  /**
   * Get notes for a user
   */
  getUserNotes: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const notes = await db
        .select()
        .from(userNotes)
        .where(eq(userNotes.userId, input.userId))
        .orderBy(desc(userNotes.isPinned), desc(userNotes.createdAt));

      return notes;
    }),

  /**
   * Delete a user note
   */
  deleteUserNote: adminProcedure
    .input(z.object({ noteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db.delete(userNotes).where(eq(userNotes.id, input.noteId));

      return { success: true };
    }),

  // ==================== KYC REVIEW TAB ====================

  /**
   * Get KYC review queue with filtering
   */
  getKYCQueue: adminProcedure
    .input(z.object({
      status: z.enum(["all", "pending", "flagged", "approved", "rejected"]).default("pending"),
      sortBy: z.enum(["submittedAt", "name"]).default("submittedAt"),
      sortOrder: z.enum(["asc", "desc"]).default("asc"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions: any[] = [isNotNull(users.kycSubmittedAt)];

      if (input.status === "pending") {
        conditions.push(eq(users.kycStatus, "pending"));
      } else if (input.status === "approved") {
        conditions.push(eq(users.kycStatus, "verified"));
      } else if (input.status === "rejected") {
        conditions.push(eq(users.kycStatus, "rejected"));
      }

      const result = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          companyName: users.companyName,
          kycStatus: users.kycStatus,
          kycMethod: users.kycMethod,
          kycSubmittedAt: users.kycSubmittedAt,
          kycReviewedAt: users.kycReviewedAt,
          kycRejectionReason: users.kycRejectionReason,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(and(...conditions))
        .orderBy(input.sortOrder === "desc" ? desc(users.kycSubmittedAt) : users.kycSubmittedAt);

      // Get counts for summary
      const [pendingCount] = await db
        .select({ count: count() })
        .from(users)
        .where(and(isNotNull(users.kycSubmittedAt), eq(users.kycStatus, "pending")));

      const [approvedCount] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.kycStatus, "verified"));

      const [rejectedCount] = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.kycStatus, "rejected"));

      return {
        submissions: result,
        summary: {
          pending: pendingCount?.count || 0,
          approved: approvedCount?.count || 0,
          rejected: rejectedCount?.count || 0,
        },
      };
    }),

  /**
   * Get KYC documents for a user
   */
  getKYCDocuments: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const documents = await db
        .select()
        .from(kycDocuments)
        .where(eq(kycDocuments.userId, input.userId))
        .orderBy(desc(kycDocuments.createdAt));

      return documents;
    }),

  /**
   * Approve KYC submission
   */
  approveKYC: adminProcedure
    .input(z.object({
      userId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      await db.update(users).set({
        kycStatus: "verified",
        kycVerified: 1,
        kycReviewedAt: now,
        kycReviewedBy: ctx.user.id,
      }).where(eq(users.id, input.userId));

      // Update all pending documents to approved
      await db.update(kycDocuments).set({
        reviewStatus: "approved",
        reviewedAt: now,
        reviewedBy: ctx.user.id,
        reviewNotes: input.notes || null,
      }).where(and(
        eq(kycDocuments.userId, input.userId),
        eq(kycDocuments.reviewStatus, "pending")
      ));

      // Log action
      await db.insert(adminAuditLogs).values({
        adminId: ctx.user.id,
        adminName: ctx.user.name,
        adminEmail: ctx.user.email,
        action: "kyc_approved",
        resource: "kyc",
        resourceId: input.userId,
        details: JSON.stringify({ notes: input.notes }),
        status: "success",
      });

      // Get user email for notification
      const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, input.userId)).limit(1);
      
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: "Your KYC Verification Has Been Approved",
          html: `
            <h2>KYC Verification Approved</h2>
            <p>Dear ${user.name || "User"},</p>
            <p>Your identity verification has been approved. You now have full access to all platform features.</p>
            <p>Thank you for completing the verification process.</p>
          `,
          text: `KYC Verification Approved\n\nDear ${user.name || "User"},\n\nYour identity verification has been approved. You now have full access to all platform features.\n\nThank you for completing the verification process.`,
        });
      }

      return { success: true };
    }),

  /**
   * Reject KYC submission
   */
  rejectKYC: adminProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      await db.update(users).set({
        kycStatus: "rejected",
        kycVerified: 0,
        kycReviewedAt: now,
        kycReviewedBy: ctx.user.id,
        kycRejectionReason: input.reason,
      }).where(eq(users.id, input.userId));

      // Update all pending documents to rejected
      await db.update(kycDocuments).set({
        reviewStatus: "rejected",
        reviewedAt: now,
        reviewedBy: ctx.user.id,
        reviewNotes: input.reason,
      }).where(and(
        eq(kycDocuments.userId, input.userId),
        eq(kycDocuments.reviewStatus, "pending")
      ));

      // Log action
      await db.insert(adminAuditLogs).values({
        adminId: ctx.user.id,
        adminName: ctx.user.name,
        adminEmail: ctx.user.email,
        action: "kyc_rejected",
        resource: "kyc",
        resourceId: input.userId,
        details: JSON.stringify({ reason: input.reason }),
        status: "success",
      });

      // Get user email for notification
      const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, input.userId)).limit(1);
      
      if (user?.email) {
        await sendEmail({
          to: user.email,
          subject: "KYC Verification Update Required",
          html: `
            <h2>KYC Verification Requires Attention</h2>
            <p>Dear ${user.name || "User"},</p>
            <p>Unfortunately, we were unable to verify your identity with the documents provided.</p>
            <p><strong>Reason:</strong> ${input.reason}</p>
            <p>Please log in and submit updated documents to complete your verification.</p>
          `,
          text: `KYC Verification Requires Attention\n\nDear ${user.name || "User"},\n\nUnfortunately, we were unable to verify your identity with the documents provided.\n\nReason: ${input.reason}\n\nPlease log in and submit updated documents to complete your verification.`,
        });
      }

      return { success: true };
    }),

  // ==================== AFFILIATES TAB ====================

  /**
   * Get all affiliates with performance metrics
   */
  getAffiliates: adminProcedure
    .input(z.object({
      status: z.enum(["all", "pending", "active", "suspended", "rejected"]).default("all"),
      sortBy: z.enum(["totalEarnings", "totalReferrals", "createdAt", "name"]).default("totalEarnings"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { status, sortBy, sortOrder, page, limit } = input;
      const offset = (page - 1) * limit;

      const conditions: any[] = [];
      if (status !== "all") {
        conditions.push(eq(affiliates.status, status));
      }

      const result = await db
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
          rejectionReason: affiliates.rejectionReason,
          userName: users.name,
          userEmail: users.email,
          userCompany: users.companyName,
          tierName: affiliateTiers.name,
          tierLevel: affiliateTiers.level,
          commissionPercent: affiliateTiers.commissionPercent,
        })
        .from(affiliates)
        .leftJoin(users, eq(affiliates.userId, users.id))
        .leftJoin(affiliateTiers, eq(affiliates.tierId, affiliateTiers.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(sortOrder === "desc" 
          ? desc(sortBy === "name" ? users.name : sortBy === "totalReferrals" ? affiliates.totalReferrals : sortBy === "createdAt" ? affiliates.createdAt : affiliates.totalEarnings)
          : asc(sortBy === "name" ? users.name : sortBy === "totalReferrals" ? affiliates.totalReferrals : sortBy === "createdAt" ? affiliates.createdAt : affiliates.totalEarnings))
        .limit(limit)
        .offset(offset);

      // Get total count
      const [countResult] = await db
        .select({ count: count() })
        .from(affiliates)
        .where(conditions.length > 0 ? and(...conditions) : undefined);

      // Get summary stats
      const [stats] = await db
        .select({
          totalAffiliates: count(),
          totalEarnings: sum(affiliates.totalEarnings),
          totalReferrals: sum(affiliates.totalReferrals),
        })
        .from(affiliates)
        .where(eq(affiliates.status, "active"));

      const [pendingCount] = await db
        .select({ count: count() })
        .from(affiliates)
        .where(eq(affiliates.status, "pending"));

      return {
        affiliates: result,
        pagination: {
          page,
          limit,
          total: countResult?.count || 0,
          totalPages: Math.ceil((countResult?.count || 0) / limit),
        },
        summary: {
          totalActive: stats?.totalAffiliates || 0,
          totalEarnings: Number(stats?.totalEarnings) || 0,
          totalReferrals: Number(stats?.totalReferrals) || 0,
          pendingApplications: pendingCount?.count || 0,
        },
      };
    }),

  /**
   * Get affiliate details with referral history
   */
  getAffiliateDetails: adminProcedure
    .input(z.object({ affiliateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get affiliate with user info
      const [affiliate] = await db
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
          bankDetails: affiliates.bankDetails,
          adminNotes: affiliates.adminNotes,
          appliedAt: affiliates.appliedAt,
          approvedAt: affiliates.approvedAt,
          rejectionReason: affiliates.rejectionReason,
          lastPayoutAt: affiliates.lastPayoutAt,
          userName: users.name,
          userEmail: users.email,
          userCompany: users.companyName,
          tierId: affiliates.tierId,
          tierName: affiliateTiers.name,
          tierLevel: affiliateTiers.level,
          commissionPercent: affiliateTiers.commissionPercent,
        })
        .from(affiliates)
        .leftJoin(users, eq(affiliates.userId, users.id))
        .leftJoin(affiliateTiers, eq(affiliates.tierId, affiliateTiers.id))
        .where(eq(affiliates.id, input.affiliateId))
        .limit(1);

      if (!affiliate) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Affiliate not found" });
      }

      // Get referrals
      const referralList = await db
        .select({
          id: referrals.id,
          referredUserId: referrals.referredUserId,
          status: referrals.status,
          createdAt: referrals.createdAt,
          qualifiedAt: referrals.qualifiedAt,
          convertedAt: referrals.convertedAt,
          userName: users.name,
          userEmail: users.email,
        })
        .from(referrals)
        .leftJoin(users, eq(referrals.referredUserId, users.id))
        .where(eq(referrals.affiliateId, input.affiliateId))
        .orderBy(desc(referrals.createdAt))
        .limit(50);

      // Get commissions
      const commissions = await db
        .select()
        .from(affiliateCommissions)
        .where(eq(affiliateCommissions.affiliateId, input.affiliateId))
        .orderBy(desc(affiliateCommissions.createdAt))
        .limit(20);

      // Get available tiers
      const tiers = await db
        .select()
        .from(affiliateTiers)
        .where(eq(affiliateTiers.isActive, 1))
        .orderBy(affiliateTiers.level);

      return {
        affiliate,
        referrals: referralList,
        commissions,
        availableTiers: tiers,
      };
    }),

  /**
   * Update affiliate status
   */
  updateAffiliateStatus: adminProcedure
    .input(z.object({
      affiliateId: z.number(),
      status: z.enum(["active", "suspended", "rejected"]),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      const updateData: any = { status: input.status };

      if (input.status === "active") {
        updateData.approvedAt = now;
        updateData.rejectionReason = null;
      } else if (input.status === "rejected") {
        updateData.rejectionReason = input.reason || "Application rejected";
      }

      await db.update(affiliates).set(updateData).where(eq(affiliates.id, input.affiliateId));

      // Log action
      await db.insert(adminAuditLogs).values({
        adminId: ctx.user.id,
        adminName: ctx.user.name,
        adminEmail: ctx.user.email,
        action: `affiliate_${input.status}`,
        resource: "affiliate",
        resourceId: input.affiliateId,
        details: JSON.stringify({ reason: input.reason }),
        status: "success",
      });

      // Get affiliate user for notification
      const [affiliate] = await db
        .select({ userId: affiliates.userId })
        .from(affiliates)
        .where(eq(affiliates.id, input.affiliateId))
        .limit(1);

      if (affiliate) {
        const [user] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, affiliate.userId))
          .limit(1);

        if (user?.email) {
          const subject = input.status === "active" 
            ? "Your Affiliate Application Has Been Approved!"
            : input.status === "suspended"
            ? "Your Affiliate Account Has Been Suspended"
            : "Affiliate Application Update";

          await sendEmail({
            to: user.email,
            subject,
            html: `
              <h2>Affiliate Status Update</h2>
              <p>Dear ${user.name || "User"},</p>
              <p>Your affiliate account status has been updated to: <strong>${input.status}</strong></p>
              ${input.reason ? `<p>Reason: ${input.reason}</p>` : ""}
            `,
            text: `Affiliate Status Update\n\nDear ${user.name || "User"},\n\nYour affiliate account status has been updated to: ${input.status}${input.reason ? `\n\nReason: ${input.reason}` : ""}`,
          });
        }
      }

      return { success: true };
    }),

  /**
   * Update affiliate commission tier
   */
  updateAffiliateTier: adminProcedure
    .input(z.object({
      affiliateId: z.number(),
      tierId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get the new tier info
      const [tier] = await db
        .select()
        .from(affiliateTiers)
        .where(eq(affiliateTiers.id, input.tierId))
        .limit(1);

      if (!tier) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tier not found" });
      }

      await db.update(affiliates).set({
        tierId: input.tierId,
        adminNotes: input.notes || null,
      }).where(eq(affiliates.id, input.affiliateId));

      // Log action
      await db.insert(adminAuditLogs).values({
        adminId: ctx.user.id,
        adminName: ctx.user.name,
        adminEmail: ctx.user.email,
        action: "affiliate_tier_changed",
        resource: "affiliate",
        resourceId: input.affiliateId,
        details: JSON.stringify({ newTierId: input.tierId, tierName: tier.name, notes: input.notes }),
        status: "success",
      });

      // Notify affiliate
      const [affiliate] = await db
        .select({ userId: affiliates.userId })
        .from(affiliates)
        .where(eq(affiliates.id, input.affiliateId))
        .limit(1);

      if (affiliate) {
        const [user] = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, affiliate.userId))
          .limit(1);

        if (user?.email) {
          await sendEmail({
            to: user.email,
            subject: "Your Affiliate Commission Tier Has Been Updated",
            html: `
              <h2>Commission Tier Update</h2>
              <p>Dear ${user.name || "User"},</p>
              <p>Your affiliate commission tier has been updated to: <strong>${tier.name}</strong></p>
              <p>New commission rate: <strong>${tier.commissionPercent}%</strong></p>
              ${input.notes ? `<p>Note: ${input.notes}</p>` : ""}
            `,
            text: `Commission Tier Update\n\nDear ${user.name || "User"},\n\nYour affiliate commission tier has been updated to: ${tier.name}\nNew commission rate: ${tier.commissionPercent}%${input.notes ? `\n\nNote: ${input.notes}` : ""}`,
          });
        }
      }

      return { success: true };
    }),

  // ==================== DASHBOARD METRICS ====================

  /**
   * Get overview metrics for the User Management Hub
   */
  getHubMetrics: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // User metrics
    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [verifiedUsers] = await db.select({ count: count() }).from(users).where(eq(users.kycStatus, "verified"));
    const [pendingKYC] = await db.select({ count: count() }).from(users).where(eq(users.kycStatus, "pending"));

    // Affiliate metrics
    const [totalAffiliates] = await db.select({ count: count() }).from(affiliates).where(eq(affiliates.status, "active"));
    const [pendingAffiliates] = await db.select({ count: count() }).from(affiliates).where(eq(affiliates.status, "pending"));
    const [affiliateStats] = await db
      .select({
        totalEarnings: sum(affiliates.totalEarnings),
        totalReferrals: sum(affiliates.totalReferrals),
      })
      .from(affiliates)
      .where(eq(affiliates.status, "active"));

    return {
      users: {
        total: totalUsers?.count || 0,
        verified: verifiedUsers?.count || 0,
        pendingKYC: pendingKYC?.count || 0,
      },
      affiliates: {
        total: totalAffiliates?.count || 0,
        pending: pendingAffiliates?.count || 0,
        totalEarnings: Number(affiliateStats?.totalEarnings) || 0,
        totalReferrals: Number(affiliateStats?.totalReferrals) || 0,
      },
    };
  }),
});
