import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(userOverrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user-123",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    companyName: null,
    companyWebsite: null,
    phoneNumber: null,
    location: null,
    bio: null,
    tosAcceptedAt: new Date(),
    privacyPolicyAcceptedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...userOverrides,
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

function createNonAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "regular-user-123",
    email: "user@example.com",
    name: "Regular User",
    loginMethod: "manus",
    role: "user",
    companyName: null,
    companyWebsite: null,
    phoneNumber: null,
    location: null,
    bio: null,
    tosAcceptedAt: new Date(),
    privacyPolicyAcceptedAt: new Date(),
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
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("admin.getTOSAcceptanceAuditLog", () => {
  it("should return all users with TOS acceptance data for admin", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getTOSAcceptanceAuditLog({
      acceptanceStatus: "all",
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Verify structure of returned data
    const firstUser = result[0];
    expect(firstUser).toHaveProperty("id");
    expect(firstUser).toHaveProperty("name");
    expect(firstUser).toHaveProperty("email");
    expect(firstUser).toHaveProperty("tosAcceptedAt");
    expect(firstUser).toHaveProperty("privacyPolicyAcceptedAt");
    expect(firstUser).toHaveProperty("createdAt");
    expect(firstUser).toHaveProperty("lastSignedIn");
  });

  it("should filter users by acceptance status (accepted only)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getTOSAcceptanceAuditLog({
      acceptanceStatus: "accepted",
    });

    // All returned users should have tosAcceptedAt
    result.forEach((user) => {
      expect(user.tosAcceptedAt).not.toBeNull();
    });
  });

  it("should filter users by acceptance status (not accepted only)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getTOSAcceptanceAuditLog({
      acceptanceStatus: "not_accepted",
    });

    // All returned users should have null tosAcceptedAt
    result.forEach((user) => {
      expect(user.tosAcceptedAt).toBeNull();
    });
  });

  it("should filter users by date range", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await caller.admin.getTOSAcceptanceAuditLog({
      startDate: yesterday.toISOString().split("T")[0],
      endDate: tomorrow.toISOString().split("T")[0],
      acceptanceStatus: "accepted",
    });

    // All returned users should have acceptance date within range
    result.forEach((user) => {
      if (user.tosAcceptedAt) {
        const acceptedDate = new Date(user.tosAcceptedAt);
        expect(acceptedDate.getTime()).toBeGreaterThanOrEqual(yesterday.getTime());
        expect(acceptedDate.getTime()).toBeLessThanOrEqual(tomorrow.getTime());
      }
    });
  });

  it("should deny access to non-admin users", async () => {
    const { ctx } = createNonAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.getTOSAcceptanceAuditLog({ acceptanceStatus: "all" })
    ).rejects.toThrow();
  });

  it("should deny access to unauthenticated users", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.admin.getTOSAcceptanceAuditLog({ acceptanceStatus: "all" })
    ).rejects.toThrow();
  });

  it("should handle empty date filters gracefully", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getTOSAcceptanceAuditLog({
      acceptanceStatus: "all",
    });

    expect(Array.isArray(result)).toBe(true);
  });

  it("should return users ordered by acceptance date (most recent first)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.admin.getTOSAcceptanceAuditLog({
      acceptanceStatus: "accepted",
    });

    // Verify ordering (descending by tosAcceptedAt)
    for (let i = 0; i < result.length - 1; i++) {
      const current = result[i]?.tosAcceptedAt;
      const next = result[i + 1]?.tosAcceptedAt;
      
      if (current && next) {
        expect(new Date(current).getTime()).toBeGreaterThanOrEqual(
          new Date(next).getTime()
        );
      }
    }
  });
});
