import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

/**
 * Test suite for protected page authentication flows
 * 
 * These tests verify that protected tRPC procedures properly reject
 * unauthenticated requests, ensuring the double-guard pattern on the
 * frontend is backed by server-side authorization.
 */

function createUnauthenticatedContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createAuthenticatedContext(): { ctx: TrpcContext; user: AuthenticatedUser } {
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx, user };
}

describe("Protected Pages - Authentication Flow", () => {
  describe("Profile Page (user.updateProfile)", () => {
    it("rejects unauthenticated requests with login error", async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.user.updateProfile({
          companyName: "Test Company",
        })
      ).rejects.toThrow("Please login");
    });

    it("accepts authenticated requests", async () => {
      const { ctx } = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.user.updateProfile({
        companyName: "Test Company",
      });
      
      expect(result).toEqual({ success: true });
    });
  });

  describe("MyListings Page (listing.getMy)", () => {
    it("rejects unauthenticated requests with login error", async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.listing.getMy()).rejects.toThrow("Please login");
    });

    it("accepts authenticated requests and returns array", async () => {
      const { ctx } = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.listing.getMy();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("MyListings Page (listing.update)", () => {
    it("rejects unauthenticated update requests", async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.listing.update({
          id: 1,
          isPublished: true,
        })
      ).rejects.toThrow("Please login");
    });
  });

  describe("MyListings Page (listing.delete)", () => {
    it("rejects unauthenticated delete requests", async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.listing.delete({
          id: 1,
        })
      ).rejects.toThrow("Please login");
    });
  });

  describe("SavedListings Page (savedListings.getMySavedListings)", () => {
    it("rejects unauthenticated requests with login error", async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.savedListings.getMySavedListings()).rejects.toThrow(
        "Please login"
      );
    });

    it("accepts authenticated requests and returns array", async () => {
      const { ctx } = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.savedListings.getMySavedListings();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("SavedListings Page (savedListings.unsave)", () => {
    it("rejects unauthenticated unsave requests", async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.savedListings.unsave({
          listingId: 1,
        })
      ).rejects.toThrow("Please login");
    });
  });

  describe("MyDeals Page (deal.getMyDeals)", () => {
    it("rejects unauthenticated requests with login error", async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.deal.getMyDeals()).rejects.toThrow("Please login");
    });

    it("accepts authenticated requests and returns array", async () => {
      const { ctx } = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.deal.getMyDeals();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("Public Procedures - Should NOT require authentication", () => {
    it("auth.me allows unauthenticated requests", async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.me();
      expect(result).toBeNull();
    });

    it("auth.logout allows unauthenticated requests", async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();
      expect(result).toEqual({ success: true });
    });
  });
});
