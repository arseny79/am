import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { buyerVerifications, users } from "../../drizzle/schema";

export const adminVerificationRouter = router({
  /**
   * Get all pending verifications for review
   */
  getPendingVerifications: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const verifications = await db
      .select({
        verification: buyerVerifications,
        user: users,
      })
      .from(buyerVerifications)
      .leftJoin(users, eq(buyerVerifications.userId, users.id))
      .where(eq(users.verificationStatus, "review_pending"))
      .orderBy(desc(buyerVerifications.createdAt));

    return verifications.map((v) => ({
      ...v.verification,
      user: v.user,
    }));
  }),

  /**
   * Get all verifications (for audit log)
   */
  getAllVerifications: adminProcedure
    .input(
      z.object({
        status: z.enum(["all", "verified", "rejected", "pending"]).optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let query = db
        .select({
          verification: buyerVerifications,
          user: users,
        })
        .from(buyerVerifications)
        .leftJoin(users, eq(buyerVerifications.userId, users.id))
        .orderBy(desc(buyerVerifications.createdAt));

      const results = await query;

      // Filter by status if provided
      if (input.status && input.status !== "all") {
        return results.filter((v) => {
          if (input.status === "verified") return v.user?.verificationStatus === "verified";
          if (input.status === "rejected") return v.user?.verificationStatus === "rejected";
          if (input.status === "pending") return v.user?.verificationStatus === "review_pending";
          return true;
        });
      }

      return results.map((v) => ({
        ...v.verification,
        user: v.user,
      }));
    }),

  /**
   * Approve verification
   */
  approveVerification: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        adminNotes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Update user status
      await db
        .update(users)
        .set({
          verificationStatus: "verified",
          verifiedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      // Update verification record
      await db
        .update(buyerVerifications)
        .set({
          identityStatus: "verified",
          bankStatus: "verified",
          reviewStatus: "approved",
          reviewNotes: input.adminNotes,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(buyerVerifications.userId, input.userId));

      return {
        success: true,
        message: "Verification approved",
      };
    }),

  /**
   * Reject verification
   */
  rejectVerification: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        reason: z.string().min(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Update user status
      await db
        .update(users)
        .set({
          verificationStatus: "rejected",
          updatedAt: new Date(),
        })
        .where(eq(users.id, input.userId));

      // Update verification record
      await db
        .update(buyerVerifications)
        .set({
          identityStatus: "failed",
          bankStatus: "failed",
          reviewStatus: "rejected",
          rejectionReason: input.reason,
          reviewNotes: input.reason,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(buyerVerifications.userId, input.userId));

      return {
        success: true,
        message: "Verification rejected",
      };
    }),
});
