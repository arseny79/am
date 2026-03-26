import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(userId: number = 1, overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-edit-del-${userId}`,
    email: `edit-del-user${userId}@example.com`,
    name: `Test Edit User ${userId}`,
    loginMethod: "email",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSignedIn: new Date().toISOString(),
    kycVerified: 1,
    kycStatus: "verified",
    verificationStatus: "verified",
    stripeIdentityVerified: 1,
    emailVerified: 1,
    ...overrides,
  } as AuthenticatedUser;

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

describe("Buyer Request Edit/Delete", () => {
  it("updates a buyer request title and description", async () => {
    const ctx = createTestContext(901);
    const caller = appRouter.createCaller(ctx);

    // Create a request first
    const request = await caller.buyerRequest.create({
      title: "Original Title for Edit Test",
      description: "Original description that is long enough to pass the fifty character minimum validation requirement",
      minRevenue: 500000,
      maxRevenue: 2000000,
      isPublic: true,
    });

    // Update it
    const result = await caller.buyerRequest.update({
      id: request.id,
      title: "Updated Title for Edit Test",
      description: "Updated description that is also long enough to pass the fifty character minimum validation requirement",
    });

    expect(result.success).toBe(true);

    // Verify the update
    const updated = await caller.buyerRequest.getById({ id: request.id });
    expect(updated.title).toBe("Updated Title for Edit Test");
    expect(updated.description).toBe("Updated description that is also long enough to pass the fifty character minimum validation requirement");
  });

  it("updates buyer request financial fields", async () => {
    const ctx = createTestContext(902);
    const caller = appRouter.createCaller(ctx);

    const request = await caller.buyerRequest.create({
      title: "Financial Update Test Request",
      description: "Testing financial field updates with enough characters to pass the minimum validation requirement",
      minRevenue: 500000,
      maxRevenue: 2000000,
      budget: 1500000,
      isPublic: true,
    });

    const result = await caller.buyerRequest.update({
      id: request.id,
      minRevenue: 750000,
      maxRevenue: 3000000,
      budget: 2500000,
    });

    expect(result.success).toBe(true);

    const updated = await caller.buyerRequest.getById({ id: request.id });
    expect(updated.minRevenue).toBe(750000);
    expect(updated.maxRevenue).toBe(3000000);
    expect(updated.budget).toBe(2500000);
  });

  it("updates buyer request isAnonymous field", async () => {
    const ctx = createTestContext(903);
    const caller = appRouter.createCaller(ctx);

    const request = await caller.buyerRequest.create({
      title: "Anonymous Toggle Test Request",
      description: "Testing anonymous toggle update with enough characters to pass the minimum validation requirement",
      isPublic: true,
      isAnonymous: false,
    });

    expect(request.isAnonymous).toBe(0);

    const result = await caller.buyerRequest.update({
      id: request.id,
      isAnonymous: true,
    });

    expect(result.success).toBe(true);

    const updated = await caller.buyerRequest.getById({ id: request.id });
    expect(updated.isAnonymous).toBe(1);
  });

  it("rejects update with title shorter than 10 characters", async () => {
    const ctx = createTestContext(904);
    const caller = appRouter.createCaller(ctx);

    const request = await caller.buyerRequest.create({
      title: "Valid Title for Short Title Test",
      description: "Valid description that is long enough to pass the fifty character minimum validation requirement",
      isPublic: true,
    });

    await expect(
      caller.buyerRequest.update({
        id: request.id,
        title: "Short",
      })
    ).rejects.toThrow();
  });

  it("rejects update with description shorter than 50 characters", async () => {
    const ctx = createTestContext(905);
    const caller = appRouter.createCaller(ctx);

    const request = await caller.buyerRequest.create({
      title: "Valid Title for Short Description Test",
      description: "Valid description that is long enough to pass the fifty character minimum validation requirement",
      isPublic: true,
    });

    await expect(
      caller.buyerRequest.update({
        id: request.id,
        description: "Too short description",
      })
    ).rejects.toThrow();
  });

  it("prevents updating another user's request", async () => {
    const ownerCtx = createTestContext(906);
    const ownerCaller = appRouter.createCaller(ownerCtx);

    const request = await ownerCaller.buyerRequest.create({
      title: "Owner's Request for Auth Test",
      description: "This request belongs to user 906 and should not be editable by user 907 in this test",
      isPublic: true,
    });

    // Try to update as a different user
    const otherCtx = createTestContext(907);
    const otherCaller = appRouter.createCaller(otherCtx);

    await expect(
      otherCaller.buyerRequest.update({
        id: request.id,
        title: "Hacked Title That Should Not Work",
      })
    ).rejects.toThrow();
  });

  it("soft-deletes (withdraws) a buyer request", async () => {
    const ctx = createTestContext(908);
    const caller = appRouter.createCaller(ctx);

    const request = await caller.buyerRequest.create({
      title: "Request to Be Withdrawn in Test",
      description: "This request will be soft-deleted (withdrawn) to verify the delete mutation works correctly",
      isPublic: true,
    });

    expect(request.status).toBe("active");

    const result = await caller.buyerRequest.delete({ id: request.id });
    expect(result.success).toBe(true);

    // Verify it's withdrawn, not hard-deleted
    const withdrawn = await caller.buyerRequest.getById({ id: request.id });
    expect(withdrawn).toBeDefined();
    expect(withdrawn.status).toBe("withdrawn");
  });

  it("prevents deleting another user's request", async () => {
    const ownerCtx = createTestContext(909);
    const ownerCaller = appRouter.createCaller(ownerCtx);

    const request = await ownerCaller.buyerRequest.create({
      title: "Owner's Request for Delete Auth Test",
      description: "This request belongs to user 909 and should not be deletable by user 910 in this test",
      isPublic: true,
    });

    const otherCtx = createTestContext(910);
    const otherCaller = appRouter.createCaller(otherCtx);

    await expect(
      otherCaller.buyerRequest.delete({ id: request.id })
    ).rejects.toThrow();
  });

  it("withdrawn requests do not appear in active public listings", async () => {
    const ctx = createTestContext(911);
    const caller = appRouter.createCaller(ctx);

    const request = await caller.buyerRequest.create({
      title: "Request That Will Be Withdrawn From Public",
      description: "This request will be withdrawn and should not appear in the active public listings anymore",
      isPublic: true,
    });

    // Withdraw it
    await caller.buyerRequest.delete({ id: request.id });

    // Check public listings
    const publicRequests = await caller.buyerRequest.getAll({ activeOnly: true });
    const found = publicRequests.find((r: { id: number }) => r.id === request.id);
    expect(found).toBeUndefined();
  });

  it("withdrawn requests still appear in user's own requests", async () => {
    const ctx = createTestContext(912);
    const caller = appRouter.createCaller(ctx);

    const request = await caller.buyerRequest.create({
      title: "Request That Will Be Withdrawn But Visible to Owner",
      description: "This request will be withdrawn but should still appear in the user's own requests list",
      isPublic: true,
    });

    // Withdraw it
    await caller.buyerRequest.delete({ id: request.id });

    // Check own requests - should still be visible
    const myRequests = await caller.buyerRequest.getMy();
    const found = myRequests.find((r: { id: number }) => r.id === request.id);
    expect(found).toBeDefined();
    expect(found!.status).toBe("withdrawn");
  });

  it("updates multiple fields at once", async () => {
    const ctx = createTestContext(913);
    const caller = appRouter.createCaller(ctx);

    const request = await caller.buyerRequest.create({
      title: "Multi-Field Update Test Request",
      description: "Testing that multiple fields can be updated simultaneously in a single mutation call",
      minRevenue: 100000,
      preferredLocations: "New York",
      timeline: "1-3 months",
      isPublic: true,
    });

    const result = await caller.buyerRequest.update({
      id: request.id,
      title: "Updated Multi-Field Request Title",
      minRevenue: 200000,
      maxRevenue: 5000000,
      preferredLocations: "California, Texas",
      timeline: "6-12 months",
      additionalRequirements: "Must have SOC2 compliance",
    });

    expect(result.success).toBe(true);

    const updated = await caller.buyerRequest.getById({ id: request.id });
    expect(updated.title).toBe("Updated Multi-Field Request Title");
    expect(updated.minRevenue).toBe(200000);
    expect(updated.maxRevenue).toBe(5000000);
    expect(updated.preferredLocations).toBe("California, Texas");
    expect(updated.timeline).toBe("6-12 months");
    expect(updated.additionalRequirements).toBe("Must have SOC2 compliance");
  });
});
