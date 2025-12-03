import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateSecureToken, isTokenExpired, createTokenExpiry } from "../lib/passwordUtils";
import * as emailNotifications from "../emailNotifications";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";

import { ENV } from "../_core/env";

export const emailAuthRouter = router({
  // Sign up with email and password
  signup: publicProcedure
    .input(z.object({
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      name: z.string().min(1, "Name is required"),
      companyName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Check if email already exists
      const existingUsers = await database
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUsers.length > 0) {
        throw new TRPCError({ 
          code: "CONFLICT", 
          message: "An account with this email already exists" 
        });
      }

      // Hash password
      const passwordHash = await hashPassword(input.password);

      // Generate email verification token
      const emailVerificationToken = generateSecureToken();
      const emailVerificationTokenExpiry = createTokenExpiry(24); // 24 hours

      // Create user
      await database.insert(users).values({
        email: input.email,
        name: input.name,
        companyName: input.companyName,
        passwordHash,
        loginMethod: "email",
        emailVerified: false,
        emailVerificationToken,
        emailVerificationTokenExpiry,
        role: "user",
      });

      // Send verification email
      await emailNotifications.sendEmailVerification({
        email: input.email,
        name: input.name,
        verificationToken: emailVerificationToken,
      });

      return {
        success: true,
        message: "Account created! Please check your email to verify your account.",
      };
    }),

  // Verify email with token
  verifyEmail: publicProcedure
    .input(z.object({
      token: z.string(),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Find user with this verification token
      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, input.token))
        .limit(1);

      if (userResults.length === 0) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Invalid or expired verification token" 
        });
      }

      const user = userResults[0]!;

      // Check if token is expired
      if (isTokenExpired(user.emailVerificationTokenExpiry)) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Verification token has expired. Please request a new one." 
        });
      }

      // Mark email as verified
      await database
        .update(users)
        .set({
          emailVerified: true,
          emailVerificationToken: null,
          emailVerificationTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: "Email verified successfully! You can now log in.",
      };
    }),

  // Resend verification email
  resendVerification: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Find user
      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userResults.length === 0) {
        // Don't reveal if email exists or not (security)
        return {
          success: true,
          message: "If an account exists with this email, a verification email has been sent.",
        };
      }

      const user = userResults[0]!;

      // Check if already verified
      if (user.emailVerified) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Email is already verified" 
        });
      }

      // Generate new verification token
      const emailVerificationToken = generateSecureToken();
      const emailVerificationTokenExpiry = createTokenExpiry(24);

      await database
        .update(users)
        .set({
          emailVerificationToken,
          emailVerificationTokenExpiry,
        })
        .where(eq(users.id, user.id));

      // Send verification email
      if (user.email) {
        await emailNotifications.sendEmailVerification({
          email: user.email,
          name: user.name || "User",
          verificationToken: emailVerificationToken,
        });
      }

      return {
        success: true,
        message: "Verification email sent! Please check your inbox.",
      };
    }),

  // Login with email and password
  login: publicProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Find user by email
      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userResults.length === 0 || !userResults[0]!.passwordHash) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Invalid email or password" 
        });
      }

      const user = userResults[0]!;

      // Verify password
      if (!user.passwordHash) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Invalid email or password" 
        });
      }
      const isValidPassword = await verifyPassword(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Invalid email or password" 
        });
      }

      // Check if email is verified
      if (!user.emailVerified) {
        throw new TRPCError({ 
          code: "FORBIDDEN", 
          message: "Please verify your email before logging in" 
        });
      }

      // Update last signed in
      await database
        .update(users)
        .set({
          lastSignedIn: new Date(),
        })
        .where(eq(users.id, user.id));

      // Note: Session management is handled by the existing OAuth system
      // For email/password users, we'll integrate with the same session system
      // The user will need to be redirected to complete login through the OAuth flow

      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      };
    }),

  // Request password reset
  requestPasswordReset: publicProcedure
    .input(z.object({
      email: z.string().email(),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Find user
      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      // Don't reveal if email exists or not (security)
      if (userResults.length === 0) {
        return {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent.",
        };
      }

      const user = userResults[0]!;

      // Only allow password reset for email/password users
      if (!user.passwordHash) {
        return {
          success: true,
          message: "If an account exists with this email, a password reset link has been sent.",
        };
      }

      // Generate password reset token
      const passwordResetToken = generateSecureToken();
      const passwordResetTokenExpiry = createTokenExpiry(1); // 1 hour

      await database
        .update(users)
        .set({
          passwordResetToken,
          passwordResetTokenExpiry,
        })
        .where(eq(users.id, user.id));

      // Send password reset email
      if (user.email) {
        await emailNotifications.sendPasswordReset({
          email: user.email,
          name: user.name || "User",
          resetToken: passwordResetToken,
        });
      }

      return {
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      };
    }),

  // Reset password with token
  resetPassword: publicProcedure
    .input(z.object({
      token: z.string(),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Find user with this reset token
      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.passwordResetToken, input.token))
        .limit(1);

      if (userResults.length === 0) {
        throw new TRPCError({ 
          code: "NOT_FOUND", 
          message: "Invalid or expired reset token" 
        });
      }

      const user = userResults[0]!;

      // Check if token is expired
      if (isTokenExpired(user.passwordResetTokenExpiry)) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Reset token has expired. Please request a new one." 
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(input.newPassword);

      // Update password and clear reset token
      await database
        .update(users)
        .set({
          passwordHash,
          passwordResetToken: null,
          passwordResetTokenExpiry: null,
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: "Password reset successfully! You can now log in with your new password.",
      };
    }),

  // Change password (for logged-in users)
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8, "Password must be at least 8 characters"),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Get user
      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (userResults.length === 0 || !userResults[0]!.passwordHash) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Cannot change password for this account type" 
        });
      }

      const user = userResults[0]!;

      // Verify current password
      if (!user.passwordHash) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Cannot change password for this account type" 
        });
      }
      const isValidPassword = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({ 
          code: "UNAUTHORIZED", 
          message: "Current password is incorrect" 
        });
      }

      // Hash new password
      const passwordHash = await hashPassword(input.newPassword);

      // Update password
      await database
        .update(users)
        .set({
          passwordHash,
        })
        .where(eq(users.id, user.id));

      return {
        success: true,
        message: "Password changed successfully!",
      };
    }),
});
