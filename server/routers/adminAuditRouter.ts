import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { queryAuditLogs, getAuditLogStats, AuditActions, AuditResources } from "../lib/adminAuditService";

/**
 * Admin Audit Log Router
 * 
 * Provides endpoints for viewing and querying admin audit logs.
 * All endpoints require admin authentication.
 */
export const adminAuditRouter = router({
  /**
   * Query audit logs with filters
   */
  getLogs: adminProcedure
    .input(
      z.object({
        adminId: z.number().optional(),
        action: z.string().optional(),
        resource: z.string().optional(),
        status: z.enum(["success", "failure"]).optional(),
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(), // ISO date string
        searchTerm: z.string().optional(),
        limit: z.number().min(1).max(500).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const query = {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
      };

      return queryAuditLogs(query);
    }),

  /**
   * Get audit log statistics
   */
  getStats: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(), // ISO date string
      })
    )
    .query(async ({ input }) => {
      const startDate = input.startDate ? new Date(input.startDate) : undefined;
      const endDate = input.endDate ? new Date(input.endDate) : undefined;

      return getAuditLogStats(startDate, endDate);
    }),

  /**
   * Get available action types for filtering
   */
  getActionTypes: adminProcedure.query(() => {
    return Object.entries(AuditActions).map(([key, value]) => ({
      key,
      value,
      label: key.replace(/_/g, " ").toLowerCase(),
    }));
  }),

  /**
   * Get available resource types for filtering
   */
  getResourceTypes: adminProcedure.query(() => {
    return Object.entries(AuditResources).map(([key, value]) => ({
      key,
      value,
      label: key.toLowerCase(),
    }));
  }),

  /**
   * Export audit logs as CSV
   */
  exportLogs: adminProcedure
    .input(
      z.object({
        adminId: z.number().optional(),
        action: z.string().optional(),
        resource: z.string().optional(),
        status: z.enum(["success", "failure"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        searchTerm: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      // Get all matching logs (up to 10000 for export)
      const query = {
        ...input,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        limit: 10000,
        offset: 0,
      };

      const result = await queryAuditLogs(query);

      // Convert to CSV format
      const headers = [
        "ID",
        "Timestamp",
        "Admin ID",
        "Admin Name",
        "Admin Email",
        "Action",
        "Resource",
        "Resource ID",
        "Status",
        "Details",
        "IP Address",
        "Error Message",
      ];

      const rows = result.logs.map((log) => [
        log.id,
        log.createdAt,
        log.adminId,
        log.adminName || "",
        log.adminEmail || "",
        log.action,
        log.resource,
        log.resourceId || "",
        log.status,
        (log.details || "").replace(/"/g, '""'),
        log.ipAddress || "",
        (log.errorMessage || "").replace(/"/g, '""'),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((cell) => `"${cell}"`).join(",")
        ),
      ].join("\n");

      return {
        csv: csvContent,
        filename: `audit-logs-${new Date().toISOString().split("T")[0]}.csv`,
        totalRecords: result.total,
      };
    }),
});
