import { z } from "zod";
import { eq, and, or, like, desc, asc, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { professionals, dealProfessionals, professionalReviews } from "../../drizzle/schema";

// Professional types
const professionalTypes = ["broker", "lawyer", "accountant", "due_diligence", "valuation", "consultant", "other"] as const;
const professionalTiers = ["basic", "professional", "premium"] as const;

export const professionalRouter = router({
  // List professionals with filters (public)
  list: publicProcedure
    .input(z.object({
      type: z.enum(professionalTypes).optional(),
      location: z.string().optional(),
      tier: z.enum(professionalTiers).optional(),
      verified: z.boolean().optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(50).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [eq(professionals.status, "active")];

      if (input.type) {
        conditions.push(eq(professionals.type, input.type));
      }
      if (input.location) {
        conditions.push(like(professionals.location, `%${input.location}%`));
      }
      if (input.tier) {
        conditions.push(eq(professionals.tier, input.tier));
      }
      if (input.verified !== undefined) {
        conditions.push(eq(professionals.verified, input.verified));
      }
      if (input.search) {
        conditions.push(
          or(
            like(professionals.name, `%${input.search}%`),
            like(professionals.companyName, `%${input.search}%`),
            like(professionals.bio, `%${input.search}%`)
          )!
        );
      }

      // Order by tier (premium first), then verified, then profile views
      const results = await db
        .select()
        .from(professionals)
        .where(and(...conditions))
        .orderBy(
          desc(sql`CASE WHEN ${professionals.tier} = 'premium' THEN 3 WHEN ${professionals.tier} = 'professional' THEN 2 ELSE 1 END`),
          desc(professionals.verified),
          desc(professionals.profileViews)
        )
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(professionals)
        .where(and(...conditions));

      return {
        professionals: results,
        total: countResult[0]?.count || 0,
        hasMore: (input.offset + input.limit) < (countResult[0]?.count || 0),
      };
    }),

  // Get single professional by ID (public)
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const result = await db
        .select()
        .from(professionals)
        .where(eq(professionals.id, input.id))
        .limit(1);

      if (!result[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Professional not found" });
      }

      // Increment view count
      await db
        .update(professionals)
        .set({ profileViews: sql`${professionals.profileViews} + 1` })
        .where(eq(professionals.id, input.id));

      return result[0];
    }),

  // Get my professional profile (if user has one)
  getMyProfile: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const result = await db
      .select()
      .from(professionals)
      .where(eq(professionals.userId, ctx.user.id))
      .limit(1);

    return result[0] || null;
  }),

  // Create professional profile
  create: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(255),
      companyName: z.string().max(255).optional(),
      email: z.string().email().max(320),
      phone: z.string().max(50).optional(),
      website: z.string().url().max(500).optional(),
      type: z.enum(professionalTypes),
      specialties: z.array(z.string()).optional(),
      bio: z.string().max(2000).optional(),
      yearsExperience: z.number().min(0).max(100).optional(),
      dealsCompleted: z.number().min(0).optional(),
      location: z.string().max(255).optional(),
      serviceAreas: z.array(z.string()).optional(),
      feeStructure: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user already has a profile
      const existing = await db
        .select()
        .from(professionals)
        .where(eq(professionals.userId, ctx.user.id))
        .limit(1);

      if (existing[0]) {
        throw new TRPCError({ code: "CONFLICT", message: "You already have a professional profile" });
      }

      const result = await db.insert(professionals).values({
        userId: ctx.user.id,
        name: input.name,
        companyName: input.companyName || null,
        email: input.email,
        phone: input.phone || null,
        website: input.website || null,
        type: input.type,
        specialties: input.specialties || null,
        bio: input.bio || null,
        yearsExperience: input.yearsExperience || null,
        dealsCompleted: input.dealsCompleted || null,
        location: input.location || null,
        serviceAreas: input.serviceAreas || null,
        feeStructure: input.feeStructure || null,
        tier: "basic",
        status: "pending", // Requires admin approval
      });

      return { id: result[0].insertId, message: "Profile created and pending approval" };
    }),

  // Update professional profile
  update: protectedProcedure
    .input(z.object({
      name: z.string().min(2).max(255).optional(),
      companyName: z.string().max(255).optional(),
      email: z.string().email().max(320).optional(),
      phone: z.string().max(50).optional(),
      website: z.string().url().max(500).optional(),
      type: z.enum(professionalTypes).optional(),
      specialties: z.array(z.string()).optional(),
      bio: z.string().max(2000).optional(),
      yearsExperience: z.number().min(0).max(100).optional(),
      dealsCompleted: z.number().min(0).optional(),
      location: z.string().max(255).optional(),
      serviceAreas: z.array(z.string()).optional(),
      feeStructure: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const existing = await db
        .select()
        .from(professionals)
        .where(eq(professionals.userId, ctx.user.id))
        .limit(1);

      if (!existing[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Professional profile not found" });
      }

      await db
        .update(professionals)
        .set({
          ...input,
          specialties: input.specialties || existing[0].specialties,
          serviceAreas: input.serviceAreas || existing[0].serviceAreas,
        })
        .where(eq(professionals.userId, ctx.user.id));

      return { success: true };
    }),

  // Admin: List all professionals (including pending)
  adminList: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "active", "suspended", "inactive"]).optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions = [];

      if (input.status) {
        conditions.push(eq(professionals.status, input.status));
      }

      const query = conditions.length > 0
        ? db.select().from(professionals).where(and(...conditions))
        : db.select().from(professionals);

      const results = await query
        .orderBy(desc(professionals.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  // Admin: Approve professional
  adminApprove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(professionals)
        .set({ status: "active" })
        .where(eq(professionals.id, input.id));

      return { success: true };
    }),

  // Admin: Suspend professional
  adminSuspend: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(professionals)
        .set({ status: "suspended" })
        .where(eq(professionals.id, input.id));

      return { success: true };
    }),

  // Admin: Verify professional
  adminVerify: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(professionals)
        .set({ verified: true, verifiedAt: new Date() })
        .where(eq(professionals.id, input.id));

      return { success: true };
    }),

  // Admin: Update professional tier
  adminUpdateTier: protectedProcedure
    .input(z.object({
      id: z.number(),
      tier: z.enum(professionalTiers),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(professionals)
        .set({
          tier: input.tier,
          tierExpiresAt: input.expiresAt || null,
        })
        .where(eq(professionals.id, input.id));

      return { success: true };
    }),

  // Get directory stats
  getStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const stats = await db
      .select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
        verified: sql<number>`SUM(CASE WHEN verified = true THEN 1 ELSE 0 END)`,
        brokers: sql<number>`SUM(CASE WHEN type = 'broker' THEN 1 ELSE 0 END)`,
        lawyers: sql<number>`SUM(CASE WHEN type = 'lawyer' THEN 1 ELSE 0 END)`,
        accountants: sql<number>`SUM(CASE WHEN type = 'accountant' THEN 1 ELSE 0 END)`,
        dueDiligence: sql<number>`SUM(CASE WHEN type = 'due_diligence' THEN 1 ELSE 0 END)`,
      })
      .from(professionals);

    return stats[0];
  }),
});

export type ProfessionalRouter = typeof professionalRouter;
