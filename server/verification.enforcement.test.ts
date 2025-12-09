import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user: Partial<AuthenticatedUser> = {}): { ctx: TrpcContext } {
  const defaultUser: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    passwordHash: null,
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpiry: null,
    passwordResetToken: null,
    passwordResetTokenExpiry: null,
    companyName: "Test MSP",
    companyWebsite: null,
    phoneNumber: null,
    location: null,
    bio: null,
    tosAcceptedAt: new Date(),
    privacyPolicyAcceptedAt: new Date(),
    verificationStatus: "unverified",
    verificationTier: "none",
    verifiedAt: null,
    verificationExpiresAt: null,
    stripeIdentitySessionId: null,
    plaidAccessToken: null,
    fundsVerifiedAmount: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...user,
  };

  const ctx: TrpcContext = {
    user: defaultUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Verification Enforcement", () => {
  describe("Listing Creation", () => {
    it("blocks unverified user from creating listing", async () => {
      const { ctx } = createTestContext({ verificationStatus: "unverified" });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.listing.create({
          businessName: "Test MSP",
          location: "Austin, TX",
          monthlyRecurringRevenue: 50000,
          annualRevenue: 600000,
          ebitda: 150000,
          clientCount: 50,
          description: "Test MSP business",
        })
      ).rejects.toThrow("You must complete verification");
    });

    it("blocks payment_pending user from creating listing", async () => {
      const { ctx } = createTestContext({ verificationStatus: "payment_pending" });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.listing.create({
          businessName: "Test MSP",
          location: "Austin, TX",
          monthlyRecurringRevenue: 50000,
          annualRevenue: 600000,
          ebitda: 150000,
          clientCount: 50,
          description: "Test MSP business",
        })
      ).rejects.toThrow("You must complete verification");
    });

    it("blocks review_pending user from creating listing", async () => {
      const { ctx } = createTestContext({ verificationStatus: "review_pending" });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.listing.create({
          businessName: "Test MSP",
          location: "Austin, TX",
          monthlyRecurringRevenue: 50000,
          annualRevenue: 600000,
          ebitda: 150000,
          clientCount: 50,
          description: "Test MSP business",
        })
      ).rejects.toThrow("You must complete verification");
    });

    it("allows verified user to create listing", async () => {
      const { ctx } = createTestContext({
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verificationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.listing.create({
        businessName: "Test MSP",
        location: "Austin, TX",
        monthlyRecurringRevenue: 50000,
        annualRevenue: 600000,
        ebitda: 150000,
        clientCount: 50,
        description: "Test MSP business",
      });

      expect(result.success).toBe(true);
    });

    it("blocks user with expired verification", async () => {
      const { ctx } = createTestContext({
        verificationStatus: "verified",
        verifiedAt: new Date("2023-01-01"),
        verificationExpiresAt: new Date("2024-01-01"), // Expired
      });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.listing.create({
          businessName: "Test MSP",
          location: "Austin, TX",
          monthlyRecurringRevenue: 50000,
          annualRevenue: 600000,
          ebitda: 150000,
          clientCount: 50,
          description: "Test MSP business",
        })
      ).rejects.toThrow("Your verification has expired");
    });
  });

  describe("Access Requests", () => {
    it("blocks unverified user from requesting access", async () => {
      const { ctx } = createTestContext({ verificationStatus: "unverified" });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.accessRequest.create({
          listingId: 1,
          contactEmail: "buyer@example.com",
          message: "I am interested in this listing and would like to request access to confidential information.",
        })
      ).rejects.toThrow("You must complete verification");
    });

    it("allows verified user to request access", async () => {
      const { ctx } = createTestContext({
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verificationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      const caller = appRouter.createCaller(ctx);

      // Note: This will fail with "Listing not found" because we don't have a real listing
      // But it proves the verification check passed
      await expect(
        caller.accessRequest.create({
          listingId: 999999,
          contactEmail: "buyer@example.com",
          message: "I am interested in this listing and would like to request access to confidential information.",
        })
      ).rejects.toThrow("Listing not found");
    });
  });

  describe("Buyer Requests", () => {
    it("blocks unverified user from posting buyer request", async () => {
      const { ctx } = createTestContext({ verificationStatus: "unverified" });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.buyerRequest.create({
          title: "Seeking MSP in Texas",
          description: "Looking for a managed service provider in Texas with strong growth potential and recurring revenue.",
          minRevenue: 500000,
          maxRevenue: 2000000,
        })
      ).rejects.toThrow("You must complete verification");
    });

    it("allows verified user to post buyer request", async () => {
      const { ctx } = createTestContext({
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verificationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.buyerRequest.create({
        title: "Seeking MSP in Texas",
        description: "Looking for a managed service provider in Texas with strong growth potential and recurring revenue.",
        minRevenue: 500000,
        maxRevenue: 2000000,
      });

      expect(result).toHaveProperty("id");
    });
  });

  describe("Deal Creation", () => {
    it("blocks unverified user from creating deal", async () => {
      const { ctx } = createTestContext({ verificationStatus: "unverified" });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.deal.create({
          listingId: 1,
        })
      ).rejects.toThrow("You must complete verification");
    });

    it("allows verified user to create deal", async () => {
      const { ctx } = createTestContext({
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verificationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      const caller = appRouter.createCaller(ctx);

      // Note: This will fail with "Listing not found" because we don't have a real listing
      // But it proves the verification check passed
      await expect(
        caller.deal.create({
          listingId: 999999,
        })
      ).rejects.toThrow("Listing not found");
    });
  });

  describe("Messaging", () => {
    it("blocks unverified user from sending message", async () => {
      const { ctx } = createTestContext({ verificationStatus: "unverified" });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.message.send({
          dealId: 1,
          content: "Hello, I'm interested in this listing.",
        })
      ).rejects.toThrow("You must complete verification");
    });

    it("allows verified user to send message (fails at deal lookup, not verification)", async () => {
      const { ctx } = createTestContext({
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verificationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      const caller = appRouter.createCaller(ctx);

      // Note: This will fail with "Deal not found" because we don't have a real deal
      // But it proves the verification check passed (otherwise it would fail with verification error)
      await expect(
        caller.message.send({
          dealId: 999999,
          content: "Hello, I'm interested in this listing.",
        })
      ).rejects.toThrow("Deal not found");
    });
  });

  describe("Offer Submission", () => {
    it("blocks unverified user from submitting counter-offer", async () => {
      const { ctx } = createTestContext({ verificationStatus: "unverified" });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.offerHistory.sellerCounterOffer({
          dealId: 1,
          buyerOfferId: 1,
          counterAmount: 1000000,
          reason: "Counter-offer based on valuation",
        })
      ).rejects.toThrow("You must complete verification");
    });

    it("blocks unverified user from accepting offer", async () => {
      const { ctx } = createTestContext({ verificationStatus: "unverified" });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.offerHistory.acceptOffer({
          dealId: 1,
          offerId: 1,
        })
      ).rejects.toThrow("You must complete verification");
    });

    it("blocks unverified user from rejecting offer", async () => {
      const { ctx } = createTestContext({ verificationStatus: "unverified" });
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.offerHistory.rejectOffer({
          dealId: 1,
          offerId: 1,
          reason: "Price too low",
        })
      ).rejects.toThrow("You must complete verification");
    });
  });

  describe("Verification Status Transitions", () => {
    const statuses = [
      "unverified",
      "payment_pending",
      "identity_pending",
      "funds_pending",
      "review_pending",
      "rejected",
    ] as const;

    statuses.forEach((status) => {
      it(`blocks user with status "${status}" from creating listing`, async () => {
        const { ctx } = createTestContext({ verificationStatus: status });
        const caller = appRouter.createCaller(ctx);

        await expect(
          caller.listing.create({
            businessName: "Test MSP",
            location: "Austin, TX",
            monthlyRecurringRevenue: 50000,
            annualRevenue: 600000,
            ebitda: 150000,
            clientCount: 50,
            description: "Test MSP business",
          })
        ).rejects.toThrow("You must complete verification");
      });
    });

    it("only allows verified status to create listing", async () => {
      const { ctx } = createTestContext({
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verificationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      });
      const caller = appRouter.createCaller(ctx);

      const result = await caller.listing.create({
        businessName: "Test MSP",
        location: "Austin, TX",
        monthlyRecurringRevenue: 50000,
        annualRevenue: 600000,
        ebitda: 150000,
        clientCount: 50,
        description: "Test MSP business",
      });

      expect(result.success).toBe(true);
    });
  });
});
