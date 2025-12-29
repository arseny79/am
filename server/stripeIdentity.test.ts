import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Stripe Identity Verification", () => {
  const testUser: AuthenticatedUser = {
    id: 999,
    openId: "test-stripe-identity-user",
    email: "stripetest@example.com",
    name: "Stripe Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  beforeEach(async () => {
    // Clean up test user if exists
    const db = await getDb();
    if (db) {
      await db.delete(users).where(eq(users.id, testUser.id));
      
      // Insert test user
      await db.insert(users).values({
        id: testUser.id,
        openId: testUser.openId,
        email: testUser.email,
        name: testUser.name,
        loginMethod: testUser.loginMethod,
        role: testUser.role,
        kycVerified: false,
        stripeIdentityVerified: false,
      });
    }
  });

  it("creates payment intent for $5 verification", async () => {
    const ctx = createAuthContext(testUser);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.stripeIdentity.createVerificationPayment();

    expect(result).toHaveProperty("clientSecret");
    expect(result).toHaveProperty("paymentIntentId");
    expect(result.clientSecret).toContain("pi_");
  });

  it("requires payment before creating verification session", async () => {
    const ctx = createAuthContext(testUser);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.stripeIdentity.createVerificationSession({
        paymentIntentId: "pi_invalid_not_paid",
      })
    ).rejects.toThrow();
  });

  it("returns verification status for user", async () => {
    const ctx = createAuthContext(testUser);
    const caller = appRouter.createCaller(ctx);

    const status = await caller.stripeIdentity.getVerificationStatus();

    expect(status).toHaveProperty("status");
    expect(status.status).toBe("not_started");
  });

  it("marks user as verified after successful Stripe Identity check", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simulate webhook marking user as verified
    await db
      .update(users)
      .set({
        stripeIdentityVerified: true,
        stripeIdentityVerifiedAt: new Date(),
      })
      .where(eq(users.id, testUser.id));

    // Verify user is marked as verified
    const updatedUser = await db
      .select()
      .from(users)
      .where(eq(users.id, testUser.id))
      .limit(1);

    expect(updatedUser[0]?.stripeIdentityVerified).toBe(true);
    expect(updatedUser[0]?.stripeIdentityVerifiedAt).toBeTruthy();
  });
});
