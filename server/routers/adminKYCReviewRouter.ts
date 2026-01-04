import { router, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users, kycDocuments } from "../../drizzle/schema";
import { eq, desc, and, isNull, isNotNull } from "drizzle-orm";
import { sendEmail } from "../lib/emailService";

/**
 * Admin KYC Review Router
 * 
 * Allows admins to:
 * 1. View pending KYC submissions
 * 2. View submission details with documents
 * 3. Approve KYC submissions
 * 4. Reject KYC submissions with reason
 */

export const adminKYCReviewRouter = router({
  /**
   * Get all pending KYC submissions
   */
  getPendingSubmissions: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    // Get users with pending KYC (kycSubmittedAt is set but kycReviewedAt is null)
    const { sql } = await import("drizzle-orm");
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        companyName: users.companyName,
        kycSubmittedAt: users.kycSubmittedAt,
        kycVerified: users.kycVerified,
        kycRejectionReason: users.kycRejectionReason,
      })
      .from(users)
      .where(
        and(
          isNotNull(users.kycSubmittedAt),
          isNull(users.kycReviewedAt)
        )
      )
      .orderBy(desc(users.kycSubmittedAt));

    return result;
  }),

  /**
   * Get KYC submission details with documents
   */
  getSubmissionDetails: adminProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get user details
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userResult.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const user = userResult[0];

      // Get KYC documents
      const documents = await db
        .select()
        .from(kycDocuments)
        .where(eq(kycDocuments.userId, input.userId))
        .orderBy(desc(kycDocuments.createdAt));

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          companyName: user.companyName,
          phoneNumber: user.phoneNumber,
          location: user.location,
          kycSubmittedAt: user.kycSubmittedAt,
          kycVerified: user.kycVerified,
          kycRejectionReason: user.kycRejectionReason,
        },
        documents: documents.map((doc) => ({
          id: doc.id,
          documentType: doc.documentType,
          fileName: doc.fileName,
          fileUrl: doc.fileUrl,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          createdAt: doc.createdAt,
        })),
      };
    }),

  /**
   * Approve KYC submission
   */
  approveSubmission: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get user
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userResult.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const user = userResult[0];

      // Update user KYC status and verification status
      const now = new Date();
      const oneYearFromNow = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      await db
        .update(users)
        .set({
          kycVerified: true,
          kycReviewedAt: now,
          kycRejectionReason: null,
          verificationStatus: 'verified',
          verificationTier: 'verified',
          verifiedAt: now,
          verificationExpiresAt: oneYearFromNow,
        })
        .where(eq(users.id, input.userId));

      // Send approval email
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: "KYC Verification Approved - MSP M&A Marketplace",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                <h1 style="color: #10b981; margin-top: 0;">KYC Verification Approved!</h1>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Congratulations! Your KYC verification has been approved. You can now:
                </p>
                <ul style="font-size: 15px; margin: 20px 0; padding-left: 20px;">
                  <li>Create and publish MSP listings</li>
                  <li>Access confidential listings</li>
                  <li>Initiate deals and negotiations</li>
                  <li>Send and receive messages</li>
                  <li>Submit offers and proposals</li>
                </ul>
                <p style="font-size: 16px; margin-top: 30px;">
                  <strong>Your verification is valid for 12 months.</strong> You'll receive a reminder 30 days before expiration.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/marketplace" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                    Go to Marketplace
                  </a>
                </div>
              </div>
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #666;">
                <p>
                  If you have any questions, please contact our support team.
                </p>
              </div>
            </body>
            </html>
          `,
          text: `
Congratulations! Your KYC verification has been approved.

You can now:
- Create and publish MSP listings
- Access confidential listings
- Initiate deals and negotiations
- Send and receive messages
- Submit offers and proposals

Your verification is valid for 12 months. You'll receive a reminder 30 days before expiration.

Visit the marketplace: ${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/marketplace
          `,
        });
      }

      return { success: true, message: "KYC submission approved" };
    }),

  /**
   * Reject KYC submission with reason
   */
  rejectSubmission: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        rejectionReason: z.string().min(10, "Rejection reason must be at least 10 characters"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get user
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!userResult.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const user = userResult[0];

      // Update user KYC status and verification status
      const now = new Date();
      await db
        .update(users)
        .set({
          kycVerified: false,
          kycReviewedAt: now,
          kycRejectionReason: input.rejectionReason,
          verificationStatus: 'rejected',
          verificationTier: 'none',
          verifiedAt: null,
          verificationExpiresAt: null,
        })
        .where(eq(users.id, input.userId));

      // Send rejection email
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: "KYC Verification - Additional Information Needed",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                <h1 style="color: #f59e0b; margin-top: 0;">KYC Verification - Additional Information Needed</h1>
                <p style="font-size: 16px; margin-bottom: 20px;">
                  Thank you for submitting your KYC verification documents. Our team has reviewed your submission and needs additional information or clarification.
                </p>
                <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-weight: 600; color: #92400e;">Reason for rejection:</p>
                  <p style="margin: 8px 0 0 0; color: #78350f;">${input.rejectionReason}</p>
                </div>
                <p style="font-size: 16px; margin-top: 20px;">
                  Please address the issues mentioned above and resubmit your documents. You can do this from your profile page.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/profile" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                    Resubmit Documents
                  </a>
                </div>
              </div>
              <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #666;">
                <p>
                  If you have questions about the rejection reason, please contact our support team.
                </p>
              </div>
            </body>
            </html>
          `,
          text: `
KYC Verification - Additional Information Needed

Thank you for submitting your KYC verification documents. Our team has reviewed your submission and needs additional information or clarification.

Reason for rejection:
${input.rejectionReason}

Please address the issues mentioned above and resubmit your documents from your profile page.

If you have questions, please contact our support team.
          `,
        });
      }

      return { success: true, message: "KYC submission rejected" };
    }),

  /**
   * Get all KYC submissions (pending and reviewed)
   */
  getAllSubmissions: adminProcedure
    .input(
      z.object({
        status: z.enum(["all", "pending", "approved", "rejected"]).optional(),
        limit: z.number().optional().default(50),
        offset: z.number().optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { sql } = await import("drizzle-orm");
      
      let conditions = [isNotNull(users.kycSubmittedAt)];

      // Filter by status
      if (input.status === "pending") {
        conditions.push(isNull(users.kycReviewedAt));
      } else if (input.status === "approved") {
        conditions.push(eq(users.kycVerified, true));
      } else if (input.status === "rejected") {
        conditions.push(eq(users.kycVerified, false));
      }

      const result = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          companyName: users.companyName,
          kycSubmittedAt: users.kycSubmittedAt,
          kycReviewedAt: users.kycReviewedAt,
          kycVerified: users.kycVerified,
          kycRejectionReason: users.kycRejectionReason,
        })
        .from(users)
        .where(and(...conditions))
        .orderBy(desc(users.kycSubmittedAt))
        .limit(input.limit)
        .offset(input.offset);

      return result;
    }),
});
