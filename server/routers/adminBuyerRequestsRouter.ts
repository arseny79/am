import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { buyerRequests, users } from "../../drizzle/schema";
import { eq, like, or, and, desc, sql } from "drizzle-orm";
import { calculateSpamScore, shouldAutoFlag } from "../lib/spamDetection";

export const adminBuyerRequestsRouter = router({
  // Get all buyer requests with filtering and pagination
  getAll: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        status: z.enum(["all", "active", "flagged", "withdrawn"]).default("all"),
        spamLevel: z.enum(["all", "low", "medium", "high"]).default("all"),
        search: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const offset = (input.page - 1) * input.pageSize;

      // Build where conditions
      const conditions = [];

      // Status filter
      if (input.status === "active") {
        conditions.push(eq(buyerRequests.status, "active"));
      } else if (input.status === "withdrawn") {
        conditions.push(eq(buyerRequests.status, "withdrawn"));
      } else if (input.status === "flagged") {
        conditions.push(sql`${buyerRequests.flaggedAt} IS NOT NULL`);
      }

      // Spam level filter
      if (input.spamLevel === "low") {
        conditions.push(sql`${buyerRequests.spamScore} <= 30`);
      } else if (input.spamLevel === "medium") {
        conditions.push(sql`${buyerRequests.spamScore} > 30 AND ${buyerRequests.spamScore} <= 70`);
      } else if (input.spamLevel === "high") {
        conditions.push(sql`${buyerRequests.spamScore} > 70`);
      }

      // Search filter
      if (input.search) {
        const searchTerm = `%${input.search}%`;
        conditions.push(
          or(
            like(buyerRequests.title, searchTerm),
            like(buyerRequests.description, searchTerm),
            like(users.name, searchTerm),
            like(users.email, searchTerm)
          )!
        );
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get requests with user info
      const requests = await database
        .select({
          id: buyerRequests.id,
          buyerId: buyerRequests.buyerId,
          title: buyerRequests.title,
          description: buyerRequests.description,
          status: buyerRequests.status,
          spamScore: buyerRequests.spamScore,
          spamFactors: buyerRequests.spamFactors,
          flaggedAt: buyerRequests.flaggedAt,
          createdAt: buyerRequests.createdAt,
          updatedAt: buyerRequests.updatedAt,
          minRevenue: buyerRequests.minRevenue,
          maxRevenue: buyerRequests.maxRevenue,
          budget: buyerRequests.budget,
          timeline: buyerRequests.timeline,
          preferredLocations: buyerRequests.preferredLocations,
          isPublic: buyerRequests.isPublic,
          isAnonymous: buyerRequests.isAnonymous,
          buyerName: users.name,
          buyerEmail: users.email,
          buyerCompanyName: users.companyName,
        })
        .from(buyerRequests)
        .leftJoin(users, eq(buyerRequests.buyerId, users.id))
        .where(whereClause)
        .orderBy(desc(buyerRequests.createdAt))
        .limit(input.pageSize)
        .offset(offset);

      // Get total count
      const [{ count }] = await database
        .select({ count: sql<number>`count(*)` })
        .from(buyerRequests)
        .leftJoin(users, eq(buyerRequests.buyerId, users.id))
        .where(whereClause);

      return {
        requests,
        total: Number(count),
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(Number(count) / input.pageSize),
      };
    }),

  // Update buyer request (admin can edit any field)
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(10).max(200).optional(),
        description: z.string().min(50).max(1000).optional(),
        status: z.enum(["active", "fulfilled", "expired", "withdrawn"]).optional(),
        minRevenue: z.number().optional(),
        maxRevenue: z.number().optional(),
        budget: z.number().optional(),
        timeline: z.string().optional(),
        preferredLocations: z.string().optional(),
        isPublic: z.boolean().optional(),
        isAnonymous: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, isPublic, isAnonymous, ...data } = input;

      await db.updateBuyerRequest(id, {
        ...data,
        ...(isPublic !== undefined && { isPublic: isPublic ? 1 : 0 }),
        ...(isAnonymous !== undefined && { isAnonymous: isAnonymous ? 1 : 0 }),
      });

      return { success: true };
    }),

  // Bulk delete (withdraw) buyer requests
  bulkDelete: adminProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      for (const id of input.ids) {
        await db.updateBuyerRequest(id, { status: "withdrawn" });
      }

      return { success: true, count: input.ids.length };
    }),

  // Bulk flag buyer requests
  bulkFlag: adminProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const now = new Date().toISOString();

      for (const id of input.ids) {
        await db.updateBuyerRequest(id, { flaggedAt: now });
      }

      return { success: true, count: input.ids.length };
    }),

  // Bulk unflag buyer requests
  bulkUnflag: adminProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
      })
    )
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      for (const id of input.ids) {
        await db.updateBuyerRequest(id, { flaggedAt: null });
      }

      return { success: true, count: input.ids.length };
    }),

  // Recalculate spam score for a request
  recalculateSpamScore: adminProcedure
    .input(
      z.object({
        id: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const request = await db.getBuyerRequestById(input.id);
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Request not found" });
      }

      const database = await db.getDb();
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get user info (optional - use defaults if not found)
      const [user] = await database.select().from(users).where(eq(users.id, request.buyerId)).limit(1);

      const spamResult = calculateSpamScore({
        title: request.title,
        description: request.description,
        email: user?.email || "unknown@example.com",
        userName: user?.name || null,
        userCompanyName: user?.companyName || null,
        userPhoneNumber: user?.phoneNumber || null,
        userLocation: user?.location || null,
      });

      const updates: any = {
        spamScore: spamResult.score,
        spamFactors: JSON.stringify(spamResult.factors),
      };

      // Auto-flag if score is high
      if (shouldAutoFlag(spamResult.score) && !request.flaggedAt) {
        updates.flaggedAt = new Date().toISOString();
      }

      await db.updateBuyerRequest(input.id, updates);

      return {
        success: true,
        spamScore: spamResult.score,
        autoFlagged: shouldAutoFlag(spamResult.score),
      };
    }),
});
