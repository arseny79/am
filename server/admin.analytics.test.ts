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
  // Store original analytics values to restore after tests
  let originalGoogleAnalyticsId: string | null = null;
  let originalStatcounterId: string | null = null;
  let originalStatcounterSecurity: string | null = null;

  // Save original values before running tests
  beforeEach(async () => {
    const db = await getDb();
    if (db) {
      const existing = await db.select().from(siteSettings).limit(1);
      if (existing.length > 0) {
        originalGoogleAnalyticsId = existing[0].googleAnalyticsId;
        originalStatcounterId = existing[0].statcounterId;
        originalStatcounterSecurity = existing[0].statcounterSecurity;
      }
    }
  });

  // CRITICAL: Restore original analytics values after each test
  afterEach(async () => {
    const db = await getDb();
    if (db) {
      await db.update(siteSettings).set({
        googleAnalyticsId: originalGoogleAnalyticsId,
        statcounterId: originalStatcounterId,
        statcounterSecurity: originalStatcounterSecurity,
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
      seoTitle: "Test SEO Title",
      seoDescription: "Test SEO Description",
      heroHeadline: "Test Headline",
    });

    // Verify analytics fields are still intact
    const saved = await caller.admin.getSiteSettings();
    expect(saved.googleAnalyticsId).toBe("G-PROTECTED123");
    expect(saved.statcounterId).toBe("99999999");
    expect(saved.statcounterSecurity).toBe("protectedcode");
    // And other fields were updated
    expect(saved.seoTitle).toBe("Test SEO Title");
    expect(saved.seoDescription).toBe("Test SEO Description");
    expect(saved.heroHeadline).toBe("Test Headline");
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
    await caller.admin.updateSiteSettings({ heroHeadline: "Update 1" });
    await caller.admin.updateSiteSettings({ seoTitle: "Update 2" });
    await caller.admin.updateSiteSettings({ marketplaceHeading: "Update 3" });
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
