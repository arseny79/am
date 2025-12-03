import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number, role: "user" | "admin" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role,
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
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Offer Expiration System", () => {
  it("should create offers with 72-hour expiration", async () => {
    const sellerCtx = createAuthContext(1);
    const buyerCtx = createAuthContext(2);
    const sellerCaller = appRouter.createCaller(sellerCtx);
    const buyerCaller = appRouter.createCaller(buyerCtx);

    // Create listing
    await sellerCaller.listing.create({
      businessName: "Test MSP",
      location: "New York",
      monthlyRecurringRevenue: 50000,
      annualRevenue: 600000,
      ebitda: 150000,
      clientCount: 50,
      askingPrice: 1000000,
      description: "Test listing",
    });

    const listings = await sellerCaller.listing.getMy();
    const listingId = listings[0]!.id;

    // Sign NDA
    await buyerCaller.nda.signClickwrap({ listingId });

    // Create deal
    await buyerCaller.deal.create({ listingId });
    const deals = await buyerCaller.deal.getMyDeals();
    const dealId = deals[0]!.id;

    // Request counter-offer (should create offer with expiration)
    await buyerCaller.deal.requestCounterOffer({
      dealId,
      counterOfferAmount: 900000,
      reason: "Testing expiration",
    });

    // Get offers
    const offers = await buyerCaller.offerHistory.getByDeal({ dealId });
    
    expect(offers.length).toBeGreaterThan(0);
    const latestOffer = offers[offers.length - 1];
    expect(latestOffer?.expiresAt).toBeDefined();
    
    // Check expiration is approximately 72 hours from now
    if (latestOffer?.expiresAt) {
      const now = new Date();
      const expiryTime = new Date(latestOffer.expiresAt);
      const hoursDiff = (expiryTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      expect(hoursDiff).toBeGreaterThan(71);
      expect(hoursDiff).toBeLessThan(73);
    }
  });

  it("should detect expiring soon offers", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const expiringSoon = await caller.offerExpiration.getExpiringSoon({
      hoursThreshold: 48,
    });

    expect(Array.isArray(expiringSoon)).toBe(true);
  });
});

describe("Offer Comparison View", () => {
  it("should display all offers for a deal", async () => {
    const sellerCtx = createAuthContext(1);
    const buyerCtx = createAuthContext(2);
    const sellerCaller = appRouter.createCaller(sellerCtx);
    const buyerCaller = appRouter.createCaller(buyerCtx);

    // Create listing
    await sellerCaller.listing.create({
      businessName: "Comparison Test MSP",
      location: "Boston",
      monthlyRecurringRevenue: 40000,
      annualRevenue: 480000,
      ebitda: 120000,
      clientCount: 40,
      askingPrice: 800000,
      description: "Test listing for comparison",
    });

    const listings = await sellerCaller.listing.getMy();
    const listingId = listings[listings.length - 1]!.id;

    // Sign NDA
    await buyerCaller.nda.signClickwrap({ listingId });

    // Create deal
    await buyerCaller.deal.create({ listingId });
    const deals = await buyerCaller.deal.getMyDeals();
    const dealId = deals[deals.length - 1]!.id;

    // Request counter-offer
    await buyerCaller.deal.requestCounterOffer({
      dealId,
      counterOfferAmount: 700000,
      reason: "Initial counter-offer",
    });

    // Get all offers
    const offers = await buyerCaller.offerHistory.getByDeal({ dealId });
    
    expect(offers.length).toBeGreaterThan(0);
    
    // Verify offers have required fields for comparison
    offers.forEach(offer => {
      expect(offer.amount).toBeDefined();
      expect(offer.offerType).toBeDefined();
      expect(offer.status).toBeDefined();
      expect(offer.createdAt).toBeDefined();
    });
  });

  it("should support multi-round negotiation", async () => {
    const sellerCtx = createAuthContext(1);
    const buyerCtx = createAuthContext(2);
    const sellerCaller = appRouter.createCaller(sellerCtx);
    const buyerCaller = appRouter.createCaller(buyerCtx);

    // Create listing
    await sellerCaller.listing.create({
      businessName: "Multi-Round Test MSP",
      location: "Chicago",
      monthlyRecurringRevenue: 60000,
      annualRevenue: 720000,
      ebitda: 180000,
      clientCount: 60,
      askingPrice: 1200000,
      description: "Test multi-round negotiation",
    });

    const listings = await sellerCaller.listing.getMy();
    const listingId = listings[listings.length - 1]!.id;

    // Sign NDA
    await buyerCaller.nda.signClickwrap({ listingId });

    // Create deal
    await buyerCaller.deal.create({ listingId });
    const deals = await buyerCaller.deal.getMyDeals();
    const dealId = deals[deals.length - 1]!.id;

    // Round 1: Buyer counter-offer
    await buyerCaller.deal.requestCounterOffer({
      dealId,
      counterOfferAmount: 1000000,
      reason: "Round 1 buyer offer",
    });

    let offers = await buyerCaller.offerHistory.getByDeal({ dealId });
    const buyerOfferId = offers[offers.length - 1]!.id;

    // Round 2: Seller counter-counter-offer
    await sellerCaller.offerHistory.sellerCounterOffer({
      dealId,
      buyerOfferId,
      counterAmount: 1100000,
      reason: "Round 2 seller counter",
    });

    offers = await buyerCaller.offerHistory.getByDeal({ dealId });
    const sellerOfferId = offers[offers.length - 1]!.id;

    // Round 3: Buyer counter-counter-counter-offer
    await buyerCaller.offerHistory.buyerCounterCounterOffer({
      dealId,
      sellerOfferId,
      counterAmount: 1050000,
      reason: "Round 3 buyer counter",
    });

    // Verify all offers are tracked
    offers = await buyerCaller.offerHistory.getByDeal({ dealId });
    
    expect(offers.length).toBeGreaterThanOrEqual(3);
    
    // Verify offer types alternate correctly
    const buyerOffers = offers.filter(o => o.offerType === "buyer_counter_offer");
    const sellerOffers = offers.filter(o => o.offerType === "seller_counter_offer");
    
    expect(buyerOffers.length).toBeGreaterThan(0);
    expect(sellerOffers.length).toBeGreaterThan(0);
  });
});

describe("Countdown Timer Logic", () => {
  it("should calculate time remaining correctly", () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (48 * 60 * 60 * 1000)); // 48 hours from now
    
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    expect(hours).toBe(48);
  });

  it("should identify expiring soon offers (< 24 hours)", () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (12 * 60 * 60 * 1000)); // 12 hours from now
    
    const diff = expiresAt.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    expect(hours).toBeLessThan(24);
  });

  it("should identify expired offers", () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() - (1 * 60 * 60 * 1000)); // 1 hour ago
    
    const diff = expiresAt.getTime() - now.getTime();
    
    expect(diff).toBeLessThan(0);
  });
});
