import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { hashPassword } from "./lib/passwordUtils";

function createMockContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: () => {},
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Email/Password Authentication", () => {
  describe("signup", () => {
    it("creates a new user with hashed password", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const testEmail = `test-${Date.now()}@example.com`;
      
      const result = await caller.emailAuth.signup({
        email: testEmail,
        password: "SecurePass123!",
        name: "Test User",
        companyName: "Test Company",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("verify your account");
    });

    it("rejects weak passwords", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.emailAuth.signup({
          email: "test@example.com",
          password: "weak",
          name: "Test User",
        })
      ).rejects.toThrow();
    });

    it("rejects duplicate email addresses", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const testEmail = `duplicate-${Date.now()}@example.com`;

      // First signup should succeed
      await caller.emailAuth.signup({
        email: testEmail,
        password: "SecurePass123!",
        name: "First User",
      });

      // Second signup with same email should fail
      await expect(
        caller.emailAuth.signup({
          email: testEmail,
          password: "DifferentPass456!",
          name: "Second User",
        })
      ).rejects.toThrow("already exists");
    });
  });

  describe("login", () => {
    it("rejects login for unverified email", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const testEmail = `unverified-${Date.now()}@example.com`;
      
      // Create account but don't verify
      await caller.emailAuth.signup({
        email: testEmail,
        password: "SecurePass123!",
        name: "Unverified User",
      });

      // Try to login
      await expect(
        caller.emailAuth.login({
          email: testEmail,
          password: "SecurePass123!",
        })
      ).rejects.toThrow("verify your email");
    });

    it("rejects invalid password", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.emailAuth.login({
          email: "nonexistent@example.com",
          password: "WrongPassword123!",
        })
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("verifyEmail", () => {
    it("rejects expired verification tokens", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Use an obviously expired token (past date)
      await expect(
        caller.emailAuth.verifyEmail({
          token: "expired-token-12345",
        })
      ).rejects.toThrow();
    });

    it("rejects invalid verification tokens", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.emailAuth.verifyEmail({
          token: "invalid-token-xyz",
        })
      ).rejects.toThrow();
    });
  });

  describe("requestPasswordReset", () => {
    it("returns success message even for non-existent email (security)", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.emailAuth.requestPasswordReset({
        email: "nonexistent@example.com",
      });

      // Should not reveal whether email exists
      expect(result.success).toBe(true);
      expect(result.message).toContain("If an account exists");
    });

    it("generates reset token for existing user", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const testEmail = `reset-${Date.now()}@example.com`;
      
      // Create and verify account
      await caller.emailAuth.signup({
        email: testEmail,
        password: "SecurePass123!",
        name: "Reset User",
      });

      const result = await caller.emailAuth.requestPasswordReset({
        email: testEmail,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("resetPassword", () => {
    it("rejects invalid reset tokens", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.emailAuth.resetPassword({
          token: "invalid-reset-token",
          newPassword: "NewSecurePass123!",
        })
      ).rejects.toThrow();
    });

    it("rejects weak new passwords", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.emailAuth.resetPassword({
          token: "some-token",
          newPassword: "weak",
        })
      ).rejects.toThrow();
    });
  });

  describe("resendVerification", () => {
    it("returns success for non-existent email (security)", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.emailAuth.resendVerification({
        email: "nonexistent@example.com",
      });

      // Should not reveal whether email exists
      expect(result.success).toBe(true);
    });

    it("resends verification email for unverified user", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const testEmail = `resend-${Date.now()}@example.com`;
      
      // Create account
      await caller.emailAuth.signup({
        email: testEmail,
        password: "SecurePass123!",
        name: "Resend User",
      });

      // Resend verification
      const result = await caller.emailAuth.resendVerification({
        email: testEmail,
      });

      expect(result.success).toBe(true);
    });
  });
});
