import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, desc } from "drizzle-orm";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { dateToTimestamp, nowTimestamp } from "../lib/dbHelpers";
import { users, kycDocuments } from "../../drizzle/schema";
import { sendEmail, EmailTemplates } from "../lib/emailService";
import { notifyOwner } from "../_core/notification";
import { notifyAdminsOfKYCSubmission } from "../jobs/adminKYCNotification";

/**
 * Simple KYC Router - FREE manual verification
 * Users upload ID + Address proof, admin reviews and toggles kycVerified
 */
export const kycRouter = router({
  /**
   * Submit KYC documents (ID + Address)
   */
  submitDocuments: protectedProcedure
    .input(
      z.object({
        documents: z.array(
          z.object({
            documentType: z.enum(["government_id", "proof_of_address"]),
            fileName: z.string(),
            fileUrl: z.string(),
            fileSize: z.number().optional(),
            mimeType: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log(`[KYC] submitDocuments called by user ${ctx.user.id}:`, JSON.stringify(input, null, 2));
      
      const db = await getDb();
      if (!db) {
        console.error('[KYC] Database not available');
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      }

      // Email verification gate
      if (!ctx.user.emailVerified) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Please verify your email address before submitting KYC documents",
        });
      }

      // Validate: must have both ID and Address
      const hasID = input.documents.some((d) => d.documentType === "government_id");
      const hasAddress = input.documents.some((d) => d.documentType === "proof_of_address");

      if (!hasID || !hasAddress) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Please upload both Government ID and Proof of Address",
        });
      }

      // Insert documents
      console.log(`[KYC] Inserting ${input.documents.length} documents for user ${ctx.user.id}`);
      for (const doc of input.documents) {
        try {
          console.log(`[KYC] Inserting document: ${doc.documentType} - ${doc.fileName}`);
          await db.insert(kycDocuments).values({
            userId: ctx.user.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize ?? undefined,
            mimeType: doc.mimeType ?? undefined,
            // reviewStatus defaults to 'pending' in database
          });
          console.log(`[KYC] Document inserted successfully: ${doc.documentType}`);
        } catch (insertError) {
          console.error(`[KYC] Failed to insert document ${doc.documentType}:`, insertError);
          throw insertError;
        }
      }

      // Update user submission timestamp and set kycStatus to pending
      await db
        .update(users)
        .set({
          kycSubmittedAt: nowTimestamp(),
          kycStatus: 'pending',
        })
        .where(eq(users.id, ctx.user.id));

      // Send confirmation email to user
      if (ctx.user.email) {
        await sendEmail({
          to: ctx.user.email,
          subject: "KYC Documents Received - MSP M&A Marketplace",
          text: `Hi ${ctx.user.name || 'there'},\n\nWe've received your KYC verification documents and they are now under review.\n\nDocuments submitted:\n${input.documents.map(d => `- ${d.documentType === 'government_id' ? 'Government ID' : 'Proof of Address'}: ${d.fileName}`).join('\n')}\n\nOur team will review your documents within 1-2 business days. You'll receive an email once the review is complete.\n\nThank you for your patience!\n\nBest regards,\nMSP M&A Marketplace Team`,
          html: `
            <h2>KYC Documents Received</h2>
            <p>Hi ${ctx.user.name || 'there'},</p>
            <p>We've received your KYC verification documents and they are now under review.</p>
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; font-weight: bold;">Documents submitted:</p>
              <ul style="margin: 8px 0 0 0;">
                ${input.documents.map(d => `<li>${d.documentType === 'government_id' ? 'Government ID' : 'Proof of Address'}: ${d.fileName}</li>`).join('')}
              </ul>
            </div>
            <p>Our team will review your documents within 1-2 business days. You'll receive an email once the review is complete.</p>
            <p>Thank you for your patience!</p>
            <p>Best regards,<br>MSP M&A Marketplace Team</p>
          `,
        });
      }

      // Notify owner/admin about new submission (legacy)
      await notifyOwner({
        title: "New KYC Submission",
        content: `${ctx.user.name || ctx.user.email} submitted KYC documents for review (${input.documents.length} files)`,
      });

      // Send email notifications to all admins (Enhancement #3)
      // Non-blocking - user's submission succeeds even if admin notification fails
      notifyAdminsOfKYCSubmission({
        userId: ctx.user.id,
        userName: ctx.user.name || '',
        userEmail: ctx.user.email || '',
      }).catch((error) => {
        console.error('[KYC] Failed to notify admins:', error);
      });

      return { success: true, message: "KYC documents submitted for review" };
    }),

  /**
   * Get current user's KYC status
   */
  getMyStatus: protectedProcedure.query(async ({ ctx }) => {
    return {
      kycVerified: ctx.user.kycVerified,
      kycSubmittedAt: ctx.user.kycSubmittedAt,
      kycReviewedAt: ctx.user.kycReviewedAt,
      kycRejectionReason: ctx.user.kycRejectionReason,
    };
  }),

  /**
   * Get current user's submitted documents
   */
  getMyDocuments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const docs = await db.select().from(kycDocuments).where(eq(kycDocuments.userId, ctx.user.id));

    return docs;
  }),

  /**
   * Admin: Get all pending KYC submissions
   */
  adminGetPending: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const pendingUsers = await db
      .select()
      .from(users)
      .where(eq(users.kycVerified, 0))
      .orderBy(desc(users.kycSubmittedAt));

    // Filter only users who have submitted documents
    const usersWithSubmissions = pendingUsers.filter((u) => u.kycSubmittedAt !== null);

    // Get documents for each user
    const usersWithDocs = await Promise.all(
      usersWithSubmissions.map(async (user) => {
        const docs = await db.select().from(kycDocuments).where(eq(kycDocuments.userId, user.id));
        return { ...user, documents: docs };
      })
    );

    return usersWithDocs;
  }),

  /**
   * Admin: Approve KYC
   */
  adminApprove: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Update user
      await db
        .update(users)
        .set({
          kycVerified: 1,
          kycReviewedAt: nowTimestamp(),
          kycRejectionReason: null,
          verificationStatus: 'verified',
          verificationTier: 'verified',
          verifiedAt: nowTimestamp(),
          verificationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '),
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
      const approvedUser = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (approvedUser[0]?.email) {
        const emailTemplate = EmailTemplates.kycApproved({
          recipientName: approvedUser[0].name || 'User',
          dashboardUrl: `${process.env.VITE_APP_URL || 'https://msp.investments'}/create-listing`,
        });
        await sendEmail({
          to: approvedUser[0].email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        });
        console.log(`[KYC] Approval email sent to ${approvedUser[0].email}`);
      }

      return { success: true };
    }),

  /**
   * Admin: Reject KYC
   */
  adminReject: adminProcedure
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
      const rejectedUser = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
      if (rejectedUser[0]?.email) {
        const emailTemplate = EmailTemplates.kycRejected({
          recipientName: rejectedUser[0].name || 'User',
          reason: input.reason,
          resubmitUrl: `${process.env.VITE_APP_URL || 'https://msp.investments'}/verify-account`,
        });
        await sendEmail({
          to: rejectedUser[0].email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
        });
        console.log(`[KYC] Rejection email sent to ${rejectedUser[0].email}`);
      }

      return { success: true };
    }),
});
