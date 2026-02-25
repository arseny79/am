import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    emailVerified: true,
    kycStatus: "approved",
    kycVerified: true,
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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Buyer Requests", () => {
  it("creates a buyer request successfully", async () => {
    const ctx = createTestContext(1);
    const caller = appRouter.createCaller(ctx);

    const request = await caller.buyerRequest.create({
      title: "Seeking MSP in Texas",
      description: "Looking for an established MSP with strong cloud services",
      minRevenue: 500000,
      maxRevenue: 2000000,
      minEbitda: 150000,
      maxEbitda: 600000,
      preferredLocations: "Texas, Oklahoma",
      requiredServiceMix: "Cloud services, cybersecurity",
      budget: 2500000,
      timeline: "3-6 months",
      additionalRequirements: "Must have Microsoft partnership",
      isPublic: true,
    });

    expect(request.id).toBeTypeOf("number");
    expect(request.title).toBe("Seeking MSP in Texas");
    expect(request.status).toBe("pending");
    expect(request.buyerId).toBe(1);
  });

  it("retrieves all public buyer requests", async () => {
    const ctx = createTestContext(2);
    const caller = appRouter.createCaller(ctx);

    // Create a request first
    await caller.buyerRequest.create({
      title: "Seeking MSP in California",
      description: "Looking for cybersecurity-focused MSP with strong technical team and client retention",
      minRevenue: 1000000,
      isPublic: true,
    });

    const requests = await caller.buyerRequest.getAll({ activeOnly: true });
    expect(Array.isArray(requests)).toBe(true);
    expect(requests.length).toBeGreaterThan(0);
  });

  it("retrieves user's own buyer requests", async () => {
    const ctx = createTestContext(3);
    const caller = appRouter.createCaller(ctx);

    // Create two requests
    await caller.buyerRequest.create({
      title: "First Request",
      description: "Looking for an MSP with strong technical capabilities and good client retention rates",
      isPublic: true,
    });

    await caller.buyerRequest.create({
      title: "Second Request",
      description: "Seeking MSP with focus on healthcare vertical and HIPAA compliance experience",
      isPublic: false,
    });

    const myRequests = await caller.buyerRequest.getMy();
    expect(myRequests.length).toBeGreaterThanOrEqual(2);
    expect(myRequests.every((r) => r.buyerId === 3)).toBe(true);
  });

  it("updates buyer request status", async () => {
    const ctx = createTestContext(4);
    const caller = appRouter.createCaller(ctx);

    const request = await caller.buyerRequest.create({
      title: "Test Request",
      description: "Looking for MSP business with established client base and recurring revenue model",
      isPublic: true,
    });

    const updated = await caller.buyerRequest.updateStatus({
      id: request.id,
      status: "fulfilled",
    });

    expect(updated.status).toBe("fulfilled");
  });
});
