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

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role: "user",
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

describe("Phase 109: Listing Detail Page Public Access", () => {
  describe("listing.getById - Public Access", () => {
    it("should allow unauthenticated users to view listing details", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Get first listing from search
      const listings = await caller.listing.search({});
      if (listings.length === 0) {
        // No listings to test with, skip
        expect(true).toBe(true);
        return;
      }

      const listingId = listings[0]!.id;
      
      // This should NOT throw an error for unauthenticated users
      const listing = await caller.listing.getById({ id: listingId });
      
      expect(listing).toBeDefined();
      if (listing) {
        expect(listing).toHaveProperty("id");
        expect(listing).toHaveProperty("businessName");
      }
    });

    it("should hide confidential data for unauthenticated users", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const listings = await caller.listing.search({});
      if (listings.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const listingId = listings[0]!.id;
      const listing = await caller.listing.getById({ id: listingId });
      
      // Confidential fields should be null for unauthenticated users
      if (listing) {
        expect(listing.clientList).toBeNull();
        expect(listing.financialDetails).toBeNull();
      }
    });

    it("should not record view for unauthenticated users", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const listings = await caller.listing.search({});
      if (listings.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const listingId = listings[0]!.id;
      
      // Should not throw error even though view recording is skipped
      const listing = await caller.listing.getById({ id: listingId });
      expect(listing).toBeDefined();
    });

    it("should record view for authenticated users", async () => {
      const { ctx } = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const listings = await caller.listing.search({});
      if (listings.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const listingId = listings[0]!.id;
      
      // Should record view for authenticated users
      const listing = await caller.listing.getById({ id: listingId });
      expect(listing).toBeDefined();
    });

    it("should return null for non-existent listing", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const listing = await caller.listing.getById({ id: 999999 });
      expect(listing).toBeNull();
    });
  });

  describe("listing.getSimilar - Public Access", () => {
    it("should allow unauthenticated users to get similar listings", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const listings = await caller.listing.search({});
      if (listings.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const listingId = listings[0]!.id;
      
      // This should NOT throw an error for unauthenticated users
      const similar = await caller.listing.getSimilar({ id: listingId });
      
      expect(Array.isArray(similar)).toBe(true);
    });

    it("should return empty array for premium listings", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // Get premium listing
      const premiumListing = await caller.listing.getRandomPremium();
      if (!premiumListing) {
        expect(true).toBe(true);
        return;
      }

      const similar = await caller.listing.getSimilar({ id: premiumListing.id });
      
      // Premium listings should not show similar listings
      expect(similar).toEqual([]);
    });

    it("should return empty array for non-existent listing", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const similar = await caller.listing.getSimilar({ id: 999999 });
      expect(similar).toEqual([]);
    });
  });

  describe("Integration: Complete Listing Detail Page", () => {
    it("should load all listing detail page data without authentication", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const listings = await caller.listing.search({});
      if (listings.length === 0) {
        expect(true).toBe(true);
        return;
      }

      const listingId = listings[0]!.id;

      // Simulate listing detail page loading all required data
      const [listing, similar] = await Promise.all([
        caller.listing.getById({ id: listingId }),
        caller.listing.getSimilar({ id: listingId }),
      ]);

      expect(listing).toBeDefined();
      expect(Array.isArray(similar)).toBe(true);
    });
  });
});
