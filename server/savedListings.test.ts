import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { savedListings, listings } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("savedListings", () => {
  // Helper to clean up saved listings for a user
  async function cleanupSavedListings(userId: number, listingId: number) {
    const db = await getDb();
    if (db) {
      await db
        .delete(savedListings)
        .where(
          and(
            eq(savedListings.userId, userId),
            eq(savedListings.listingId, listingId)
          )
        );
    }
  }

  it("should save a listing", async () => {
    await cleanupSavedListings(1, 1);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.savedListings.save({ listingId: 1 });

    expect(result).toEqual({ success: true });

    // Verify in database
    const db = await getDb();
    if (db) {
      const saved = await db
        .select()
        .from(savedListings)
        .where(
          and(
            eq(savedListings.userId, 1),
            eq(savedListings.listingId, 1)
          )
        );
      expect(saved.length).toBeGreaterThan(0);
    }
  });

  it("should check if listing is saved", async () => {
    await cleanupSavedListings(1, 1);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Save first
    await caller.savedListings.save({ listingId: 1 });

    // Check
    const isSaved = await caller.savedListings.isSaved({ listingId: 1 });
    expect(isSaved).toBe(true);

    // Check unsaved listing
    const isNotSaved = await caller.savedListings.isSaved({ listingId: 999 });
    expect(isNotSaved).toBe(false);
  });

  it("should unsave a listing", async () => {
    await cleanupSavedListings(1, 1);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Save first
    await caller.savedListings.save({ listingId: 1 });

    // Unsave
    const result = await caller.savedListings.unsave({ listingId: 1 });
    expect(result).toEqual({ success: true });

    // Verify
    const isSaved = await caller.savedListings.isSaved({ listingId: 1 });
    expect(isSaved).toBe(false);
  });

  it("should get user's saved listings", async () => {
    await cleanupSavedListings(1, 1);
    await cleanupSavedListings(1, 2);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Save multiple listings
    await caller.savedListings.save({ listingId: 1 });
    await caller.savedListings.save({ listingId: 2 });

    // Get saved listings
    const saved = await caller.savedListings.getMySavedListings();

    expect(Array.isArray(saved)).toBe(true);
    expect(saved.length).toBeGreaterThanOrEqual(2);
    
    // Check that savedAt timestamp is included
    if (saved.length > 0) {
      expect(saved[0]).toHaveProperty("savedAt");
      expect(saved[0]).toHaveProperty("id");
      expect(saved[0]).toHaveProperty("businessName");
    }
  });

  it("should get save count for a listing", async () => {
    await cleanupSavedListings(1, 1);
    await cleanupSavedListings(2, 1);
    const ctx1 = createAuthContext(1);
    const ctx2 = createAuthContext(2);
    const caller1 = appRouter.createCaller(ctx1);
    const caller2 = appRouter.createCaller(ctx2);

    // Two users save the same listing
    await caller1.savedListings.save({ listingId: 1 });
    await caller2.savedListings.save({ listingId: 1 });

    // Get count
    const count = await caller1.savedListings.getSaveCount({ listingId: 1 });
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it("should not allow saving same listing twice", async () => {
    await cleanupSavedListings(1, 1);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    // Save first time
    await caller.savedListings.save({ listingId: 1 });

    // Try to save again - should throw error
    await expect(
      caller.savedListings.save({ listingId: 1 })
    ).rejects.toThrow();
  });
});
