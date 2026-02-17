import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { eq, and, like, or, sql } from "drizzle-orm";
import { buyerRequests, users } from "../../drizzle/schema";
import { dateToTimestamp } from "../lib/dbHelpers";

export const adminBuyerRequestsRouter = router({
  // Get all buyer requests with filtering, search, and pagination
  getAll: adminProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(20),
      status: z.enum(["all", "pending", "published", "unpublished", "expired"]).default("all"),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const offset = (input.page - 1) * input.pageSize;

      // Build where conditions
      const conditions: any[] = [];

      // Status filtering
      if (input.status !== "all") {
        if (input.status === "expired") {
          // Expired: published but past expiration date
          conditions.push(
            sql`status = 'published' AND expiresAt < NOW()`
          );
        } else {
          conditions.push(sql`status = ${input.status}`);
        }
      }

      // Search filtering
      if (input.search) {
        const searchPattern = `%${input.search}%`;
        conditions.push(
          or(
            like(buyerRequests.title, searchPattern),
            like(buyerRequests.description, searchPattern)
          )
        );
      }

      // Combine conditions
      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const countResult = await database
        .select({ count: sql<number>`COUNT(*)` })
        .from(buyerRequests)
        .where(whereClause);
      const total = Number(countResult[0]?.count || 0);

      // Get paginated results with user info
      const results = await database
        .select({
          id: buyerRequests.id,
          buyerId: buyerRequests.buyerId,
          title: buyerRequests.title,
          description: buyerRequests.description,
          targetRevenue: buyerRequests.targetRevenue,
          minRevenue: buyerRequests.minRevenue,
          maxRevenue: buyerRequests.maxRevenue,
          targetEbitda: buyerRequests.targetEbitda,
          minEbitda: buyerRequests.minEbitda,
          maxEbitda: buyerRequests.maxEbitda,
          preferredLocations: buyerRequests.preferredLocations,
          requiredServiceMix: buyerRequests.requiredServiceMix,
          budget: buyerRequests.budget,
          timeline: buyerRequests.timeline,
          additionalRequirements: buyerRequests.additionalRequirements,
          status: buyerRequests.status,
          isPublic: buyerRequests.isPublic,
          isAnonymous: buyerRequests.isAnonymous,
          createdAt: buyerRequests.createdAt,
          updatedAt: buyerRequests.updatedAt,
          publishedAt: buyerRequests.publishedAt,
          expiresAt: buyerRequests.expiresAt,
          buyerName: users.name,
          buyerEmail: users.email,
          buyerPhone: users.phoneNumber,
        })
        .from(buyerRequests)
        .leftJoin(users, eq(buyerRequests.buyerId, users.id))
        .where(whereClause)
        .orderBy(sql`${buyerRequests.createdAt} DESC`)
        .limit(input.pageSize)
        .offset(offset);

      return {
        requests: results,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  // Get single buyer request by ID
  getById: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const results = await database
        .select({
          id: buyerRequests.id,
          buyerId: buyerRequests.buyerId,
          title: buyerRequests.title,
          description: buyerRequests.description,
          targetRevenue: buyerRequests.targetRevenue,
          minRevenue: buyerRequests.minRevenue,
          maxRevenue: buyerRequests.maxRevenue,
          targetEbitda: buyerRequests.targetEbitda,
          minEbitda: buyerRequests.minEbitda,
          maxEbitda: buyerRequests.maxEbitda,
          preferredLocations: buyerRequests.preferredLocations,
          requiredServiceMix: buyerRequests.requiredServiceMix,
          budget: buyerRequests.budget,
          timeline: buyerRequests.timeline,
          additionalRequirements: buyerRequests.additionalRequirements,
          status: buyerRequests.status,
          isPublic: buyerRequests.isPublic,
          isAnonymous: buyerRequests.isAnonymous,
          createdAt: buyerRequests.createdAt,
          updatedAt: buyerRequests.updatedAt,
          publishedAt: buyerRequests.publishedAt,
          expiresAt: buyerRequests.expiresAt,
          buyerName: users.name,
          buyerEmail: users.email,
          buyerPhone: users.phoneNumber,
          buyerCompany: users.companyName,
          buyerLocation: users.location,
        })
        .from(buyerRequests)
        .leftJoin(users, eq(buyerRequests.buyerId, users.id))
        .where(eq(buyerRequests.id, input.id))
        .limit(1);

      if (!results[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buyer request not found" });
      }

      return results[0];
    }),

  // Publish a buyer request (sets publishedAt and expiresAt)
  publish: adminProcedure
    .input(z.object({
      id: z.number(),
      expirationDays: z.number().min(1).max(365).default(30),
    }))
    .mutation(async ({ input }) => {
      const request = await db.getBuyerRequestById(input.id);
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buyer request not found" });
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + input.expirationDays);

      await db.updateBuyerRequest(input.id, {
        status: "published",
        publishedAt: dateToTimestamp(now),
        expiresAt: dateToTimestamp(expiresAt),
      });

      return { success: true, publishedAt: now, expiresAt };
    }),

  // Unpublish a buyer request
  unpublish: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const request = await db.getBuyerRequestById(input.id);
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buyer request not found" });
      }
      if (request.status !== "published") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Request must be published to unpublish" });
      }
      await db.updateBuyerRequest(input.id, {
        status: "unpublished",
      });
      return { success: true };
    }),

  // Delete a buyer request (hard delete)
  delete: adminProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const request = await db.getBuyerRequestById(input.id);
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buyer request not found" });
      }

      await db.deleteBuyerRequest(input.id);
      return { success: true };
    }),

  // Update expiration date
    updateExpiration: adminProcedure
    .input(z.object({
      id: z.number(),
      expirationDays: z.number().min(1).max(365),
    }))
    .mutation(async ({ input }) => {
      const request = await db.getBuyerRequestById(input.id);
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Buyer request not found" });
      }
      if (request.status !== "published") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Request must be published to update expiration" });
      }
      const expiresAt = new Date(Date.now() + input.expirationDays * 24 * 60 * 60 * 1000);
      await db.updateBuyerRequest(input.id, {
        expiresAt: dateToTimestamp(expiresAt),
      });
      return { success: true, expiresAt };
    }),
});
