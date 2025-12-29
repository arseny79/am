import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import * as crypto from "crypto";
import { sendEmail } from "../lib/emailService";

/**
 * Email Verification Router
 * 
 * Handles email verification workflow:
 * 1. Send verification email with token link
 * 2. Verify token and mark email as verified
 * 3. Resend verification email if needed
 */

export const emailVerificationRouter = router({
  /**
   * Send verification email to user
   * Creates a verification token and sends email with link
   */
  sendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.user;

    if (!user.email) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No email address associated with account",
      });
    }

    if (user.emailVerified) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email already verified",
      });
    }

    // Generate verification token (32 random bytes as hex)
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24); // Token expires in 24 hours

    // Save token to database
    await db.setEmailVerificationToken(user.id, token, expiry);

    // Send verification email
    const verificationUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/verify-email/${token}`;
    
    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - MSP M&A Marketplace",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">Welcome to MSP M&A Marketplace!</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">
              Thank you for creating an account. To get started, please verify your email address by clicking the button below:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              This link will expire in 24 hours.
            </p>
          </div>
          <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; font-size: 12px; color: #666;">
            <p>
              <strong>Why verify your email?</strong><br>
              Email verification is required to:
            </p>
            <ul style="margin: 10px 0;">
              <li>Submit KYC verification documents</li>
              <li>Create MSP listings</li>
              <li>Request access to confidential listings</li>
              <li>Receive important notifications about your deals</li>
            </ul>
            <p style="margin-top: 20px;">
              If you didn't create an account on MSP M&A Marketplace, please ignore this email.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Welcome to MSP M&A Marketplace!

Thank you for creating an account. To get started, please verify your email address by clicking the link below:

${verificationUrl}

This link will expire in 24 hours.

Why verify your email?
Email verification is required to:
- Submit KYC verification documents
- Create MSP listings
- Request access to confidential listings
- Receive important notifications about your deals

If you didn't create an account on MSP M&A Marketplace, please ignore this email.
      `,
    });

    return {
      success: true,
      message: "Verification email sent",
    };
  }),

  /**
   * Verify email using token from URL
   */
  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const { token } = input;

      // Find user by verification token
      const user = await db.getUserByVerificationToken(token);

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invalid or expired verification token",
        });
      }

      // Check if token is expired
      if (user.emailVerificationTokenExpiry && user.emailVerificationTokenExpiry < new Date()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Verification token has expired. Please request a new one.",
        });
      }

      // Mark email as verified
      await db.markEmailAsVerified(user.id);

      return {
        success: true,
        message: "Email verified successfully",
      };
    }),

  /**
   * Resend verification email
   */
  resendVerificationEmail: protectedProcedure.mutation(async ({ ctx }) => {
    const user = ctx.user;

    if (!user.email) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "No email address associated with account",
      });
    }

    if (user.emailVerified) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email already verified",
      });
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);

    // Save token to database
    await db.setEmailVerificationToken(user.id, token, expiry);

    // Send verification email
    const verificationUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/verify-email/${token}`;
    
    await sendEmail({
      to: user.email,
      subject: "Verify Your Email - MSP M&A Marketplace",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
            <h1 style="color: #2563eb; margin-top: 0;">Verify Your Email</h1>
            <p style="font-size: 16px; margin-bottom: 20px;">
              You requested a new verification link. Click the button below to verify your email address:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
                Verify Email Address
              </a>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 30px;">
              Or copy and paste this link into your browser:<br>
              <a href="${verificationUrl}" style="color: #2563eb; word-break: break-all;">${verificationUrl}</a>
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              This link will expire in 24 hours.
            </p>
          </div>
        </body>
        </html>
      `,
      text: `
Verify Your Email

You requested a new verification link. Click the link below to verify your email address:

${verificationUrl}

This link will expire in 24 hours.
      `,
    });

    return {
      success: true,
      message: "Verification email resent",
    };
  }),

  /**
   * Check if current user's email is verified
   */
  getVerificationStatus: protectedProcedure.query(async ({ ctx }) => {
    return {
      emailVerified: ctx.user.emailVerified || false,
      email: ctx.user.email,
    };
  }),
});
