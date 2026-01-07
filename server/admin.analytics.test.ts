import { describe, expect, it, afterEach } from "vitest";
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

describe("admin.updateSiteSettings", () => {
  // Clean up after each test to prevent polluting production data
  afterEach(async () => {
    const db = await getDb();
    if (db) {
      // Reset all test-modified fields to null
      await db.update(siteSettings).set({
        googleAnalyticsId: null,
        statcounterId: null,
        statcounterSecurity: null,
      });
    }
  });

  it("creates new settings when none exist", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Clear existing settings first
    const db = await getDb();
    if (db) {
      await db.delete(siteSettings);
    }

    const result = await caller.admin.updateSiteSettings({
      googleAnalyticsId: "G-TEST123456",
      statcounterId: "12345678",
      statcounterSecurity: "abcd1234",
    });

    expect(result.success).toBeTruthy();

    // Verify settings were saved
    const saved = await caller.admin.getSiteSettings();
    expect(saved.googleAnalyticsId).toBe("G-TEST123456");
    expect(saved.statcounterId).toBe("12345678");
    expect(saved.statcounterSecurity).toBe("abcd1234");
  });

  it("updates existing settings", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create initial settings
    await caller.admin.updateSiteSettings({
      googleAnalyticsId: "G-INITIAL",
      statcounterId: "11111111",
      statcounterSecurity: "init1234",
    });

    // Update settings
    const result = await caller.admin.updateSiteSettings({
      googleAnalyticsId: "G-UPDATED",
      statcounterId: "99999999",
      statcounterSecurity: "updt5678",
    });

    expect(result.success).toBeTruthy();

    // Verify settings were updated
    const saved = await caller.admin.getSiteSettings();
    expect(saved.googleAnalyticsId).toBe("G-UPDATED");
    expect(saved.statcounterId).toBe("99999999");
    expect(saved.statcounterSecurity).toBe("updt5678");
  });

  it("allows partial updates", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create initial settings
    await caller.admin.updateSiteSettings({
      googleAnalyticsId: "G-INITIAL",
      statcounterId: "11111111",
      statcounterSecurity: "init1234",
    });

    // Update only Google Analytics
    await caller.admin.updateSiteSettings({
      googleAnalyticsId: "G-PARTIAL",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.googleAnalyticsId).toBe("G-PARTIAL");
    // Other fields should remain unchanged
    expect(saved.statcounterId).toBe("11111111");
    expect(saved.statcounterSecurity).toBe("init1234");
  });

  it("allows clearing analytics IDs by setting to null", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Create initial settings
    await caller.admin.updateSiteSettings({
      googleAnalyticsId: "G-TEST",
      statcounterId: "12345678",
      statcounterSecurity: "abcd1234",
    });

    // Clear Google Analytics
    await caller.admin.updateSiteSettings({
      googleAnalyticsId: null,
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.googleAnalyticsId).toBeNull();
    expect(saved.statcounterId).toBe("12345678");
  });

  it("records which admin user made the update", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.admin.updateSiteSettings({
      googleAnalyticsId: "G-TEST",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.updatedBy).toBe(ctx.user!.id);
  });
});
