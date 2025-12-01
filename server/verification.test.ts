import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user?: AuthenticatedUser): TrpcContext {
  return {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Verification System", () => {
  describe("verification.initiatePayment", () => {
    it("should create Stripe checkout session for authenticated user", async () => {
      const buyer: AuthenticatedUser = {
        id: 100,
        openId: "test-buyer",
        email: "buyer@example.com",
        name: "Test Buyer",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createTestContext(buyer);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.verification.initiatePayment();

      expect(result).toHaveProperty("sessionId");
      // Stripe session URL is returned in sessionId field
    });

    it("should reject unauthenticated users", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.verification.initiatePayment()).rejects.toThrow("login");
    });
  });

  describe("verification.uploadDocuments", () => {
    it("should require payment before uploading documents", async () => {
      const buyer: AuthenticatedUser = {
        id: 101,
        openId: "test-buyer-2",
        email: "buyer2@example.com",
        name: "Test Buyer 2",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createTestContext(buyer);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.verification.uploadDocuments({
          idDocumentUrl: "https://storage.example.com/id-123.jpg",
          proofOfFundsUrl: "https://storage.example.com/funds-123.pdf",
          fullName: "John Doe",
          dateOfBirth: "1990-01-01",
          address: "123 Main St, Boston, MA",
          fundsAmount: 50000000,
        })
      ).rejects.toThrow("Payment required");
    });

    it("should reject missing required fields", async () => {
      const buyer: AuthenticatedUser = {
        id: 102,
        openId: "test-buyer-3",
        email: "buyer3@example.com",
        name: "Test Buyer 3",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createTestContext(buyer);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.verification.uploadDocuments({
          idDocumentUrl: "",
          proofOfFundsUrl: "",
          fullName: "",
          dateOfBirth: "",
          address: "",
          fundsAmount: 0,
        })
      ).rejects.toThrow();
    });
  });

  describe("admin.verification.approveVerification", () => {
    it("should allow admin to approve verification", async () => {
      const admin: AuthenticatedUser = {
        id: 1,
        openId: "admin-user",
        email: "admin@example.com",
        name: "Admin User",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createTestContext(admin);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.verification.approveVerification({
        userId: 100,
        adminNotes: "Verified - all documents look good",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("approved");
    });

    it("should reject non-admin users", async () => {
      const buyer: AuthenticatedUser = {
        id: 104,
        openId: "test-buyer-5",
        email: "buyer5@example.com",
        name: "Test Buyer 5",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createTestContext(buyer);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.admin.verification.approveVerification({
          userId: 100,
        })
      ).rejects.toThrow("permission");
    });
  });

  describe("admin.verification.rejectVerification", () => {
    it("should allow admin to reject verification with reason", async () => {
      const admin: AuthenticatedUser = {
        id: 1,
        openId: "admin-user",
        email: "admin@example.com",
        name: "Admin User",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createTestContext(admin);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.verification.rejectVerification({
        userId: 101,
        reason: "ID document is blurry and unreadable. Please upload a clear photo.",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("rejected");
    });

    it("should require minimum reason length", async () => {
      const admin: AuthenticatedUser = {
        id: 1,
        openId: "admin-user",
        email: "admin@example.com",
        name: "Admin User",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createTestContext(admin);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.admin.verification.rejectVerification({
          userId: 101,
          reason: "Bad",
        })
      ).rejects.toThrow();
    });
  });

  describe("admin.verification.getPendingVerifications", () => {
    it("should return pending verifications for admin", async () => {
      const admin: AuthenticatedUser = {
        id: 1,
        openId: "admin-user",
        email: "admin@example.com",
        name: "Admin User",
        loginMethod: "manus",
        role: "admin",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createTestContext(admin);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.admin.verification.getPendingVerifications();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should reject non-admin users", async () => {
      const buyer: AuthenticatedUser = {
        id: 105,
        openId: "test-buyer-6",
        email: "buyer6@example.com",
        name: "Test Buyer 6",
        loginMethod: "manus",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createTestContext(buyer);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.admin.verification.getPendingVerifications()
      ).rejects.toThrow("permission");
    });
  });
});
