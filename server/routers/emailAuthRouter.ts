import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { dateToTimestamp, nowTimestamp } from "../lib/dbHelpers";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { hashPassword, verifyPassword, generateSecureToken, isTokenExpired, createTokenExpiry } from "../lib/passwordUtils";
import * as emailNotifications from "../emailNotifications";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "../_core/cookies";
import { sdk } from "../_core/sdk";
import { ENV } from "../_core/env";

export const emailAuthRouter = router({
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

      const existingUsers = await database
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existingUsers.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists" });
      }

      const passwordHash = await hashPassword(input.password);
      const emailVerificationToken = generateSecureToken();
      const emailVerificationTokenExpiry = createTokenExpiry(24);
      // openId column is varchar(64); "email_" = 6 chars, so token must be ≤ 58 chars.
      // Use 29 random bytes → 58 hex chars → total 64 chars exactly.
      const openId = `email_${generateSecureToken(29)}`;

      const [insertResult] = await database.insert(users).values({
        email: input.email,
        name: input.name,
        companyName: input.companyName,
        passwordHash,
        openId,
        loginMethod: "email",
        emailVerified: 0,
        emailVerificationToken,
        emailVerificationTokenExpiry: dateToTimestamp(emailVerificationTokenExpiry),
        role: "user",
      });

      // Fire email asynchronously so the HTTP response is not delayed by SendGrid.
      // A slow SendGrid call was causing the upstream proxy to time out and return
      // HTML before tRPC could respond, producing the client-side JSON.parse error.
      let emailSent = true;
      emailNotifications
        .sendEmailVerification({
          email: input.email,
          name: input.name,
          verificationToken: emailVerificationToken,
        })
        .then((sent) => {
          if (!sent) {
            console.error(`[Signup] Verification email failed to send to ${input.email} (userId=${insertResult.insertId})`);
          }
        })
        .catch((err) => {
          console.error(`[Signup] Unexpected error sending verification email to ${input.email}:`, err);
        });

      return {
        success: true,
        message: "Account created! Please check your email to verify your account.",
        userId: insertResult.insertId,
        emailSent,
      };
    }),

  verifyEmail: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.emailVerificationToken, input.token))
        .limit(1);

      if (userResults.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired verification token" });
      }

      const user = userResults[0]!;
      const tokenExpiryDate = user.emailVerificationTokenExpiry ? new Date(user.emailVerificationTokenExpiry) : null;
      if (isTokenExpired(tokenExpiryDate)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Verification token has expired. Please request a new one." });
      }

      await database
        .update(users)
        .set({ emailVerified: 1, emailVerificationToken: null, emailVerificationTokenExpiry: null })
        .where(eq(users.id, user.id));

      return { success: true, message: "Email verified successfully! You can now log in." };
    }),

  resendVerification: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userResults.length === 0) {
        return { success: true, message: "If an account exists with this email, a verification email has been sent." };
      }

      const user = userResults[0]!;

      if (user.emailVerified) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Email is already verified" });
      }

      const emailVerificationToken = generateSecureToken();
      const emailVerificationTokenExpiry = createTokenExpiry(24);

      await database
        .update(users)
        .set({ emailVerificationToken, emailVerificationTokenExpiry: dateToTimestamp(emailVerificationTokenExpiry) })
        .where(eq(users.id, user.id));

      if (user.email) {
        const emailSent = await emailNotifications.sendEmailVerification({
          email: user.email,
          name: user.name || "User",
          verificationToken: emailVerificationToken,
        });
        if (!emailSent) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to send verification email. Please try again later or contact support.",
          });
        }
      }

      return { success: true, message: "Verification email sent! Please check your inbox." };
    }),

  login: publicProcedure
    .input(z.object({ email: z.string().email(), password: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userResults.length === 0 || !userResults[0]!.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      const user = userResults[0]!;

      if (!user.passwordHash) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      const isValidPassword = await verifyPassword(input.password, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
      }

      if (!user.emailVerified) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Please verify your email before logging in" });
      }

      let openId = user.openId;
      if (!openId) {
        openId = `email_${generateSecureToken(29)}`;
        await database.update(users).set({ openId }).where(eq(users.id, user.id));
      }

      await database.update(users).set({ lastSignedIn: nowTimestamp() }).where(eq(users.id, user.id));

      const sessionToken = await sdk.createSessionToken(openId, {
        name: user.name || "",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      return { success: true };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (userResults.length === 0) {
        return { success: true, message: "If an account exists with this email, a password reset link has been sent." };
      }

      const user = userResults[0]!;

      const passwordResetToken = generateSecureToken();
      const passwordResetTokenExpiry = createTokenExpiry(1);

      await database
        .update(users)
        .set({ passwordResetToken, passwordResetTokenExpiry: dateToTimestamp(passwordResetTokenExpiry) })
        .where(eq(users.id, user.id));

      if (user.email) {
        await emailNotifications.sendPasswordReset({
          email: user.email,
          name: user.name || "User",
          resetToken: passwordResetToken,
        });
      }

      return { success: true, message: "If an account exists with this email, a password reset link has been sent." };
    }),

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

      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.passwordResetToken, input.token))
        .limit(1);

      if (userResults.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired reset token" });
      }

      const user = userResults[0]!;

      const resetTokenExpiryDate = user.passwordResetTokenExpiry ? new Date(user.passwordResetTokenExpiry) : null;
      if (isTokenExpired(resetTokenExpiryDate)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Reset token has expired. Please request a new one." });
      }

      const passwordHash = await hashPassword(input.newPassword);

      await database
        .update(users)
        .set({ passwordHash, passwordResetToken: null, passwordResetTokenExpiry: null })
        .where(eq(users.id, user.id));

      return { success: true, message: "Password reset successfully! You can now log in with your new password." };
    }),

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

      const userResults = await database
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (userResults.length === 0 || !userResults[0]!.passwordHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change password for this account type" });
      }

      const user = userResults[0]!;

      if (!user.passwordHash) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot change password for this account type" });
      }

      const isValidPassword = await verifyPassword(input.currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Current password is incorrect" });
      }

      const passwordHash = await hashPassword(input.newPassword);

      await database.update(users).set({ passwordHash }).where(eq(users.id, user.id));

      return { success: true, message: "Password changed successfully!" };
    }),
});
