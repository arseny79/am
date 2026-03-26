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
    loginMethod: "email",
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

describe("Premium Tier Functionality", () => {
  it("should have premium_featured tier in price plans", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();
    const premiumPlan = plans.find((p) => p.tier === "premium_featured");

    expect(premiumPlan).toBeDefined();
    expect(premiumPlan?.name).toContain("Premium");
  });

  it("should have correct pricing for premium tier", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();
    const premiumPlan = plans.find((p) => p.tier === "premium_featured");

    expect(premiumPlan?.price).toBe(24900); // $249 in cents
    expect(premiumPlan?.successFeePercentage).toBe(300); // 3.00%
  });

  it("should have premium features enabled", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const plans = await caller.pricePlan.getActive();
    const premiumPlan = plans.find((p) => p.tier === "premium_featured");

    expect(premiumPlan?.carouselPlacement).toBe(true);
    expect(premiumPlan?.allowsThumbnail).toBe(true);
    expect(premiumPlan?.prioritySupport).toBe(true);
  });

  it("should create Stripe checkout for premium tier", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createListingFeeCheckout({
      tier: "premium",
    });

    expect(result).toHaveProperty("sessionId");
    expect(result).toHaveProperty("url");
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("should use dynamic pricing from database for Stripe checkout", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get the price from database
    const plans = await caller.pricePlan.getActive();
    const premiumPlan = plans.find((p) => p.tier === "premium_featured");

    // Create checkout
    const result = await caller.stripe.createListingFeeCheckout({
      tier: "premium",
    });

    // Verify checkout was created successfully
    expect(result.sessionId).toBeTruthy();
    
    // Verify the session uses the correct price
    const session = await caller.stripe.verifyCheckoutSession({
      sessionId: result.sessionId!,
    });

    expect(session.amountTotal).toBe(premiumPlan?.price);
  });

  it("should have thumbnailUpload router available", () => {
    expect(appRouter.thumbnailUpload).toBeDefined();
    expect(appRouter.thumbnailUpload.upload).toBeDefined();
  });
});
