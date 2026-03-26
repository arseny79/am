import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "email",
    role,
    verificationStatus: "verified",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: { origin: "https://test.example.com" },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Listing Creation with Payment Flow", () => {
  it("creates standard (free) listing and publishes immediately", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.listing.create({
      businessName: "Test MSP Standard",
      location: "New York, USA",
      monthlyRecurringRevenue: 10000,
      annualRevenue: 120000,
      ebitda: 50000,
      clientCount: 50,
      description: "Test MSP for standard tier",
      confidentialityLevel: "public",
      isAnonymous: false,
      listingTier: "standard",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeTypeOf("number");

    // Verify listing is published immediately for standard tier
    const listing = await db.getListingById(result.id);
    expect(listing).toBeDefined();
    expect(listing?.status).toBe("active");
    expect(listing?.isPublished).toBe(true);
    expect(listing?.paymentStatus).toBe("paid");
  });

  it("creates featured listing in draft mode pending payment", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.listing.create({
      businessName: "Test MSP Featured",
      location: "San Francisco, USA",
      monthlyRecurringRevenue: 20000,
      annualRevenue: 240000,
      ebitda: 100000,
      clientCount: 100,
      description: "Test MSP for featured tier",
      confidentialityLevel: "public",
      isAnonymous: false,
      listingTier: "featured",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeTypeOf("number");

    // Verify listing is in draft mode pending payment
    const listing = await db.getListingById(result.id);
    expect(listing).toBeDefined();
    expect(listing?.status).toBe("draft");
    expect(listing?.isPublished).toBe(false);
    expect(listing?.paymentStatus).toBe("pending");
  });

  it("creates premium listing in draft mode pending payment", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.listing.create({
      businessName: "Test MSP Premium",
      location: "Austin, USA",
      monthlyRecurringRevenue: 50000,
      annualRevenue: 600000,
      ebitda: 250000,
      clientCount: 200,
      description: "Test MSP for premium tier",
      confidentialityLevel: "public",
      isAnonymous: false,
      listingTier: "premium",
    });

    expect(result.success).toBe(true);
    expect(result.id).toBeTypeOf("number");

    // Verify listing is in draft mode pending payment
    const listing = await db.getListingById(result.id);
    expect(listing).toBeDefined();
    expect(listing?.status).toBe("draft");
    expect(listing?.isPublished).toBe(false);
    expect(listing?.paymentStatus).toBe("pending");
  });

  it("creates Stripe checkout with listing_id for paid tiers", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a listing
    const listingResult = await caller.listing.create({
      businessName: "Test MSP for Checkout",
      location: "Boston, USA",
      monthlyRecurringRevenue: 15000,
      annualRevenue: 180000,
      ebitda: 75000,
      clientCount: 75,
      description: "Test MSP for checkout flow",
      confidentialityLevel: "public",
      isAnonymous: false,
      listingTier: "featured",
    });

    expect(listingResult.success).toBe(true);
    expect(listingResult.id).toBeTypeOf("number");

    // Now create checkout session with listing_id
    const checkoutResult = await caller.stripe.createListingFeeCheckout({
      tier: "featured",
      listingId: listingResult.id,
    });

    expect(checkoutResult.sessionId).toBeDefined();
    expect(checkoutResult.url).toBeDefined();
    expect(checkoutResult.url).toContain("checkout.stripe.com");
  });
});
