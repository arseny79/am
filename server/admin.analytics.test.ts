import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { siteSettings } from "../drizzle/schema";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const adminUser: AuthenticatedUser = {
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
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("admin.getSiteSettings", () => {
  it("returns site settings or default empty values", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getSiteSettings();

    expect(result).toBeDefined();
    expect(result).toHaveProperty("googleAnalyticsId");
    expect(result).toHaveProperty("statcounterId");
    expect(result).toHaveProperty("statcounterSecurity");
  });
});

// Tests for the dedicated updateAnalyticsSettings procedure
// This procedure is the ONLY way to modify analytics fields
describe("admin.updateAnalyticsSettings - Protected Analytics Fields", () => {
  // Store original values to restore after tests
  // CRITICAL: Save ALL settings that tests might modify, including SEO fields
  let originalSettings: {
    googleAnalyticsId: string | null;
    statcounterId: string | null;
    statcounterSecurity: string | null;
    heroHeadline: string | null;
    heroSubheadline: string | null;
    heroDescription: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    marketplaceHeading: string | null;
    marketplaceSubheading: string | null;
    statGmv: string | null;
    statGmvLabel: string | null;
    statActiveListings: string | null;
    statActiveListingsLabel: string | null;
    statEscrowProtected: string | null;
    statEscrowProtectedLabel: string | null;
    valuationToolHeading: string | null;
    valuationToolSubheading: string | null;
    buyAssetHeading: string | null;
    buyAssetSubheading: string | null;
    valuationDataSources: string | null;
    valuationDisclaimer: string | null;
    heroPrimaryButtonText: string | null;
    heroPrimaryButtonUrl: string | null;
    heroSecondaryButtonText: string | null;
    heroSecondaryButtonUrl: string | null;
    logoUrl: string | null;
  } | null = null;

  // Save original values before running tests
  beforeEach(async () => {
    const db = await getDb();
    if (db) {
      const existing = await db.select().from(siteSettings).limit(1);
      if (existing.length > 0) {
        originalSettings = {
          googleAnalyticsId: existing[0].googleAnalyticsId,
          statcounterId: existing[0].statcounterId,
          statcounterSecurity: existing[0].statcounterSecurity,
          heroHeadline: existing[0].heroHeadline,
          heroSubheadline: existing[0].heroSubheadline,
          heroDescription: existing[0].heroDescription,
          seoTitle: existing[0].seoTitle,
          seoDescription: existing[0].seoDescription,
          ogTitle: existing[0].ogTitle,
          ogDescription: existing[0].ogDescription,
          ogImage: existing[0].ogImage,
          marketplaceHeading: existing[0].marketplaceHeading,
          marketplaceSubheading: existing[0].marketplaceSubheading,
          statGmv: existing[0].statGmv,
          statGmvLabel: existing[0].statGmvLabel,
          statActiveListings: existing[0].statActiveListings,
          statActiveListingsLabel: existing[0].statActiveListingsLabel,
          statEscrowProtected: existing[0].statEscrowProtected,
          statEscrowProtectedLabel: existing[0].statEscrowProtectedLabel,
          valuationToolHeading: existing[0].valuationToolHeading,
          valuationToolSubheading: existing[0].valuationToolSubheading,
          buyAssetHeading: existing[0].buyAssetHeading,
          buyAssetSubheading: existing[0].buyAssetSubheading,
          valuationDataSources: existing[0].valuationDataSources,
          valuationDisclaimer: existing[0].valuationDisclaimer,
          heroPrimaryButtonText: existing[0].heroPrimaryButtonText,
          heroPrimaryButtonUrl: existing[0].heroPrimaryButtonUrl,
          heroSecondaryButtonText: existing[0].heroSecondaryButtonText,
          heroSecondaryButtonUrl: existing[0].heroSecondaryButtonUrl,
          logoUrl: existing[0].logoUrl,
        };
      }
    }
  });

  // CRITICAL: Restore ALL original values after each test
  // This prevents test pollution of production data
  afterEach(async () => {
    const db = await getDb();
    if (db && originalSettings) {
      await db.update(siteSettings).set({
        googleAnalyticsId: originalSettings.googleAnalyticsId,
        statcounterId: originalSettings.statcounterId,
        statcounterSecurity: originalSettings.statcounterSecurity,
        heroHeadline: originalSettings.heroHeadline,
        heroSubheadline: originalSettings.heroSubheadline,
        heroDescription: originalSettings.heroDescription,
        seoTitle: originalSettings.seoTitle,
        seoDescription: originalSettings.seoDescription,
        ogTitle: originalSettings.ogTitle,
        ogDescription: originalSettings.ogDescription,
        ogImage: originalSettings.ogImage,
        marketplaceHeading: originalSettings.marketplaceHeading,
        marketplaceSubheading: originalSettings.marketplaceSubheading,
        statGmv: originalSettings.statGmv,
        statGmvLabel: originalSettings.statGmvLabel,
        statActiveListings: originalSettings.statActiveListings,
        statActiveListingsLabel: originalSettings.statActiveListingsLabel,
        statEscrowProtected: originalSettings.statEscrowProtected,
        statEscrowProtectedLabel: originalSettings.statEscrowProtectedLabel,
        valuationToolHeading: originalSettings.valuationToolHeading,
        valuationToolSubheading: originalSettings.valuationToolSubheading,
        buyAssetHeading: originalSettings.buyAssetHeading,
        buyAssetSubheading: originalSettings.buyAssetSubheading,
        valuationDataSources: originalSettings.valuationDataSources,
        valuationDisclaimer: originalSettings.valuationDisclaimer,
        heroPrimaryButtonText: originalSettings.heroPrimaryButtonText,
        heroPrimaryButtonUrl: originalSettings.heroPrimaryButtonUrl,
        heroSecondaryButtonText: originalSettings.heroSecondaryButtonText,
        heroSecondaryButtonUrl: originalSettings.heroSecondaryButtonUrl,
        logoUrl: originalSettings.logoUrl,
      });
    }
  });

  it("updateAnalyticsSettings saves analytics configuration correctly", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.updateAnalyticsSettings({
      googleAnalyticsId: "G-TEST123456",
      statcounterId: "12345678",
      statcounterSecurity: "abcd1234",
    });

    expect(result.success).toBeTruthy();

    const saved = await caller.admin.getSiteSettings();
    expect(saved.googleAnalyticsId).toBe("G-TEST123456");
    expect(saved.statcounterId).toBe("12345678");
    expect(saved.statcounterSecurity).toBe("abcd1234");
  });

  it("updateSiteSettings does NOT modify analytics fields", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // First set analytics via the dedicated procedure
    await caller.admin.updateAnalyticsSettings({
      googleAnalyticsId: "G-PROTECTED123",
      statcounterId: "99999999",
      statcounterSecurity: "protectedcode",
    });

    // Now update other site settings - this should NOT affect analytics
    await caller.admin.updateSiteSettings({
      heroHeadline: "Test Headline",
    });

    // Verify analytics fields are still intact
    const saved = await caller.admin.getSiteSettings();
    expect(saved.googleAnalyticsId).toBe("G-PROTECTED123");
    expect(saved.statcounterId).toBe("99999999");
    expect(saved.statcounterSecurity).toBe("protectedcode");
  });

  it("updateAnalyticsSettings supports partial updates", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Set all analytics fields
    await caller.admin.updateAnalyticsSettings({
      googleAnalyticsId: "G-PARTIAL1",
      statcounterId: "11111111",
      statcounterSecurity: "partial1",
    });

    // Update only Google Analytics
    await caller.admin.updateAnalyticsSettings({
      googleAnalyticsId: "G-PARTIAL2",
    });

    // Verify only GA was updated, others remain
    const saved = await caller.admin.getSiteSettings();
    expect(saved.googleAnalyticsId).toBe("G-PARTIAL2");
    expect(saved.statcounterId).toBe("11111111");
    expect(saved.statcounterSecurity).toBe("partial1");
  });

  it("updateAnalyticsSettings allows explicit clearing with null", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Set analytics
    await caller.admin.updateAnalyticsSettings({
      googleAnalyticsId: "G-TOCLEAR",
      statcounterId: "77777777",
      statcounterSecurity: "toclear",
    });

    // Explicitly clear Google Analytics only
    await caller.admin.updateAnalyticsSettings({
      googleAnalyticsId: null,
    });

    // Verify only GA was cleared
    const saved = await caller.admin.getSiteSettings();
    expect(saved.googleAnalyticsId).toBeNull();
    expect(saved.statcounterId).toBe("77777777");
    expect(saved.statcounterSecurity).toBe("toclear");
  });

  it("multiple updateSiteSettings calls do not affect analytics", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Set analytics
    await caller.admin.updateAnalyticsSettings({
      googleAnalyticsId: "G-MULTITEST",
      statcounterId: "66666666",
      statcounterSecurity: "multitest",
    });

    // Simulate multiple different site settings updates
    // NOTE: These values will be restored by afterEach hook
    await caller.admin.updateSiteSettings({ heroHeadline: "Test Update 1" });
    await caller.admin.updateSiteSettings({ marketplaceHeading: "Test Update 3" });
    await caller.admin.updateSiteSettings({ 
      statGmv: "$1M+",
      statActiveListings: "10+",
    });

    // Verify analytics are still intact after all updates
    const saved = await caller.admin.getSiteSettings();
    expect(saved.googleAnalyticsId).toBe("G-MULTITEST");
    expect(saved.statcounterId).toBe("66666666");
    expect(saved.statcounterSecurity).toBe("multitest");
  });

  it("records which admin user made the analytics update", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.admin.updateAnalyticsSettings({
      googleAnalyticsId: "G-TEST",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.updatedBy).toBe(ctx.user!.id);
  });
});
