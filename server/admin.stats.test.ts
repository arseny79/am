import { describe, expect, it, afterEach } from "vitest";
import { appRouter } from "./routers";
import { siteSettings } from "../drizzle/schema";
import { getDb } from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
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

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("admin.updateSiteSettings - Homepage Stats", () => {
  // Clean up after each test to prevent polluting production data
  // IMPORTANT: Only clean up fields that THIS test file modifies
  // DO NOT touch analytics fields (googleAnalyticsId, statcounterId, statcounterSecurity)
  // as they are configured by the user and should never be cleared by tests
  afterEach(async () => {
    const db = await getDb();
    if (db) {
      // Reset only the fields that this test file modifies
      await db.update(siteSettings).set({
        heroHeadline: null,
        heroSubheadline: null,
        heroDescription: null,
        statGmv: null,
        statGmvLabel: null,
        statActiveListings: null,
        statActiveListingsLabel: null,
        statEscrowProtected: null,
        statEscrowProtectedLabel: null,
        // NEVER clear these - they are user-configured production settings:
        // googleAnalyticsId, statcounterId, statcounterSecurity
      });
    }
  });

  it("saves homepage stats successfully", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.admin.updateSiteSettings({
      statGmv: "$5M+",
      statGmvLabel: "Total GMV",
      statActiveListings: "15+",
      statActiveListingsLabel: "Active Listings",
      statEscrowProtected: "100% Secure Transactions",
      statEscrowProtectedLabel: "Escrow Protected",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.statGmv).toBe("$5M+");
    expect(saved.statGmvLabel).toBe("Total GMV");
    expect(saved.statActiveListings).toBe("15+");
    expect(saved.statActiveListingsLabel).toBe("Active Listings");
    expect(saved.statEscrowProtected).toBe("100% Secure Transactions");
    expect(saved.statEscrowProtectedLabel).toBe("Escrow Protected");
  });

  it("saves text descriptions as stat values", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.admin.updateSiteSettings({
      statGmv: "Seller-controlled visibility",
      statGmvLabel: "",
      statActiveListings: "Secure document sharing",
      statActiveListingsLabel: "",
      statEscrowProtected: "Escrow supported",
      statEscrowProtectedLabel: "",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.statGmv).toBe("Seller-controlled visibility");
    expect(saved.statActiveListings).toBe("Secure document sharing");
    expect(saved.statEscrowProtected).toBe("Escrow supported");
  });

  it("supports partial updates for stats fields", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Set initial values
    await caller.admin.updateSiteSettings({
      statGmv: "$2M+",
      statActiveListings: "7+",
      statEscrowProtected: "Escrow Protected",
    });

    // Update only GMV
    await caller.admin.updateSiteSettings({
      statGmv: "$10M+",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.statGmv).toBe("$10M+");
    // Other fields should remain unchanged
    expect(saved.statActiveListings).toBe("7+");
    expect(saved.statEscrowProtected).toBe("Escrow Protected");
  });

  it("allows clearing stats fields by setting to null", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Set initial values
    await caller.admin.updateSiteSettings({
      statGmv: "$5M+",
      statActiveListings: "15+",
    });

    // Clear GMV
    await caller.admin.updateSiteSettings({
      statGmv: null,
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.statGmv).toBeNull();
    expect(saved.statActiveListings).toBe("15+");
  });

  it("records which admin user updated stats settings", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.admin.updateSiteSettings({
      statGmv: "$5M+",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.updatedBy).toBe(ctx.user!.id);
  });

  it("handles stats updates independently from other settings", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Set hero content
    await caller.admin.updateSiteSettings({
      heroHeadline: "Test Headline",
      heroSubheadline: "Test Subheadline",
    });

    // Update stats without affecting hero content
    await caller.admin.updateSiteSettings({
      statGmv: "$5M+",
      statActiveListings: "15+",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.heroHeadline).toBe("Test Headline");
    expect(saved.heroSubheadline).toBe("Test Subheadline");
    expect(saved.statGmv).toBe("$5M+");
    expect(saved.statActiveListings).toBe("15+");
  });
});
