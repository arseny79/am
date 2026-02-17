import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `admin-test-${userId}`,
    email: `admin${userId}@example.com`,
    name: `Admin User ${userId}`,
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSignedIn: new Date().toISOString(),
    kycVerified: 1,
    kycStatus: "verified",
    verificationStatus: "verified",
    stripeIdentityVerified: 1,
    emailVerified: 1,
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

function createUserContext(userId: number): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-test-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastSignedIn: new Date().toISOString(),
    kycVerified: 1,
    kycStatus: "verified",
    verificationStatus: "verified",
    stripeIdentityVerified: 1,
    emailVerified: 1,
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

describe("Admin Buyer Request Management", () => {
  it("admin can get all buyer requests", async () => {
    const adminCtx = createAdminContext(1001);
    const adminCaller = appRouter.createCaller(adminCtx);

    // Create a test request first
    const userCtx = createUserContext(2001);
    const userCaller = appRouter.createCaller(userCtx);

    await userCaller.buyerRequest.create({
      title: "Admin Test Request for GetAll",
      description: "This is a test buyer request created to verify the admin getAll endpoint works correctly",
      isPublic: true,
    });

    // Admin fetches all requests
    const result = await adminCaller.adminBuyerRequests.getAll({
      page: 1,
      pageSize: 20,
      status: "all",
      spamLevel: "all",
    });

    expect(result.requests).toBeDefined();
    expect(result.total).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("admin can filter by status", async () => {
    const adminCtx = createAdminContext(1002);
    const adminCaller = appRouter.createCaller(adminCtx);

    const userCtx = createUserContext(2002);
    const userCaller = appRouter.createCaller(userCtx);

    // Create an active request
    const activeRequest = await userCaller.buyerRequest.create({
      title: "Active Request for Filter Test",
      description: "This request should appear in the active filter results when admin filters by status",
      isPublic: true,
    });

    // Create and withdraw another request
    const withdrawnRequest = await userCaller.buyerRequest.create({
      title: "Withdrawn Request for Filter Test",
      description: "This request will be withdrawn and should only appear in withdrawn filter results",
      isPublic: true,
    });
    await userCaller.buyerRequest.delete({ id: withdrawnRequest.id });

    // Filter by active
    const activeResults = await adminCaller.adminBuyerRequests.getAll({
      page: 1,
      pageSize: 20,
      status: "active",
      spamLevel: "all",
    });

    const foundActive = activeResults.requests.find((r: { id: number }) => r.id === activeRequest.id);
    const foundWithdrawnInActive = activeResults.requests.find((r: { id: number }) => r.id === withdrawnRequest.id);

    expect(foundActive).toBeDefined();
    expect(foundWithdrawnInActive).toBeUndefined();

    // Filter by withdrawn
    const withdrawnResults = await adminCaller.adminBuyerRequests.getAll({
      page: 1,
      pageSize: 20,
      status: "withdrawn",
      spamLevel: "all",
    });

    const foundWithdrawn = withdrawnResults.requests.find((r: { id: number }) => r.id === withdrawnRequest.id);
    expect(foundWithdrawn).toBeDefined();
  });

  it("admin can search buyer requests", async () => {
    const adminCtx = createAdminContext(1003);
    const adminCaller = appRouter.createCaller(adminCtx);

    const userCtx = createUserContext(2003);
    const userCaller = appRouter.createCaller(userCtx);

    const uniqueKeyword = `UNIQUE_SEARCH_${Date.now()}`;
    await userCaller.buyerRequest.create({
      title: `Request with ${uniqueKeyword} in title`,
      description: "This request contains a unique keyword in the title for search testing purposes",
      isPublic: true,
    });

    const results = await adminCaller.adminBuyerRequests.getAll({
      page: 1,
      pageSize: 20,
      status: "all",
      spamLevel: "all",
      search: uniqueKeyword,
    });

    expect(results.requests.length).toBeGreaterThan(0);
    expect(results.requests.some((r: { title: string }) => r.title.includes(uniqueKeyword))).toBe(true);
  });

  it("admin can update buyer request", async () => {
    const adminCtx = createAdminContext(1004);
    const adminCaller = appRouter.createCaller(adminCtx);

    const userCtx = createUserContext(2004);
    const userCaller = appRouter.createCaller(userCtx);

    const request = await userCaller.buyerRequest.create({
      title: "Original Title for Admin Update Test",
      description: "Original description that will be updated by the admin to verify update permissions",
      isPublic: true,
    });

    const result = await adminCaller.adminBuyerRequests.update({
      id: request.id,
      title: "Admin Updated Title for Update Test",
      description: "Admin updated description to verify that admins can modify any buyer request",
    });

    expect(result.success).toBe(true);

    // Verify the update
    const updated = await userCaller.buyerRequest.getById({ id: request.id });
    expect(updated.title).toBe("Admin Updated Title for Update Test");
    expect(updated.description).toBe("Admin updated description to verify that admins can modify any buyer request");
  });

  it("admin can bulk delete (withdraw) buyer requests", async () => {
    const adminCtx = createAdminContext(1005);
    const adminCaller = appRouter.createCaller(adminCtx);

    const userCtx = createUserContext(2005);
    const userCaller = appRouter.createCaller(userCtx);

    const request1 = await userCaller.buyerRequest.create({
      title: "Bulk Delete Test Request 1",
      description: "First request to be bulk deleted by admin to verify bulk delete functionality works",
      isPublic: true,
    });

    const request2 = await userCaller.buyerRequest.create({
      title: "Bulk Delete Test Request 2",
      description: "Second request to be bulk deleted by admin to verify bulk delete functionality works",
      isPublic: true,
    });

    const result = await adminCaller.adminBuyerRequests.bulkDelete({
      ids: [request1.id, request2.id],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);

    // Verify both are withdrawn
    const updated1 = await userCaller.buyerRequest.getById({ id: request1.id });
    const updated2 = await userCaller.buyerRequest.getById({ id: request2.id });

    expect(updated1.status).toBe("withdrawn");
    expect(updated2.status).toBe("withdrawn");
  });

  it("admin can bulk flag buyer requests", async () => {
    const adminCtx = createAdminContext(1006);
    const adminCaller = appRouter.createCaller(adminCtx);

    const userCtx = createUserContext(2006);
    const userCaller = appRouter.createCaller(userCtx);

    const request1 = await userCaller.buyerRequest.create({
      title: "Bulk Flag Test Request 1",
      description: "First request to be bulk flagged by admin to verify bulk flag functionality works",
      isPublic: true,
    });

    const request2 = await userCaller.buyerRequest.create({
      title: "Bulk Flag Test Request 2",
      description: "Second request to be bulk flagged by admin to verify bulk flag functionality works",
      isPublic: true,
    });

    const result = await adminCaller.adminBuyerRequests.bulkFlag({
      ids: [request1.id, request2.id],
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);

    // Verify both are flagged
    const updated1 = await userCaller.buyerRequest.getById({ id: request1.id });
    const updated2 = await userCaller.buyerRequest.getById({ id: request2.id });

    expect(updated1.flaggedAt).toBeTruthy();
    expect(updated2.flaggedAt).toBeTruthy();
  });

  it("admin can bulk unflag buyer requests", async () => {
    const adminCtx = createAdminContext(1007);
    const adminCaller = appRouter.createCaller(adminCtx);

    const userCtx = createUserContext(2007);
    const userCaller = appRouter.createCaller(userCtx);

    const request = await userCaller.buyerRequest.create({
      title: "Bulk Unflag Test Request",
      description: "Request to be flagged then unflagged by admin to verify bulk unflag functionality works",
      isPublic: true,
    });

    // Flag it first
    await adminCaller.adminBuyerRequests.bulkFlag({ ids: [request.id] });

    // Verify it's flagged
    let updated = await userCaller.buyerRequest.getById({ id: request.id });
    expect(updated.flaggedAt).toBeTruthy();

    // Unflag it
    const result = await adminCaller.adminBuyerRequests.bulkUnflag({ ids: [request.id] });
    expect(result.success).toBe(true);

    // Verify it's unflagged
    updated = await userCaller.buyerRequest.getById({ id: request.id });
    expect(updated.flaggedAt).toBeNull();
  });

  it("admin can recalculate spam score", async () => {
    const adminCtx = createAdminContext(1008);
    const adminCaller = appRouter.createCaller(adminCtx);

    const userCtx = createUserContext(2008);
    const userCaller = appRouter.createCaller(userCtx);

    // Create a request with spam keywords
    const request = await userCaller.buyerRequest.create({
      title: "BUY NOW - Limited Time Offer!",
      description: "Click here to get rich quick! This is a guaranteed investment opportunity with no risk at all!",
      isPublic: true,
    });

    const result = await adminCaller.adminBuyerRequests.recalculateSpamScore({
      id: request.id,
    });

    expect(result.success).toBe(true);
    expect(result.spamScore).toBeGreaterThan(0);

    // Verify the spam score was saved
    const updated = await userCaller.buyerRequest.getById({ id: request.id });
    expect(updated.spamScore).toBe(result.spamScore);
  });

  it("non-admin cannot access admin endpoints", async () => {
    const userCtx = createUserContext(2009);
    const userCaller = appRouter.createCaller(userCtx);

    await expect(
      userCaller.adminBuyerRequests.getAll({
        page: 1,
        pageSize: 20,
        status: "all",
        spamLevel: "all",
      })
    ).rejects.toThrow();
  });

  it("admin can filter by spam level", async () => {
    const adminCtx = createAdminContext(1010);
    const adminCaller = appRouter.createCaller(adminCtx);

    const userCtx = createUserContext(2010);
    const userCaller = appRouter.createCaller(userCtx);

    // Create a high-spam request
    const spamRequest = await userCaller.buyerRequest.create({
      title: "BUY NOW!!! URGENT!!! LIMITED TIME!!!",
      description: "CLICK HERE NOW!!! GUARANTEED MONEY!!! FREE CASH!!! WORK FROM HOME!!! NO RISK!!! 100% FREE!!!",
      isPublic: true,
    });

    // Recalculate spam score
    await adminCaller.adminBuyerRequests.recalculateSpamScore({ id: spamRequest.id });

    // Filter by high spam
    const highSpamResults = await adminCaller.adminBuyerRequests.getAll({
      page: 1,
      pageSize: 20,
      status: "all",
      spamLevel: "high",
    });

    const found = highSpamResults.requests.find((r: { id: number }) => r.id === spamRequest.id);
    expect(found).toBeDefined();
    expect(found!.spamScore).toBeGreaterThan(70);
  });
});
