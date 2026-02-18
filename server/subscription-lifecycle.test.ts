import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/trpc";
import * as db from "./db";

// Mock database
vi.mock("./db");

// Mock Stripe
vi.mock("stripe", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      subscriptions: {
        retrieve: vi.fn(),
        update: vi.fn(),
      },
      billingPortal: {
        sessions: {
          create: vi.fn(),
        },
      },
    })),
  };
});

describe("Subscription Lifecycle", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let mockContext: TrpcContext;

  beforeEach(() => {
    vi.clearAllMocks();

    mockContext = {
      user: {
        id: 1,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        kycVerified: 1,
        emailVerified: 1,
        verificationStatus: "verified",
        createdAt: new Date().toISOString(),
      },
      req: {} as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(mockContext);
  });

  describe("getActive", () => {
    it("should return active subscriptions for user", async () => {
      const mockSubs = [
        {
          id: 1,
          userId: 1,
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: "sub_123",
          productId: "featured_weekly",
          status: "active",
          currentPeriodEnd: "2026-03-01 00:00:00",
          cancelAtPeriodEnd: 0,
          createdAt: "2026-02-01 00:00:00",
        },
      ];

      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockSubs),
      } as any);

      const result = await caller.subscription.getActive();

      expect(result).toEqual(mockSubs);
    });

    it("should return empty array when user has no active subscriptions", async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
      } as any);

      const result = await caller.subscription.getActive();

      expect(result).toEqual([]);
    });
  });

  describe("getAll", () => {
    it("should return all subscriptions for user", async () => {
      const mockSubs = [
        {
          id: 1,
          userId: 1,
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: "sub_123",
          productId: "featured_weekly",
          status: "active",
          currentPeriodEnd: "2026-03-01 00:00:00",
          cancelAtPeriodEnd: 0,
          createdAt: "2026-02-01 00:00:00",
        },
        {
          id: 2,
          userId: 1,
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: "sub_456",
          productId: "premium_weekly",
          status: "canceled",
          currentPeriodEnd: "2026-01-15 00:00:00",
          cancelAtPeriodEnd: 0,
          createdAt: "2026-01-01 00:00:00",
        },
      ];

      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue(mockSubs),
      } as any);

      const result = await caller.subscription.getAll();

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockSubs);
    });
  });

  describe("cancel", () => {
    it("should cancel subscription at period end", async () => {
      const mockSub = {
        id: 1,
        userId: 1,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        productId: "featured_weekly",
        status: "active",
        currentPeriodEnd: "2026-03-01 00:00:00",
        cancelAtPeriodEnd: 0,
        createdAt: "2026-02-01 00:00:00",
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockSub]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockSub]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await caller.subscription.cancel({ subscriptionId: 1 });

      expect(result).toEqual({ success: true });
    });

    it("should throw error when subscription not found", async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      await expect(
        caller.subscription.cancel({ subscriptionId: 999 })
      ).rejects.toThrow("Subscription not found");
    });

    it("should throw error when subscription belongs to different user", async () => {
      const mockSub = {
        id: 1,
        userId: 2, // Different user
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        productId: "featured_weekly",
        status: "active",
        currentPeriodEnd: "2026-03-01 00:00:00",
        cancelAtPeriodEnd: 0,
        createdAt: "2026-02-01 00:00:00",
      };

      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      await expect(
        caller.subscription.cancel({ subscriptionId: 1 })
      ).rejects.toThrow("Subscription not found");
    });
  });

  describe("reactivate", () => {
    it("should reactivate a canceled subscription", async () => {
      const mockSub = {
        id: 1,
        userId: 1,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        productId: "featured_weekly",
        status: "active",
        currentPeriodEnd: "2026-03-01 00:00:00",
        cancelAtPeriodEnd: 1,
        createdAt: "2026-02-01 00:00:00",
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockSub]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockSub]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await caller.subscription.reactivate({ subscriptionId: 1 });

      expect(result).toEqual({ success: true });
    });
  });

  describe("createPortalSession", () => {
    it("should create Stripe customer portal session", async () => {
      const mockSub = {
        id: 1,
        userId: 1,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        productId: "featured_weekly",
        status: "active",
        currentPeriodEnd: "2026-03-01 00:00:00",
        cancelAtPeriodEnd: 0,
        createdAt: "2026-02-01 00:00:00",
      };

      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockSub]),
        limit: vi.fn().mockResolvedValue([mockSub]),
      } as any);

      const result = await caller.subscription.createPortalSession();

      expect(result).toHaveProperty("url");
    });

    it("should throw error when user has no subscriptions", async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      await expect(caller.subscription.createPortalSession()).rejects.toThrow(
        "No subscriptions found"
      );
    });
  });

  describe("upgrade", () => {
    it("should upgrade subscription to different tier", async () => {
      const mockSub = {
        id: 1,
        userId: 1,
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        productId: "featured_weekly",
        status: "active",
        currentPeriodEnd: "2026-03-01 00:00:00",
        cancelAtPeriodEnd: 0,
        createdAt: "2026-02-01 00:00:00",
      };

      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([mockSub]),
        update: vi.fn().mockReturnThis(),
        set: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockSub]),
      };

      vi.mocked(db.getDb).mockResolvedValue(mockDb as any);

      const result = await caller.subscription.upgrade({
        subscriptionId: 1,
        newProductId: "premium_weekly",
      });

      expect(result).toEqual({ success: true });
    });

    it("should throw error when subscription not found", async () => {
      vi.mocked(db.getDb).mockResolvedValue({
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([]),
        limit: vi.fn().mockResolvedValue([]),
      } as any);

      await expect(
        caller.subscription.upgrade({
          subscriptionId: 999,
          newProductId: "premium_weekly",
        })
      ).rejects.toThrow("Subscription not found");
    });
  });
});
