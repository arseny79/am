import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
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

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUserContext(userId: number = 2): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Affiliate Tier Router", () => {
  describe("affiliateTier.getAll", () => {
    it("returns active tiers for public users", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([
          { id: 1, level: 1, name: "Standard", commissionPercent: "25.00", isActive: true },
        ]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.affiliateTier.getAll();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Standard");
      expect(result[0].commissionPercent).toBe("25.00");
    });
  });

  describe("affiliateTier.getAllAdmin", () => {
    it("returns all tiers including inactive for admin", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([
          { id: 1, level: 1, name: "Standard", commissionPercent: "25.00", isActive: true },
          { id: 2, level: 2, name: "Silver", commissionPercent: "30.00", isActive: false },
        ]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.affiliateTier.getAllAdmin();

      expect(result).toHaveLength(2);
    });

    it("throws UNAUTHORIZED for non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.affiliateTier.getAllAdmin()).rejects.toThrow();
    });
  });

  describe("affiliateTier.create", () => {
    it("creates a new tier for admin", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // No existing tier
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([{ insertId: 2 }]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.affiliateTier.create({
        level: 2,
        name: "Silver",
        commissionPercent: 30,
        minReferrals: 5,
        minEarnings: 10000,
      });

      expect(result.id).toBe(2);
      expect(result.name).toBe("Silver");
    });

    it("throws CONFLICT if tier level already exists", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1, level: 1 }]), // Existing tier
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.affiliateTier.create({
          level: 1,
          name: "Duplicate",
          commissionPercent: 25,
        })
      ).rejects.toThrow("Tier level 1 already exists");
    });
  });
});

describe("Affiliate Router", () => {
  describe("affiliate.applyForProgram", () => {
    it("creates affiliate application for authenticated user", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn()
          .mockResolvedValueOnce([]) // No existing affiliate
          .mockResolvedValueOnce([{ id: 1, level: 1, isActive: true }]) // Default tier
          .mockResolvedValueOnce([]), // No existing referral code
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
        and: vi.fn().mockReturnThis(),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.affiliate.applyForProgram({
        paypalEmail: "test@paypal.com",
      });

      expect(result.status).toBe("pending");
      expect(result.referralCode).toBeDefined();
      expect(result.referralCode.length).toBe(12); // 6 bytes = 12 hex chars
    });

    it("throws CONFLICT if user already has affiliate account", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1, userId: 2 }]), // Existing affiliate
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.affiliate.applyForProgram({})
      ).rejects.toThrow("You already have an affiliate account");
    });
  });

  describe("affiliate.getMyStatus", () => {
    it("returns null for user without affiliate account", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.affiliate.getMyStatus();

      expect(result).toBeNull();
    });

    it("returns affiliate status for existing affiliate", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: 1,
          referralCode: "ABC123DEF456",
          status: "active",
          totalReferrals: 5,
          successfulReferrals: 2,
          totalEarnings: 50000,
          pendingEarnings: 10000,
          paidEarnings: 40000,
          tierName: "Standard",
          tierLevel: 1,
          commissionPercent: "25.00",
        }]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.affiliate.getMyStatus();

      expect(result).not.toBeNull();
      expect(result?.status).toBe("active");
      expect(result?.referralCode).toBe("ABC123DEF456");
      expect(result?.totalEarnings).toBe(50000);
    });
  });

  describe("affiliate.approve", () => {
    it("approves pending affiliate for admin", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1, status: "pending" }]),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.affiliate.approve({ affiliateId: 1 });

      expect(result.success).toBe(true);
    });

    it("throws BAD_REQUEST if affiliate already active", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1, status: "active" }]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.affiliate.approve({ affiliateId: 1 })
      ).rejects.toThrow("Affiliate is already active");
    });
  });
});

describe("Referral Router", () => {
  describe("referral.validateCode", () => {
    it("returns valid for active affiliate code", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{
          id: 1,
          referralCode: "ABC123",
          status: "active",
          userName: "John Doe",
        }]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.referral.validateCode({ code: "ABC123" });

      expect(result.valid).toBe(true);
      expect(result.affiliateName).toBe("John Doe");
    });

    it("returns invalid for non-existent code", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        leftJoin: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.referral.validateCode({ code: "INVALID" });

      expect(result.valid).toBe(false);
    });
  });

  describe("referral.trackReferral", () => {
    it("creates referral record for valid code", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn()
          .mockResolvedValueOnce([{ id: 1, status: "active" }]) // Active affiliate
          .mockResolvedValueOnce([]), // No existing referral
        insert: vi.fn().mockReturnThis(),
        values: vi.fn().mockResolvedValue([{ insertId: 1 }]),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.referral.trackReferral({
        referralCode: "ABC123",
        referredUserId: 5,
      });

      expect(result.success).toBe(true);
    });

    it("returns failure for invalid referral code", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]), // No affiliate found
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.referral.trackReferral({
        referralCode: "INVALID",
        referredUserId: 5,
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe("Invalid referral code");
    });
  });
});

describe("Commission Router", () => {
  describe("commission.getAllCommissions", () => {
    it("returns commissions for admin", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockResolvedValue([
          {
            id: 1,
            affiliateId: 1,
            dealId: 10,
            dealAmount: 100000000,
            platformFee: 3000000,
            commissionPercent: "25.00",
            commissionAmount: 750000,
            status: "pending",
          },
        ]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.commission.getAllCommissions();

      expect(result).toHaveLength(1);
      expect(result[0].commissionAmount).toBe(750000);
    });
  });

  describe("commission.approveCommission", () => {
    it("approves pending commission for admin", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1, status: "pending" }]),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.commission.approveCommission({ commissionId: 1 });

      expect(result.success).toBe(true);
    });

    it("throws BAD_REQUEST for non-pending commission", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1, status: "approved" }]),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.commission.approveCommission({ commissionId: 1 })
      ).rejects.toThrow("Commission is not pending");
    });
  });

  describe("commission.markPaid", () => {
    it("marks approved commission as paid", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ 
          id: 1, 
          status: "approved",
          affiliateId: 1,
          commissionAmount: 750000,
        }]),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.commission.markPaid({
        commissionId: 1,
        paymentReference: "PAYPAL-123456",
      });

      expect(result.success).toBe(true);
    });

    it("throws BAD_REQUEST for non-approved commission", async () => {
      const { getDb } = await import("./db");
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([{ id: 1, status: "pending" }]),
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue({}),
          }),
        }),
      };
      vi.mocked(getDb).mockResolvedValue(mockDb as any);

      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.commission.markPaid({
          commissionId: 1,
          paymentReference: "PAYPAL-123456",
        })
      ).rejects.toThrow("Commission must be approved before marking as paid");
    });
  });
});
