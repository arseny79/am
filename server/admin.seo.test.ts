import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("admin.siteSettings - SEO metadata", () => {
  it("returns default empty values for SEO fields when no settings exist", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const settings = await caller.admin.getSiteSettings();

    expect(settings.seoTitle).toBeNull();
    expect(settings.seoDescription).toBeNull();
    expect(settings.ogTitle).toBeNull();
    expect(settings.ogDescription).toBeNull();
    expect(settings.ogImage).toBeNull();
  });

  it("saves SEO metadata successfully", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.admin.updateSiteSettings({
      seoTitle: "MSP M&A Marketplace - Buy & Sell MSP Businesses",
      seoDescription: "Discover MSP businesses for sale. Connect with serious buyers and sellers.",
      ogTitle: "Buy or Sell Your MSP Business with Confidence",
      ogDescription: "The simplest way to connect with serious buyers and sellers.",
      ogImage: "https://example.com/og-image.png",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.seoTitle).toBe("MSP M&A Marketplace - Buy & Sell MSP Businesses");
    expect(saved.seoDescription).toBe("Discover MSP businesses for sale. Connect with serious buyers and sellers.");
    expect(saved.ogTitle).toBe("Buy or Sell Your MSP Business with Confidence");
    expect(saved.ogDescription).toBe("The simplest way to connect with serious buyers and sellers.");
    expect(saved.ogImage).toBe("https://example.com/og-image.png");
  });

  it("supports partial updates for SEO fields", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Set initial values
    await caller.admin.updateSiteSettings({
      seoTitle: "Initial Title",
      seoDescription: "Initial Description",
      ogTitle: "Initial OG Title",
    });

    // Update only seoTitle
    await caller.admin.updateSiteSettings({
      seoTitle: "Updated Title",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.seoTitle).toBe("Updated Title");
    // Other fields should remain unchanged
    expect(saved.seoDescription).toBe("Initial Description");
    expect(saved.ogTitle).toBe("Initial OG Title");
  });

  it("allows clearing SEO fields by setting to null", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Set initial values
    await caller.admin.updateSiteSettings({
      seoTitle: "Test Title",
      ogImage: "https://example.com/image.png",
    });

    // Clear seoTitle
    await caller.admin.updateSiteSettings({
      seoTitle: null,
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.seoTitle).toBeNull();
    expect(saved.ogImage).toBe("https://example.com/image.png");
  });

  it("handles long SEO content correctly", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const longTitle = "A".repeat(200); // Max length for varchar(200)
    const longDescription = "B".repeat(500); // Text field, no limit

    await caller.admin.updateSiteSettings({
      seoTitle: longTitle,
      seoDescription: longDescription,
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.seoTitle).toBe(longTitle);
    expect(saved.seoDescription).toBe(longDescription);
  });

  it("records which admin user updated SEO settings", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await caller.admin.updateSiteSettings({
      seoTitle: "Test Title",
    });

    const saved = await caller.admin.getSiteSettings();
    expect(saved.updatedBy).toBe(ctx.user!.id);
  });
});
