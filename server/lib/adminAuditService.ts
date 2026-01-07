import { getDb } from "../db";
import { adminAuditLogs, InsertAdminAuditLog } from "../../drizzle/schema";
import { desc, eq, and, gte, lte, like, sql } from "drizzle-orm";

/**
 * Admin Audit Logging Service
 * 
 * Provides comprehensive audit logging for all admin actions.
 * Logs are immutable and include:
 * - Admin identity (id, name, email)
 * - Action performed
 * - Resource affected
 * - Request metadata (IP, user agent)
 * - Success/failure status
 * - Detailed context
 */

export interface AuditLogEntry {
  adminId: number;
  adminName?: string | null;
  adminEmail?: string | null;
  action: string;
  resource: string;
  resourceId?: number | null;
  details?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  status?: "success" | "failure";
  errorMessage?: string | null;
}

/**
 * Log an admin action
 */
export async function logAdminAction(entry: AuditLogEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[AdminAudit] Database not available, skipping audit log");
      return;
    }

    await db.insert(adminAuditLogs).values({
      adminId: entry.adminId,
      adminName: entry.adminName || null,
      adminEmail: entry.adminEmail || null,
      action: entry.action,
      resource: entry.resource,
      resourceId: entry.resourceId || null,
      details: entry.details || null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      status: entry.status || "success",
      errorMessage: entry.errorMessage || null,
    });
  } catch (error) {
    // Don't throw - audit logging should never break the main operation
    console.error("[AdminAudit] Failed to log admin action:", error);
  }
}

/**
 * Query audit logs with filters
 */
export interface AuditLogQuery {
  adminId?: number;
  action?: string;
  resource?: string;
  status?: "success" | "failure";
  startDate?: Date;
  endDate?: Date;
  searchTerm?: string;
  limit?: number;
  offset?: number;
}

export async function queryAuditLogs(query: AuditLogQuery) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (query.adminId) {
    conditions.push(eq(adminAuditLogs.adminId, query.adminId));
  }

  if (query.action) {
    conditions.push(eq(adminAuditLogs.action, query.action));
  }

  if (query.resource) {
    conditions.push(eq(adminAuditLogs.resource, query.resource));
  }

  if (query.status) {
    conditions.push(eq(adminAuditLogs.status, query.status));
  }

  if (query.startDate) {
    const startStr = query.startDate.toISOString().slice(0, 19).replace("T", " ");
    conditions.push(gte(adminAuditLogs.createdAt, startStr));
  }

  if (query.endDate) {
    const endStr = query.endDate.toISOString().slice(0, 19).replace("T", " ");
    conditions.push(lte(adminAuditLogs.createdAt, endStr));
  }

  if (query.searchTerm) {
    conditions.push(
      sql`(${adminAuditLogs.details} LIKE ${`%${query.searchTerm}%`} OR ${adminAuditLogs.adminName} LIKE ${`%${query.searchTerm}%`} OR ${adminAuditLogs.adminEmail} LIKE ${`%${query.searchTerm}%`})`
    );
  }

  let dbQuery = db
    .select()
    .from(adminAuditLogs)
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(query.limit || 100)
    .offset(query.offset || 0);

  if (conditions.length > 0) {
    dbQuery = dbQuery.where(and(...conditions)) as typeof dbQuery;
  }

  const results = await dbQuery;

  // Get total count for pagination
  let countQuery = db.select({ count: sql<number>`COUNT(*)` }).from(adminAuditLogs);
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions)) as typeof countQuery;
  }
  const countResult = await countQuery;
  const total = countResult[0]?.count || 0;

  return {
    logs: results,
    total,
    limit: query.limit || 100,
    offset: query.offset || 0,
  };
}

/**
 * Get summary statistics for audit logs
 */
export async function getAuditLogStats(startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  
  if (startDate) {
    const startStr = startDate.toISOString().slice(0, 19).replace("T", " ");
    conditions.push(gte(adminAuditLogs.createdAt, startStr));
  }
  
  if (endDate) {
    const endStr = endDate.toISOString().slice(0, 19).replace("T", " ");
    conditions.push(lte(adminAuditLogs.createdAt, endStr));
  }

  // Get action counts
  let actionQuery = db
    .select({
      action: adminAuditLogs.action,
      count: sql<number>`COUNT(*)`,
    })
    .from(adminAuditLogs)
    .groupBy(adminAuditLogs.action);

  if (conditions.length > 0) {
    actionQuery = actionQuery.where(and(...conditions)) as typeof actionQuery;
  }

  const actionCounts = await actionQuery;

  // Get resource counts
  let resourceQuery = db
    .select({
      resource: adminAuditLogs.resource,
      count: sql<number>`COUNT(*)`,
    })
    .from(adminAuditLogs)
    .groupBy(adminAuditLogs.resource);

  if (conditions.length > 0) {
    resourceQuery = resourceQuery.where(and(...conditions)) as typeof resourceQuery;
  }

  const resourceCounts = await resourceQuery;

  // Get status counts
  let statusQuery = db
    .select({
      status: adminAuditLogs.status,
      count: sql<number>`COUNT(*)`,
    })
    .from(adminAuditLogs)
    .groupBy(adminAuditLogs.status);

  if (conditions.length > 0) {
    statusQuery = statusQuery.where(and(...conditions)) as typeof statusQuery;
  }

  const statusCounts = await statusQuery;

  // Get admin activity counts
  let adminQuery = db
    .select({
      adminId: adminAuditLogs.adminId,
      adminName: adminAuditLogs.adminName,
      adminEmail: adminAuditLogs.adminEmail,
      count: sql<number>`COUNT(*)`,
    })
    .from(adminAuditLogs)
    .groupBy(adminAuditLogs.adminId, adminAuditLogs.adminName, adminAuditLogs.adminEmail)
    .orderBy(sql`COUNT(*) DESC`)
    .limit(10);

  if (conditions.length > 0) {
    adminQuery = adminQuery.where(and(...conditions)) as typeof adminQuery;
  }

  const adminActivity = await adminQuery;

  return {
    byAction: actionCounts,
    byResource: resourceCounts,
    byStatus: statusCounts,
    topAdmins: adminActivity,
  };
}

/**
 * Common action types for consistency
 */
export const AuditActions = {
  // User management
  USER_VIEW: "user.view",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",
  USER_ROLE_CHANGE: "user.role_change",
  
  // KYC management
  KYC_VIEW: "kyc.view",
  KYC_APPROVE: "kyc.approve",
  KYC_REJECT: "kyc.reject",
  
  // Listing management
  LISTING_VIEW: "listing.view",
  LISTING_UPDATE: "listing.update",
  LISTING_DELETE: "listing.delete",
  LISTING_APPROVE: "listing.approve",
  LISTING_REJECT: "listing.reject",
  LISTING_FEATURE: "listing.feature",
  
  // Deal management
  DEAL_VIEW: "deal.view",
  DEAL_UPDATE: "deal.update",
  
  // Escrow management
  ESCROW_VIEW: "escrow.view",
  ESCROW_UPDATE: "escrow.update",
  
  // Settings management
  SETTINGS_VIEW: "settings.view",
  SETTINGS_UPDATE: "settings.update",
  
  // Commission management
  COMMISSION_VIEW: "commission.view",
  COMMISSION_APPROVE: "commission.approve",
  COMMISSION_PAY: "commission.pay",
  
  // Verification management
  VERIFICATION_VIEW: "verification.view",
  VERIFICATION_APPROVE: "verification.approve",
  VERIFICATION_REJECT: "verification.reject",
  
  // System actions
  SYSTEM_EXPORT: "system.export",
  SYSTEM_IMPORT: "system.import",
} as const;

/**
 * Common resource types for consistency
 */
export const AuditResources = {
  USER: "user",
  LISTING: "listing",
  DEAL: "deal",
  ESCROW: "escrow",
  KYC: "kyc",
  SETTINGS: "settings",
  COMMISSION: "commission",
  VERIFICATION: "verification",
  SYSTEM: "system",
} as const;
