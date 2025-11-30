import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userOverrides?: Partial<AuthenticatedUser>): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    companyName: null,
    companyWebsite: null,
    phoneNumber: null,
    location: null,
    bio: null,
    tosAcceptedAt: null,
    privacyPolicyAcceptedAt: null,
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

describe("auth.acceptTerms", () => {
  it("should accept terms and set timestamps for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.acceptTerms();

    expect(result.success).toBe(true);
    expect(result.acceptedAt).toBeInstanceOf(Date);

    // Verify database was updated
    const updatedUser = await db.getUserById(ctx.user!.id);
    expect(updatedUser?.tosAcceptedAt).toBeInstanceOf(Date);
    expect(updatedUser?.privacyPolicyAcceptedAt).toBeInstanceOf(Date);
    expect(updatedUser?.tosAcceptedAt?.getTime()).toBe(updatedUser?.privacyPolicyAcceptedAt?.getTime());
  });

  it("should allow re-acceptance of terms (updating timestamps)", async () => {
    const oldDate = new Date("2023-01-01");
    const { ctx } = createAuthContext({
      tosAcceptedAt: oldDate,
      privacyPolicyAcceptedAt: oldDate,
    });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.acceptTerms();

    expect(result.success).toBe(true);
    expect(result.acceptedAt.getTime()).toBeGreaterThan(oldDate.getTime());

    // Verify database was updated with new timestamp
    const updatedUser = await db.getUserById(ctx.user!.id);
    expect(updatedUser?.tosAcceptedAt?.getTime()).toBeGreaterThan(oldDate.getTime());
  });

  it("should fail for unauthenticated users", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(caller.auth.acceptTerms()).rejects.toThrow("Please login");
  });

  it("should set both TOS and Privacy Policy timestamps to the same value", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await caller.auth.acceptTerms();

    const updatedUser = await db.getUserById(ctx.user!.id);
    expect(updatedUser?.tosAcceptedAt).toBeDefined();
    expect(updatedUser?.privacyPolicyAcceptedAt).toBeDefined();
    expect(updatedUser?.tosAcceptedAt?.getTime()).toBe(
      updatedUser?.privacyPolicyAcceptedAt?.getTime()
    );
  });
});

describe("auth.me - TOS acceptance status", () => {
  it("should return user with null TOS timestamps for new users", async () => {
    const { ctx } = createAuthContext({
      tosAcceptedAt: null,
      privacyPolicyAcceptedAt: null,
    });
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.tosAcceptedAt).toBeNull();
    expect(user?.privacyPolicyAcceptedAt).toBeNull();
  });

  it("should return user with TOS timestamps after acceptance", async () => {
    const acceptedDate = new Date();
    const { ctx } = createAuthContext({
      tosAcceptedAt: acceptedDate,
      privacyPolicyAcceptedAt: acceptedDate,
    });
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.tosAcceptedAt).toBeInstanceOf(Date);
    expect(user?.privacyPolicyAcceptedAt).toBeInstanceOf(Date);
  });
});
