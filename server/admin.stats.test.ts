import { describe, expect, it } from "vitest";
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
  it("saves homepage stats successfully", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.admin.updateSiteSettings({
      statGmv: "$5M+",
      statActiveListings: "15+",
      statEscrowProtected: "100% Secure Transactions",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.statGmv).toBe("$5M+");
    expect(saved.statActiveListings).toBe("15+");
    expect(saved.statEscrowProtected).toBe("100% Secure Transactions");
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
