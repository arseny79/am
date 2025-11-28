import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "seller@example.com",
    name: "Test Seller",
    loginMethod: "manus",
    role: "user",
    companyName: "Test MSP Inc",
    companyWebsite: null,
    phoneNumber: null,
    location: "New York, NY",
    bio: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {
        origin: "https://test.example.com",
      },
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Stripe Checkout Integration", () => {
  it("creates checkout session for standard tier", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createListingFeeCheckout({
      tier: "standard",
    });

    expect(result).toHaveProperty("sessionId");
    expect(result).toHaveProperty("url");
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("creates checkout session for featured tier", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createListingFeeCheckout({
      tier: "featured",
    });

    expect(result).toHaveProperty("sessionId");
    expect(result).toHaveProperty("url");
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("creates checkout session for premium tier", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createListingFeeCheckout({
      tier: "premium",
    });

    expect(result).toHaveProperty("sessionId");
    expect(result).toHaveProperty("url");
    expect(result.url).toContain("checkout.stripe.com");
  });

  it("includes user email in checkout session", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripe.createListingFeeCheckout({
      tier: "featured",
    });

    // Verify session was created successfully
    expect(result.sessionId).toBeTruthy();
    
    // Verify checkout session
    const session = await caller.stripe.verifyCheckoutSession({
      sessionId: result.sessionId!,
    });

    expect(session.customerEmail).toBe("seller@example.com");
    expect(session.tier).toBe("featured");
  });
});
