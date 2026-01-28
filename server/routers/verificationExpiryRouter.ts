import { router, publicProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq, and, gte, lte, isNotNull, sql } from "drizzle-orm";
import { sendEmail } from "../lib/emailService";

/**
 * Verification Expiry Reminder Router
 * 
 * Handles automated reminders for users whose verification will expire soon
 * - Sends email 30 days before expiration
 * - Tracks which users have been reminded
 */

export const verificationExpiryRouter = router({
  /**
   * Get users whose verification expires in 30 days
   * This is used by the cron job to send reminders
   */
  getExpiringVerifications: adminProcedure
    .input(
      z.object({
        daysUntilExpiry: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get users with verification expiring in ~30 days
      const result = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          verificationExpiresAt: users.verificationExpiresAt,
        })
        .from(users)
        .where(
          and(
            eq(users.verificationStatus, "verified"),
            isNotNull(users.verificationExpiresAt),
            sql`${users.verificationExpiresAt} >= DATE_ADD(NOW(), INTERVAL ${input.daysUntilExpiry - 1} DAY)`,
            sql`${users.verificationExpiresAt} <= DATE_ADD(NOW(), INTERVAL ${input.daysUntilExpiry + 1} DAY)`
          )
        );

      return result;
    }),

  /**
   * Send expiry reminder email to a user
   */
  sendExpiryReminder: adminProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
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

      if (!user.email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User does not have an email address",
        });
      }

      if (user.verificationStatus !== "verified" || !user.verificationExpiresAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User does not have active verification",
        });
      }

      // Calculate days until expiry
      const now = new Date();
      const expiryDate = new Date(user.verificationExpiresAt);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Send reminder email
      await sendEmail({
        to: user.email,
        subject: `Your Verification Expires in ${daysUntilExpiry} Days - MSP M&A Marketplace`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
              <h1 style="color: #f59e0b; margin-top: 0;">Verification Expiry Reminder</h1>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Hi ${user.name || "there"},
              </p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                Your marketplace verification will expire in <strong>${daysUntilExpiry} days</strong> on <strong>${expiryDate.toLocaleDateString()}</strong>.
              </p>
              <p style="font-size: 16px; margin-bottom: 20px;">
                To continue using all marketplace features, please renew your verification before the expiration date.
              </p>
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-weight: 600; color: #92400e;">What happens when verification expires?</p>
                <ul style="margin: 8px 0 0 0; padding-left: 20px; color: #78350f;">
                  <li>You won't be able to create or manage listings</li>
                  <li>You won't be able to initiate new deals</li>
                  <li>You won't be able to access confidential listings</li>
                  <li>Existing deals will be paused</li>
                </ul>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/verification" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                  Renew Verification
                </a>
              </div>
              <p style="font-size: 14px; color: #666; margin-top: 20px;">
                If you have any questions, please contact our support team.
              </p>
            </div>
          </body>
          </html>
        `,
        text: `
Verification Expiry Reminder

Hi ${user.name || "there"},

Your marketplace verification will expire in ${daysUntilExpiry} days on ${expiryDate.toLocaleDateString()}.

To continue using all marketplace features, please renew your verification before the expiration date.

What happens when verification expires?
- You won't be able to create or manage listings
- You won't be able to initiate new deals
- You won't be able to access confidential listings
- Existing deals will be paused

Renew your verification: ${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/verification

If you have any questions, please contact our support team.
        `,
      });

      return { success: true, message: "Reminder email sent" };
    }),

  /**
   * Send reminders to all users with expiring verification
   * This is called by a cron job
   */
  sendAllExpiryReminders: publicProcedure
    .input(
      z.object({
        cronSecret: z.string(),
        daysUntilExpiry: z.number().optional().default(30),
      })
    )
    .mutation(async ({ input }) => {
      // Validate cron secret
      const expectedSecret = process.env.CRON_SECRET || "default-secret";
      if (input.cronSecret !== expectedSecret) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid cron secret",
        });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const now = new Date();
      const expiryStart = new Date(now.getTime() + (input.daysUntilExpiry - 1) * 24 * 60 * 60 * 1000);
      const expiryEnd = new Date(now.getTime() + (input.daysUntilExpiry + 1) * 24 * 60 * 60 * 1000);

      // Get users with verification expiring in ~30 days
      const expiringUsers = await db
        .select()
        .from(users)
        .where(
          and(
            eq(users.verificationStatus, "verified"),
            isNotNull(users.verificationExpiresAt),
            gte(users.verificationExpiresAt, expiryStart),
            lte(users.verificationExpiresAt, expiryEnd)
          )
        );

      let successCount = 0;
      let failureCount = 0;

      // Send reminder to each user
      for (const user of expiringUsers) {
        try {
          if (!user.email) {
            failureCount++;
            continue;
          }

          const expiryDate = new Date(user.verificationExpiresAt!);
          const daysUntilExpiry = Math.ceil(
            (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          await sendEmail({
            to: user.email,
            subject: `Your Verification Expires in ${daysUntilExpiry} Days - MSP M&A Marketplace`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
                  <h1 style="color: #f59e0b; margin-top: 0;">Verification Expiry Reminder</h1>
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Hi ${user.name || "there"},
                  </p>
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    Your marketplace verification will expire in <strong>${daysUntilExpiry} days</strong> on <strong>${expiryDate.toLocaleDateString()}</strong>.
                  </p>
                  <p style="font-size: 16px; margin-bottom: 20px;">
                    To continue using all marketplace features, please renew your verification before the expiration date.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/verification" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                      Renew Verification
                    </a>
                  </div>
                </div>
              </body>
              </html>
            `,
            text: `
Your marketplace verification will expire in ${daysUntilExpiry} days on ${expiryDate.toLocaleDateString()}.

To continue using all marketplace features, please renew your verification before the expiration date.

Renew your verification: ${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/verification
            `,
          });

          successCount++;
        } catch (error) {
          console.error(`Failed to send reminder to user ${user.id}:`, error);
          failureCount++;
        }
      }

      return {
        success: true,
        message: `Sent ${successCount} reminders, ${failureCount} failures`,
        successCount,
        failureCount,
        totalUsers: expiringUsers.length,
      };
    }),
});
