import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    tosAcceptedAt: new Date(),
    privacyPolicyAcceptedAt: new Date(),
    verificationStatus: "unverified",
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

describe("Dynamic Pricing Page", () => {
  it("should have pricePlan.getActive procedure", () => {
    expect(appRouter.pricePlan).toBeDefined();
    expect(appRouter.pricePlan.getActive).toBeDefined();
  });

  it("should return active price plans", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();

    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBeGreaterThan(0);
  });

  it("should return plans with correct structure", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();

    plans.forEach((plan) => {
      expect(plan).toHaveProperty("id");
      expect(plan).toHaveProperty("tier");
      expect(plan).toHaveProperty("name");
      expect(plan).toHaveProperty("price");
      expect(plan).toHaveProperty("successFeePercentage");
      expect(plan).toHaveProperty("features");
      expect(plan).toHaveProperty("carouselPlacement");
      expect(plan).toHaveProperty("allowsThumbnail");
      expect(plan).toHaveProperty("prioritySupport");
    });
  });

  it("should have all three tiers (free, featured, premium_featured)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();

    const tiers = plans.map((p) => p.tier);
    expect(tiers).toContain("free");
    expect(tiers).toContain("featured");
    expect(tiers).toContain("premium_featured");
  });

  it("should have correct pricing for each tier", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();

    const freePlan = plans.find((p) => p.tier === "free");
    const featuredPlan = plans.find((p) => p.tier === "featured");
    const premiumPlan = plans.find((p) => p.tier === "premium_featured");

    expect(freePlan?.price).toBe(0);
    expect(featuredPlan?.price).toBe(9900); // $99 in cents
    expect(premiumPlan?.price).toBe(24900); // $249 in cents
  });

  it("should have 3% success fee for all tiers", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();

    plans.forEach((plan) => {
      expect(plan.successFeePercentage).toBe(300); // 3.00% in basis points
    });
  });

  it("should have correct feature flags for each tier", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();

    const freePlan = plans.find((p) => p.tier === "free");
    const featuredPlan = plans.find((p) => p.tier === "featured");
    const premiumPlan = plans.find((p) => p.tier === "premium_featured");

    // Free tier should have no premium features
    expect(freePlan?.carouselPlacement).toBe(false);
    expect(freePlan?.allowsThumbnail).toBe(false);
    expect(freePlan?.prioritySupport).toBe(false);

    // Featured tier should have carousel placement
    expect(featuredPlan?.carouselPlacement).toBe(true);
    expect(featuredPlan?.allowsThumbnail).toBe(false);
    expect(featuredPlan?.prioritySupport).toBe(false);

    // Premium tier should have all features
    expect(premiumPlan?.carouselPlacement).toBe(true);
    expect(premiumPlan?.allowsThumbnail).toBe(true);
    expect(premiumPlan?.prioritySupport).toBe(true);
  });

  it("should only return active plans", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();

    plans.forEach((plan) => {
      expect(plan.isActive).toBe(true);
    });
  });

  it("should calculate success fee correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();
    const salePrice = 500000;

    plans.forEach((plan) => {
      const successFee = salePrice * (plan.successFeePercentage / 10000);
      expect(successFee).toBe(15000); // 3% of $500,000
    });
  });

  it("should calculate total fees correctly for each tier", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();
    const salePrice = 500000;

    const freePlan = plans.find((p) => p.tier === "free");
    const featuredPlan = plans.find((p) => p.tier === "featured");
    const premiumPlan = plans.find((p) => p.tier === "premium_featured");

    // Free tier: only success fee
    const freeSuccessFee = salePrice * (freePlan!.successFeePercentage / 10000);
    expect(freeSuccessFee).toBe(15000);

    // Featured tier: success fee + weekly listing fee
    const featuredSuccessFee = salePrice * (featuredPlan!.successFeePercentage / 10000);
    const featuredWeeklyFee = featuredPlan!.price / 100; // Convert cents to dollars
    expect(featuredSuccessFee).toBe(15000);
    expect(featuredWeeklyFee).toBe(99);

    // Premium tier: success fee + weekly listing fee
    const premiumSuccessFee = salePrice * (premiumPlan!.successFeePercentage / 10000);
    const premiumWeeklyFee = premiumPlan!.price / 100; // Convert cents to dollars
    expect(premiumSuccessFee).toBe(15000);
    expect(premiumWeeklyFee).toBe(249);
  });
});
