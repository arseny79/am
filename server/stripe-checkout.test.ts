import { describe, it, expect, vi, beforeEach } from "vitest";
import type { inferProcedureInput } from "@trpc/server";
import { appRouter, type AppRouter } from "./routers";
import type { TrpcContext } from "./_core/trpc";

// Mock Stripe
vi.mock("stripe", () => {
  const MockStripe = vi.fn(() => ({
    checkout: {
      sessions: {
        create: vi.fn(async (params: any) => ({
          id: "cs_test_123",
          url: "https://checkout.stripe.com/test",
          customer: params.customer || "cus_test_123",
          metadata: params.metadata,
          mode: params.mode,
          line_items: params.line_items,
        })),
      },
    },
    customers: {
      create: vi.fn(async (params: any) => ({
        id: "cus_test_123",
        email: params.email,
        metadata: params.metadata,
      })),
      list: vi.fn(async (params: any) => ({
        data: [],
      })),
    },
  }));
  
  return { default: MockStripe };
});

describe("Stripe Checkout Integration", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let mockCtx: TrpcContext;

  beforeEach(() => {
    mockCtx = {
      user: {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        openId: "test-open-id",
        role: "user",
        kycVerified: 1,
        verificationStatus: "verified",
        verificationTier: "verified",
        stripeIdentityVerified: 1,
        createdAt: "2024-01-01 00:00:00",
      },
      req: {
        headers: {
          origin: "https://msp.investments",
        },
      } as any,
      res: {} as any,
    };

    caller = appRouter.createCaller(mockCtx);
  });

  describe("createCheckoutSession", () => {
    it("should create checkout session for featured plan", async () => {
      const input: inferProcedureInput<AppRouter["stripeListingUpgrade"]["createCheckoutSession"]> = {
        productId: "featured_weekly",
      };

      const result = await caller.stripeListingUpgrade.createCheckoutSession(input);

      expect(result).toHaveProperty("url");
      expect(result.url).toContain("checkout.stripe.com");
    });

    it("should create checkout session for premium plan", async () => {
      const input: inferProcedureInput<AppRouter["stripeListingUpgrade"]["createCheckoutSession"]> = {
        productId: "premium_weekly",
      };

      const result = await caller.stripeListingUpgrade.createCheckoutSession(input);

      expect(result).toHaveProperty("url");
      expect(result.url).toContain("checkout.stripe.com");
    });

    it("should throw error for invalid product ID", async () => {
      const input: inferProcedureInput<AppRouter["stripeListingUpgrade"]["createCheckoutSession"]> = {
        productId: "invalid_product" as any,
      };

      await expect(caller.stripeListingUpgrade.createCheckoutSession(input)).rejects.toThrow();
    });

    it("should include user metadata in checkout session", async () => {
      const input: inferProcedureInput<AppRouter["stripeListingUpgrade"]["createCheckoutSession"]> = {
        productId: "featured_weekly",
      };

      const result = await caller.stripeListingUpgrade.createCheckoutSession(input);

      expect(result).toBeDefined();
      expect(result.url).toBeTruthy();
    });

    it("should set correct success and cancel URLs", async () => {
      const input: inferProcedureInput<AppRouter["stripeListingUpgrade"]["createCheckoutSession"]> = {
        productId: "premium_weekly",
      };

      const result = await caller.stripeListingUpgrade.createCheckoutSession(input);

      expect(result.url).toBeDefined();
    });
  });
});
