import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
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

function createUserContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
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

describe("pricePlan router", () => {
  describe("getActive", () => {
    it("should return active price plans", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const plans = await caller.pricePlan.getActive();

      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);
      
      // All returned plans should be active (MySQL tinyint: 1 is truthy)
      plans.forEach((plan) => {
        expect(plan.isActive).toBeTruthy();
      });
    });
  });

  describe("getAll", () => {
    it("should return all price plans including inactive", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const plans = await caller.pricePlan.getAll();

      expect(Array.isArray(plans)).toBe(true);
      expect(plans.length).toBeGreaterThan(0);
      
      // Should include the seeded plans
      const planTiers = plans.map((p) => p.tier);
      expect(planTiers).toContain("free");
      expect(planTiers).toContain("featured");
      expect(planTiers).toContain("premium_featured");
    });
  });

  describe("getByTier", () => {
    it("should return specific plan by tier", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const plan = await caller.pricePlan.getByTier({ tier: "featured" });

      expect(plan).toBeDefined();
      expect(plan.tier).toBe("featured");
      expect(plan.name).toBe("Featured");
      expect(plan.price).toBe(9900); // $99 in cents
    });

    it("should return premium plan with correct features", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const plan = await caller.pricePlan.getByTier({ tier: "premium_featured" });

      expect(plan).toBeDefined();
      expect(plan.tier).toBe("premium_featured");
      // MySQL tinyint fields return 1 (truthy) not boolean true
      expect(plan.allowsThumbnail).toBeTruthy();
      expect(plan.carouselPlacement).toBeTruthy();
      expect(plan.prioritySupport).toBeTruthy();
    });
  });

  describe("update", () => {
    it("should allow admin to update plan", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Get a plan first
      const plan = await caller.pricePlan.getByTier({ tier: "free" });

      // Update it
      const result = await caller.pricePlan.update({
        id: plan.id,
        description: "Updated description for testing",
      });

      expect(result.success).toBe(true);

      // Verify the update
      const updatedPlan = await caller.pricePlan.getByTier({ tier: "free" });
      expect(updatedPlan.description).toBe("Updated description for testing");
    });

    it("should reject non-admin user", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.pricePlan.update({
          id: 1,
          description: "Unauthorized update",
        })
      // adminProcedure throws with NOT_ADMIN_ERR_MSG from shared/const
      ).rejects.toThrow();
    });
  });

  describe("toggleActive", () => {
    it("should allow admin to toggle plan active status", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      // Get a plan
      const plan = await caller.pricePlan.getByTier({ tier: "free" });
      const originalStatus = plan.isActive;

      // Toggle it
      const result = await caller.pricePlan.toggleActive({ id: plan.id });

      expect(result.success).toBe(true);
      expect(result.isActive).toBe(!originalStatus);

      // Toggle back
      await caller.pricePlan.toggleActive({ id: plan.id });
    });

    it("should reject non-admin user", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.pricePlan.toggleActive({ id: 1 })
      // adminProcedure throws with NOT_ADMIN_ERR_MSG from shared/const
      ).rejects.toThrow();
    });
  });
});
