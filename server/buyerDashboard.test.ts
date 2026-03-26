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

describe("Buyer Dashboard Integration", () => {
  describe("Authentication Requirements", () => {
    it("should reject unauthenticated access to verification status", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.verification.getStatus()).rejects.toThrow("login");
    });

    it("should reject unauthenticated payment initiation", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.verification.initiatePayment()).rejects.toThrow("login");
    });

    it("should reject unauthenticated document upload", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.verification.uploadDocuments({
          idDocumentUrl: "https://example.com/id.jpg",
          proofOfFundsUrl: "https://example.com/funds.pdf",
          fullName: "Test User",
          dateOfBirth: "1990-01-01",
          address: "123 Main St",
          fundsAmount: 50000000,
        })
      ).rejects.toThrow();
    });


  });

  describe("Verification Payment Flow", () => {
    it("should create Stripe checkout session for authenticated user", async () => {
      const buyer: AuthenticatedUser = {
        id: 300,
        openId: "test-buyer-payment",
        email: "payment@example.com",
        name: "Test Payment Buyer",
        loginMethod: "email",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createTestContext(buyer);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.verification.initiatePayment();

      expect(result).toHaveProperty("sessionId");
      expect(typeof result.sessionId).toBe("string");
    });
  });



  describe("Document Upload Validation", () => {
    it("should require payment before document upload", async () => {
      const buyer: AuthenticatedUser = {
        id: 303,
        openId: "test-buyer-no-payment",
        email: "nopayment@example.com",
        name: "No Payment Buyer",
        loginMethod: "email",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      };

      const ctx = createTestContext(buyer);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.verification.uploadDocuments({
          idDocumentUrl: "https://example.com/id.jpg",
          proofOfFundsUrl: "https://example.com/funds.pdf",
          fullName: "Test User",
          dateOfBirth: "1990-01-01",
          address: "123 Main St",
          fundsAmount: 50000000,
        })
      ).rejects.toThrow("Payment required");
    });

    it("should validate required document fields", async () => {
      const buyer: AuthenticatedUser = {
        id: 304,
        openId: "test-buyer-validation",
        email: "validation@example.com",
        name: "Validation Buyer",
        loginMethod: "email",
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


});
