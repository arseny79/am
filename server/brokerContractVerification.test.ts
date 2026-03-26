import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "email",
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
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createNonAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "email",
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
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("broker.listPendingContracts", () => {
  it("returns empty array when no pending contracts exist (admin)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.broker.listPendingContracts();
    
    // Should return an array (empty if no contracts)
    expect(Array.isArray(result)).toBe(true);
  });

  it("throws FORBIDDEN error for non-admin users", async () => {
    const ctx = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.broker.listPendingContracts()).rejects.toThrow("Admin access required");
  });
});

describe("broker.verifyContract", () => {
  it("throws FORBIDDEN error for non-admin users", async () => {
    const ctx = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.broker.verifyContract({
        contractId: 1,
        action: "approve",
      })
    ).rejects.toThrow("Admin access required");
  });

  it("throws NOT_FOUND error for non-existent contract (admin)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.broker.verifyContract({
        contractId: 999999,
        action: "approve",
      })
    ).rejects.toThrow("Contract not found");
  });
});

describe("broker.getContractsByBroker", () => {
  it("throws FORBIDDEN error for non-admin users", async () => {
    const ctx = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.broker.getContractsByBroker({ brokerId: 1 })
    ).rejects.toThrow("Admin access required");
  });

  it("returns empty array for non-existent broker (admin)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.broker.getContractsByBroker({ brokerId: 999999 });
    
    // Should return an array (empty if broker doesn't exist)
    expect(Array.isArray(result)).toBe(true);
  });
});
