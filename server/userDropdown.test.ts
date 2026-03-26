import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "john.doe@example.com",
    name: "John Doe",
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
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("UserDropdown Functionality", () => {
  it("should get current user info for dropdown display", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user).toBeDefined();
    expect(user?.name).toBe("John Doe");
    expect(user?.email).toBe("john.doe@example.com");
    expect(user?.role).toBe("user");
  });

  it("should handle user with name and email", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    // Verify user has both name and email for dropdown display
    expect(user?.name).toBeTruthy();
    expect(user?.email).toBeTruthy();
  });

  it("should handle user with only email (no name)", async () => {
    const { ctx } = createAuthContext();
    ctx.user!.name = null;
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    // Should still have email for display
    expect(user?.email).toBe("john.doe@example.com");
    expect(user?.name).toBeNull();
  });

  it("should support logout from dropdown menu", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();

    expect(result.success).toBe(true);
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });

  it("should show admin role in dropdown for admin users", async () => {
    const { ctx } = createAuthContext();
    ctx.user!.role = "admin";
    const caller = appRouter.createCaller(ctx);

    const user = await caller.auth.me();

    expect(user?.role).toBe("admin");
  });
});
