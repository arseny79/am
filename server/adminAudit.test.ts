import { describe, expect, it, afterEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { adminAuditLogs } from "../drizzle/schema";
import { logAdminAction, AuditActions, AuditResources } from "./lib/adminAuditService";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const adminUser: AuthenticatedUser = {
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

  const ctx: TrpcContext = {
    user: adminUser,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("Admin Audit Logging Service", () => {
  // Clean up after each test
  afterEach(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(adminAuditLogs);
    }
  });

  it("logs admin action successfully", async () => {
    await logAdminAction({
      adminId: 1,
      adminName: "Test Admin",
      adminEmail: "admin@test.com",
      action: AuditActions.SETTINGS_UPDATE,
      resource: AuditResources.SETTINGS,
      details: JSON.stringify({ field: "heroHeadline", value: "New Headline" }),
      ipAddress: "192.168.1.1",
      status: "success",
    });

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const logs = await db.select().from(adminAuditLogs);
    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe(AuditActions.SETTINGS_UPDATE);
    expect(logs[0].resource).toBe(AuditResources.SETTINGS);
    expect(logs[0].adminId).toBe(1);
    expect(logs[0].status).toBe("success");
  });

  it("logs failure status correctly", async () => {
    await logAdminAction({
      adminId: 1,
      adminName: "Test Admin",
      adminEmail: "admin@test.com",
      action: AuditActions.KYC_APPROVE,
      resource: AuditResources.KYC,
      resourceId: 123,
      status: "failure",
      errorMessage: "User not found",
    });

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const logs = await db.select().from(adminAuditLogs);
    expect(logs).toHaveLength(1);
    expect(logs[0].status).toBe("failure");
    expect(logs[0].errorMessage).toBe("User not found");
  });

  it("stores resource ID when provided", async () => {
    await logAdminAction({
      adminId: 1,
      action: AuditActions.LISTING_APPROVE,
      resource: AuditResources.LISTING,
      resourceId: 456,
    });

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const logs = await db.select().from(adminAuditLogs);
    expect(logs).toHaveLength(1);
    expect(logs[0].resourceId).toBe(456);
  });
});

describe("Admin Audit Router", () => {
  // Clean up after each test
  afterEach(async () => {
    const db = await getDb();
    if (db) {
      await db.delete(adminAuditLogs);
    }
  });

  it("returns empty logs when no audit entries exist", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAudit.getLogs({});

    expect(result.logs).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it("returns logs after creating entries", async () => {
    // Create some audit entries
    await logAdminAction({
      adminId: 1,
      adminName: "Test Admin",
      action: AuditActions.USER_UPDATE,
      resource: AuditResources.USER,
      resourceId: 100,
    });

    await logAdminAction({
      adminId: 1,
      adminName: "Test Admin",
      action: AuditActions.LISTING_APPROVE,
      resource: AuditResources.LISTING,
      resourceId: 200,
    });

    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAudit.getLogs({});

    expect(result.logs.length).toBeGreaterThanOrEqual(2);
    expect(result.total).toBeGreaterThanOrEqual(2);
  });

  it("filters logs by action type", async () => {
    await logAdminAction({
      adminId: 1,
      action: AuditActions.USER_UPDATE,
      resource: AuditResources.USER,
    });

    await logAdminAction({
      adminId: 1,
      action: AuditActions.LISTING_APPROVE,
      resource: AuditResources.LISTING,
    });

    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAudit.getLogs({
      action: AuditActions.USER_UPDATE,
    });

    expect(result.logs.every((log) => log.action === AuditActions.USER_UPDATE)).toBeTruthy();
  });

  it("filters logs by resource type", async () => {
    await logAdminAction({
      adminId: 1,
      action: AuditActions.USER_UPDATE,
      resource: AuditResources.USER,
    });

    await logAdminAction({
      adminId: 1,
      action: AuditActions.LISTING_APPROVE,
      resource: AuditResources.LISTING,
    });

    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAudit.getLogs({
      resource: AuditResources.LISTING,
    });

    expect(result.logs.every((log) => log.resource === AuditResources.LISTING)).toBeTruthy();
  });

  it("returns action types list", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAudit.getActionTypes();

    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("key");
    expect(result[0]).toHaveProperty("value");
    expect(result[0]).toHaveProperty("label");
  });

  it("returns resource types list", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAudit.getResourceTypes();

    expect(Array.isArray(result)).toBeTruthy();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("key");
    expect(result[0]).toHaveProperty("value");
    expect(result[0]).toHaveProperty("label");
  });

  it("exports logs as CSV", async () => {
    await logAdminAction({
      adminId: 1,
      adminName: "Test Admin",
      adminEmail: "admin@test.com",
      action: AuditActions.SETTINGS_UPDATE,
      resource: AuditResources.SETTINGS,
      details: "Updated site settings",
    });

    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAudit.exportLogs({});

    expect(result.csv).toBeDefined();
    expect(result.csv).toContain("ID,Timestamp,Admin ID");
    expect(result.filename).toMatch(/audit-logs-\d{4}-\d{2}-\d{2}\.csv/);
  });

  it("returns stats summary", async () => {
    await logAdminAction({
      adminId: 1,
      adminName: "Test Admin",
      action: AuditActions.USER_UPDATE,
      resource: AuditResources.USER,
      status: "success",
    });

    await logAdminAction({
      adminId: 1,
      adminName: "Test Admin",
      action: AuditActions.KYC_REJECT,
      resource: AuditResources.KYC,
      status: "failure",
      errorMessage: "Invalid documents",
    });

    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.adminAudit.getStats({});

    expect(result).toHaveProperty("byAction");
    expect(result).toHaveProperty("byResource");
    expect(result).toHaveProperty("byStatus");
    expect(result).toHaveProperty("topAdmins");
  });
});
