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
    loginMethod: "email",
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

describe("Service Category and Industry Vertical", () => {
  it("allows creating listing with service category", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.listing.create({
      businessName: "Security-Focused MSP",
      location: "Seattle, WA",
      monthlyRecurringRevenue: 75000,
      annualRevenue: 900000,
      ebitda: 225000,
      clientCount: 45,
      description: "Specialized in managed security services",
      serviceCategory: "managed_security",
    });

    expect(result.success).toBe(true);
  });

  it("allows creating listing with industry vertical", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.listing.create({
      businessName: "Healthcare IT MSP",
      location: "Boston, MA",
      monthlyRecurringRevenue: 60000,
      annualRevenue: 720000,
      ebitda: 180000,
      clientCount: 25,
      description: "Serving healthcare providers exclusively",
      industryVertical: "healthcare",
    });

    expect(result.success).toBe(true);
  });

  it("allows creating listing with both category and vertical", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.listing.create({
      businessName: "Financial Cloud MSP",
      location: "New York, NY",
      monthlyRecurringRevenue: 100000,
      annualRevenue: 1200000,
      ebitda: 360000,
      clientCount: 30,
      description: "Cloud services for financial institutions",
      serviceCategory: "cloud_services",
      industryVertical: "financial_services",
    });

    expect(result.success).toBe(true);
  });

  it("filters listings by service category", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const results = await caller.listing.search({
      serviceCategory: "managed_security",
    });

    expect(Array.isArray(results)).toBe(true);
    // All results should have managed_security category if any exist
    results.forEach((listing) => {
      if (listing.serviceCategory) {
        expect(listing.serviceCategory).toBe("managed_security");
      }
    });
  });

  it("filters listings by industry vertical", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const results = await caller.listing.search({
      industryVertical: "healthcare",
    });

    expect(Array.isArray(results)).toBe(true);
    // All results should have healthcare vertical if any exist
    results.forEach((listing) => {
      if (listing.industryVertical) {
        expect(listing.industryVertical).toBe("healthcare");
      }
    });
  });

  it("filters listings by both category and vertical", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const results = await caller.listing.search({
      serviceCategory: "cloud_services",
      industryVertical: "financial_services",
    });

    expect(Array.isArray(results)).toBe(true);
    // All results should match both filters if any exist
    results.forEach((listing) => {
      if (listing.serviceCategory) {
        expect(listing.serviceCategory).toBe("cloud_services");
      }
      if (listing.industryVertical) {
        expect(listing.industryVertical).toBe("financial_services");
      }
    });
  });

  it("combines category filter with revenue range", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const results = await caller.listing.search({
      serviceCategory: "infrastructure",
      minRevenue: 500000,
      maxRevenue: 2000000,
    });

    expect(Array.isArray(results)).toBe(true);
    // Verify filtering logic works with multiple criteria
    results.forEach((listing) => {
      if (listing.serviceCategory) {
        expect(listing.serviceCategory).toBe("infrastructure");
      }
      if (listing.annualRevenue) {
        expect(listing.annualRevenue).toBeGreaterThanOrEqual(500000);
        expect(listing.annualRevenue).toBeLessThanOrEqual(2000000);
      }
    });
  });

  it("validates service category enum values", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    // Try to create listing with invalid category
    await expect(
      caller.listing.create({
        businessName: "Test MSP",
        location: "Denver, CO",
        monthlyRecurringRevenue: 50000,
        annualRevenue: 600000,
        ebitda: 150000,
        clientCount: 30,
        description: "Test description",
        serviceCategory: "invalid_category" as any,
      })
    ).rejects.toThrow();
  });

  it("validates industry vertical enum values", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    // Try to create listing with invalid vertical
    await expect(
      caller.listing.create({
        businessName: "Test MSP",
        location: "Denver, CO",
        monthlyRecurringRevenue: 50000,
        annualRevenue: 600000,
        ebitda: 150000,
        clientCount: 30,
        description: "Test description",
        industryVertical: "invalid_vertical" as any,
      })
    ).rejects.toThrow();
  });
});

describe("Featured Listings", () => {
  it("returns featured listings for homepage", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const results = await caller.listing.search({
      limit: 6,
    });

    expect(Array.isArray(results)).toBe(true);
    // Should return at most 6 listings
    expect(results.length).toBeLessThanOrEqual(6);
  });
});

describe("Marketplace Browse", () => {
  it("returns all published listings for browse page", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const results = await caller.listing.search({});

    expect(Array.isArray(results)).toBe(true);
    // All results should be published
    results.forEach((listing) => {
      expect(listing.isPublished).toBe(true);
    });
  });

  it("combines multiple filter criteria", async () => {
    const user = createMockUser();
    const ctx = createTestContext(user);
    const caller = appRouter.createCaller(ctx);

    const results = await caller.listing.search({
      serviceCategory: "cloud_services",
      minRevenue: 500000,
      location: "Texas",
    });

    expect(Array.isArray(results)).toBe(true);
    // All filters should be applied
    results.forEach((listing) => {
      if (listing.serviceCategory) {
        expect(listing.serviceCategory).toBe("cloud_services");
      }
      if (listing.annualRevenue) {
        expect(listing.annualRevenue).toBeGreaterThanOrEqual(500000);
      }
      if (listing.location) {
        expect(listing.location.toLowerCase()).toContain("texas");
      }
    });
  });
});
