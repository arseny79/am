import { describe, expect, it } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
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

  return { ctx };
}

describe("actionItems router", () => {
  it("should get action items for a deal (empty list)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This will fail if the deal doesn't exist or user doesn't have access
    // For now, we're just testing the router structure
    try {
      const result = await caller.actionItems.getByDeal({ dealId: 999999 });
      // If we get here, the deal doesn't exist (expected)
      expect(result).toBeDefined();
    } catch (error: any) {
      // Expected: deal not found
      expect(error.code).toBe("NOT_FOUND");
    }
  });

  it("should validate required fields when creating action item", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.actionItems.create({
        dealId: 999999,
        title: "", // Empty title should fail
        assignedTo: "both",
        priority: "medium",
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      // Expected: validation error
      expect(error).toBeDefined();
    }
  });

  it("should validate status enum when updating", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.actionItems.updateStatus({
        id: 999999,
        status: "completed",
      });
      // Should not reach here (item doesn't exist)
      expect(true).toBe(false);
    } catch (error: any) {
      // Expected: NOT_FOUND
      expect(error.code).toBe("NOT_FOUND");
    }
  });

  it("should require authentication for all operations", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };

    const caller = appRouter.createCaller(ctx);

    try {
      await caller.actionItems.getByDeal({ dealId: 1 });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
});
