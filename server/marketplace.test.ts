import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user?: AuthenticatedUser): TrpcContext {
  const ctx: TrpcContext = {
    user: user || null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return ctx;
}

function createMockUser(id: number = 1, role: "user" | "admin" = "user"): AuthenticatedUser {
  return {
    id,
    openId: `test-user-${id}`,
    email: `test${id}@example.com`,
    name: `Test User ${id}`,
    loginMethod: "manus",
    role,
    companyName: null,
    companyWebsite: null,
    phoneNumber: null,
    location: null,
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
}

describe("Valuation Calculator", () => {
  it("calculates MSP valuation with base metrics", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.valuation.calculate({
      annualRevenue: 1000000,
      ebitda: 250000,
      clientCount: 50,
    });

    expect(result.estimatedValuation).toBeGreaterThan(0);
    expect(result.multiple).toBeGreaterThan(0);
    expect(result.ebitdaMargin).toBe(25);
    expect(result.methodology).toBe("EBITDA Multiple Method");
  });

  it("adjusts multiple for high EBITDA margin", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.valuation.calculate({
      annualRevenue: 1000000,
      ebitda: 300000, // 30% margin
      clientCount: 50,
    });

    expect(result.ebitdaMargin).toBe(30);
    expect(result.multiple).toBeGreaterThan(40); // Should be > 4.0x
  });

  it("adjusts multiple for high retention rate", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.valuation.calculate({
      annualRevenue: 1000000,
      ebitda: 250000,
      clientCount: 50,
      clientRetentionRate: 96,
    });

    expect(result.factors.retentionAdjustment).toBe("+0.3");
  });

  it("adjusts multiple for high growth rate", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.valuation.calculate({
      annualRevenue: 1000000,
      ebitda: 250000,
      clientCount: 50,
      growthRate: 25,
    });

    expect(result.factors.growthAdjustment).toBe("+0.5");
  });
});

describe("User Profile Management", () => {
  it("allows authenticated user to update profile", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.user.updateProfile({
      userType: "seller",
      companyName: "Test MSP Inc",
      location: "New York, NY",
    });

    expect(result.success).toBe(true);
  });

  it("prevents unauthenticated access to profile update", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.user.updateProfile({
        userType: "seller",
      })
    ).rejects.toThrow();
  });
});

describe("Listing Management", () => {
  it("allows authenticated user to create listing", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.listing.create({
      businessName: "Test MSP",
      location: "Austin, TX",
      monthlyRecurringRevenue: 50000,
      annualRevenue: 600000,
      ebitda: 150000,
      clientCount: 30,
      description: "A well-established MSP serving small businesses",
    });

    expect(result.success).toBe(true);
  });

  it("prevents unauthenticated users from creating listings", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.listing.create({
        businessName: "Test MSP",
        location: "Austin, TX",
        monthlyRecurringRevenue: 50000,
        annualRevenue: 600000,
        ebitda: 150000,
        clientCount: 30,
        description: "Test description",
      })
    ).rejects.toThrow();
  });

  it("allows sellers to update their own listings", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    // Note: This test assumes listing ID 1 exists and belongs to user
    // In a real test, you'd create the listing first
    const result = await caller.listing.update({
      id: 1,
      businessName: "Updated MSP Name",
    });

    // This will fail if listing doesn't exist or doesn't belong to user
    // That's expected behavior - the test validates authorization
    expect(result).toBeDefined();
  });
});

describe("NDA Workflow", () => {
  it("allows buyers to sign NDA for listings", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.nda.sign({
      listingId: 1,
      ipAddress: "192.168.1.1",
    });

    expect(result.success).toBe(true);
  });

  it("prevents duplicate NDA signatures", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    // First signature
    await caller.nda.sign({
      listingId: 1,
      ipAddress: "192.168.1.1",
    });

    // Second signature attempt
    const result = await caller.nda.sign({
      listingId: 1,
      ipAddress: "192.168.1.1",
    });

    expect(result.alreadySigned).toBe(true);
  });

  it("requires authentication to sign NDA", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.nda.sign({
        listingId: 1,
      })
    ).rejects.toThrow();
  });
});

describe("Search and Discovery", () => {
  it("allows searching listings with filters", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const results = await caller.listing.search({
      minRevenue: 500000,
      maxRevenue: 2000000,
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it("filters by EBITDA range", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const results = await caller.listing.search({
      minEbitda: 100000,
      maxEbitda: 500000,
    });

    expect(Array.isArray(results)).toBe(true);
  });

  it("filters by location", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const results = await caller.listing.search({
      location: "Texas",
    });

    expect(Array.isArray(results)).toBe(true);
  });
});

describe("Authentication", () => {
  it("returns user info for authenticated requests", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toEqual(user);
  });

  it("returns null for unauthenticated requests", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();

    expect(result).toBeNull();
  });
});
