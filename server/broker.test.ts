import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database - factory function must not reference external variables
vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
        orderBy: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            offset: vi.fn().mockResolvedValue([]),
          }),
        }),
        limit: vi.fn().mockResolvedValue([]),
      }),
    }),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockResolvedValue({ insertId: 1 }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    }),
  }),
}));

// Mock email service
vi.mock("./lib/emailService", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createUserContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    verificationStatus: "verified",
    verificationTier: "verified",
    verifiedAt: new Date(),
    verificationExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  } as AuthenticatedUser;

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

function createAdminContext(): TrpcContext {
  return createUserContext({ role: "admin" });
}

describe("broker router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getMyApplication", () => {
    it("returns null when user has no application", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.broker.getMyApplication();
      expect(result).toBeNull();
    });
  });

  describe("getMyBrokerStatus", () => {
    it("returns isBroker: false when user is not a broker", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.broker.getMyBrokerStatus();
      expect(result).toEqual({ isBroker: false, broker: null });
    });
  });

  describe("submitApplication", () => {
    it("requires authentication", async () => {
      const ctx: TrpcContext = {
        user: null,
        req: { protocol: "https", headers: {} } as TrpcContext["req"],
        res: {} as TrpcContext["res"],
      };
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.broker.submitApplication({
          companyName: "Test Brokerage",
          contactName: "John Doe",
          contactEmail: "john@example.com",
          applicationMessage: "I want to become a broker. I have 10 years of experience in M&A.",
        })
      ).rejects.toThrow();
    });
  });

  describe("admin endpoints", () => {
    describe("listApplications", () => {
      it("requires admin role", async () => {
        const ctx = createUserContext(); // Regular user
        const caller = appRouter.createCaller(ctx);

        await expect(
          caller.broker.listApplications({ limit: 50 })
        ).rejects.toThrow("Admin access required");
      });

      it("allows admin to list applications", async () => {
        const ctx = createAdminContext();
        const caller = appRouter.createCaller(ctx);

        const result = await caller.broker.listApplications({ limit: 50 });
        expect(result).toHaveProperty("applications");
        expect(result).toHaveProperty("total");
      });
    });

    describe("listBrokers", () => {
      it("requires admin role", async () => {
        const ctx = createUserContext();
        const caller = appRouter.createCaller(ctx);

        await expect(
          caller.broker.listBrokers({ limit: 50 })
        ).rejects.toThrow("Admin access required");
      });

      it("allows admin to list brokers", async () => {
        const ctx = createAdminContext();
        const caller = appRouter.createCaller(ctx);

        const result = await caller.broker.listBrokers({ limit: 50 });
        expect(result).toHaveProperty("brokers");
        expect(result).toHaveProperty("total");
      });
    });

    describe("listPendingPayouts", () => {
      it("requires admin role", async () => {
        const ctx = createUserContext();
        const caller = appRouter.createCaller(ctx);

        await expect(
          caller.broker.listPendingPayouts()
        ).rejects.toThrow("Admin access required");
      });
    });

    describe("listCommissions", () => {
      it("requires admin role", async () => {
        const ctx = createUserContext();
        const caller = appRouter.createCaller(ctx);

        await expect(
          caller.broker.listCommissions({ limit: 50 })
        ).rejects.toThrow("Admin access required");
      });
    });
  });
});
