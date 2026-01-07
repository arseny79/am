import { describe, expect, it, beforeEach, afterEach } from "vitest";
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
  // CRITICAL: Store original values to restore after tests
  // This prevents test pollution of production data
  let originalSettings: {
    heroHeadline: string | null;
    heroSubheadline: string | null;
    heroDescription: string | null;
    statGmv: string | null;
    statGmvLabel: string | null;
    statActiveListings: string | null;
    statActiveListingsLabel: string | null;
    statEscrowProtected: string | null;
    statEscrowProtectedLabel: string | null;
  } | null = null;

  // Save original values before running tests
  beforeEach(async () => {
    const db = await getDb();
    if (db) {
      const existing = await db.select().from(siteSettings).limit(1);
      if (existing.length > 0) {
        originalSettings = {
          heroHeadline: existing[0].heroHeadline,
          heroSubheadline: existing[0].heroSubheadline,
          heroDescription: existing[0].heroDescription,
          statGmv: existing[0].statGmv,
          statGmvLabel: existing[0].statGmvLabel,
          statActiveListings: existing[0].statActiveListings,
          statActiveListingsLabel: existing[0].statActiveListingsLabel,
          statEscrowProtected: existing[0].statEscrowProtected,
          statEscrowProtectedLabel: existing[0].statEscrowProtectedLabel,
        };
      }
    }
  });

  // CRITICAL: Restore original values after each test
  // This prevents test pollution of production data
  afterEach(async () => {
    const db = await getDb();
    if (db && originalSettings) {
      await db.update(siteSettings).set({
        heroHeadline: originalSettings.heroHeadline,
        heroSubheadline: originalSettings.heroSubheadline,
        heroDescription: originalSettings.heroDescription,
        statGmv: originalSettings.statGmv,
        statGmvLabel: originalSettings.statGmvLabel,
        statActiveListings: originalSettings.statActiveListings,
        statActiveListingsLabel: originalSettings.statActiveListingsLabel,
        statEscrowProtected: originalSettings.statEscrowProtected,
        statEscrowProtectedLabel: originalSettings.statEscrowProtectedLabel,
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
