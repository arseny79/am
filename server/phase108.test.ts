import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Phase 108: Public Visitor Bug Fixes", () => {
  describe("Browse Listings - Public Access", () => {
    it("should allow unauthenticated users to search listings", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // This should NOT throw an error for unauthenticated users
      const listings = await caller.listing.search({});
      
      expect(Array.isArray(listings)).toBe(true);
      // Listings array can be empty or have items
    });

    it("should allow filtering listings by revenue", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const listings = await caller.listing.search({
        minRevenue: 100000,
        maxRevenue: 1000000,
      });
      
      expect(Array.isArray(listings)).toBe(true);
    });

    it("should allow filtering listings by location", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const listings = await caller.listing.search({
        location: "Boston",
      });
      
      expect(Array.isArray(listings)).toBe(true);
    });
  });

  describe("Site Logo - Public Access", () => {
    it("should allow unauthenticated users to get site settings", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // This should NOT throw an error for unauthenticated users
      const settings = await caller.admin.getSiteSettings();
      
      expect(settings).toBeDefined();
      expect(settings).toHaveProperty("id");
      // logoUrl may be null if not set
    });

    it("should return site settings with logo URL if configured", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const settings = await caller.admin.getSiteSettings();
      
      // Settings should have logoUrl property (even if null)
      expect(settings).toHaveProperty("logoUrl");
    });
  });

  describe("Premium Listings Carousel", () => {
    it("should allow unauthenticated users to get random premium listing", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // This should NOT throw an error for unauthenticated users
      const premiumListing = await caller.listing.getRandomPremium();
      
      // Result can be null if no premium listings exist
      // But should not throw an error
      expect(premiumListing === null || typeof premiumListing === "object").toBe(true);
    });

    it("should return premium listing or null based on database state", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const premiumListing = await caller.listing.getRandomPremium();
      
      // Can be null (no premium listings) or an object (premium listing exists)
      // Both are valid states
      if (premiumListing) {
        expect(premiumListing).toHaveProperty("id");
        expect(premiumListing).toHaveProperty("businessName");
      } else {
        expect(premiumListing).toBeNull();
      }
    });
  });

  describe("Integration: Public Homepage Access", () => {
    it("should allow complete homepage data fetch without authentication", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Simulate homepage loading all required data
      const [listings, settings, premiumListing] = await Promise.all([
        caller.listing.search({}),
        caller.admin.getSiteSettings(),
        caller.listing.getRandomPremium(),
      ]);

      expect(Array.isArray(listings)).toBe(true);
      expect(settings).toBeDefined();
      expect(premiumListing === null || typeof premiumListing === "object").toBe(true);
    });
  });
});
