import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, kycDocuments } from "../../drizzle/schema";

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
          eq(users.kycVerified, false),
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

      // Update user
      await db
        .update(users)
        .set({
          kycVerified: true,
          kycReviewedAt: new Date(),
          kycRejectionReason: null,
        })
        .where(eq(users.id, input.userId));

      // Mark all documents as approved
      await db
        .update(kycDocuments)
        .set({
          reviewStatus: "approved",
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
        })
        .where(eq(kycDocuments.userId, input.userId));

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

      // Update user
      await db
        .update(users)
        .set({
          kycVerified: false,
          kycReviewedAt: new Date(),
          kycRejectionReason: input.reason,
          kycSubmittedAt: null, // Allow resubmission
        })
        .where(eq(users.id, input.userId));

      // Mark all documents as rejected
      await db
        .update(kycDocuments)
        .set({
          reviewStatus: "rejected",
          reviewedAt: new Date(),
          reviewedBy: ctx.user.id,
          reviewNotes: input.reason,
        })
        .where(eq(kycDocuments.userId, input.userId));

      return { success: true };
    }),
});
