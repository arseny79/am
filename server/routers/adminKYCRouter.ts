import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { nowTimestamp } from "../lib/dbHelpers";
import { users, kycDocuments } from "../../drizzle/schema";
import { sendEmail, EmailTemplates } from "../lib/emailService";

/**
 * Admin KYC Router - Admin endpoints for reviewing KYC submissions
 */
export const adminKYCRouter = router({
  /**
   * Get all pending KYC submissions
   */
  getPendingSubmissions: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Get users who have submitted KYC but not yet verified or rejected
    const pendingUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.kycVerified, 0),
          isNotNull(users.kycSubmittedAt),
          isNull(users.kycRejectionReason) // Exclude rejected submissions
        )
      )
      .orderBy(desc(users.kycSubmittedAt));

    // Get documents for each user
    const submissions = await Promise.all(
      pendingUsers.map(async (user) => {
        const documents = await db.select().from(kycDocuments).where(eq(kycDocuments.userId, user.id));
        return { user, documents };
      })
    );

    return submissions;
  }),

  /**
   * Approve KYC submission
   */
  approveKYC: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get user info before updating
      const userResult = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      const user = userResult[0];
      
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Update user
      await db
        .update(users)
        .set({
          kycVerified: 1,
          kycReviewedAt: nowTimestamp(),
          kycRejectionReason: null,
        })
        .where(eq(users.id, input.userId));

      // Mark all documents as approved
      await db
        .update(kycDocuments)
        .set({
          reviewStatus: "approved",
          reviewedAt: nowTimestamp(),
          reviewedBy: ctx.user.id,
        })
        .where(eq(kycDocuments.userId, input.userId));

      // Send approval email
      if (user.email) {
        const dashboardUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL?.replace('/api', '') || 'https://mspmarketplace.com'}/dashboard`;
        await sendEmail({
          to: user.email,
          ...EmailTemplates.kycApproved({
            recipientName: user.name || 'User',
            dashboardUrl,
          }),
        });
      }

      return { success: true };
    }),

  /**
   * Reject KYC submission
   */
  rejectKYC: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get user info before updating
      const userResult = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      const user = userResult[0];
      
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Update user
      await db
        .update(users)
        .set({
          kycVerified: 0,
          kycReviewedAt: nowTimestamp(),
          kycRejectionReason: input.reason,
          kycSubmittedAt: null, // Allow resubmission
        })
        .where(eq(users.id, input.userId));

      // Mark all documents as rejected
      await db
        .update(kycDocuments)
        .set({
          reviewStatus: "rejected",
          reviewedAt: nowTimestamp(),
          reviewedBy: ctx.user.id,
          reviewNotes: input.reason,
        })
        .where(eq(kycDocuments.userId, input.userId));

      // Send rejection email
      if (user.email) {
        const resubmitUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL?.replace('/api', '') || 'https://mspmarketplace.com'}/verify-account`;
        await sendEmail({
          to: user.email,
          ...EmailTemplates.kycRejected({
            recipientName: user.name || 'User',
            reason: input.reason,
            resubmitUrl,
          }),
        });
      }

      return { success: true };
    }),
});
