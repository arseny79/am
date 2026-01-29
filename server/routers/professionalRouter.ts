import { z } from "zod";
import { eq, and, or, like, desc, asc, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { dateToTimestamp, nowTimestamp, boolToInt } from "../lib/dbHelpers";
import { professionals, dealProfessionals, professionalReviews, professionalCredentials } from "../../drizzle/schema";
import { sendCredentialVerifiedEmail, sendCredentialRejectedEmail } from "../emailNotifications";

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
        conditions.push(eq(professionals.verified, input.verified ? 1 : 0));
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
      website: z.string().url().max(500).optional().or(z.literal('').transform(() => undefined)),
      type: z.enum(professionalTypes),
      profilePhotoUrl: z.string().url().max(500).optional().or(z.literal('').transform(() => undefined)),
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
        profilePhotoUrl: input.profilePhotoUrl || null,
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
      website: z.string().url().max(500).optional().or(z.literal('').transform(() => undefined)),
      type: z.enum(professionalTypes).optional(),
      profilePhotoUrl: z.string().url().max(500).optional().or(z.literal('').transform(() => undefined)),
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
      status: z.enum(["pending", "active", "suspended", "rejected"]).optional(),
      type: z.enum(professionalTypes).optional(),
      search: z.string().optional(),
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
      if (input.type) {
        conditions.push(eq(professionals.type, input.type));
      }
      if (input.search) {
        conditions.push(
          or(
            like(professionals.name, `%${input.search}%`),
            like(professionals.companyName, `%${input.search}%`),
            like(professionals.email, `%${input.search}%`)
          )!
        );
      }

      const query = conditions.length > 0
        ? db.select().from(professionals).where(and(...conditions))
        : db.select().from(professionals);

      const results = await query
        .orderBy(desc(professionals.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return { professionals: results };
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

  // Admin: Reject professional
  adminReject: protectedProcedure
    .input(z.object({ id: z.number(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(professionals)
        .set({ status: "rejected" })
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

  // Admin: Reactivate professional
  adminReactivate: protectedProcedure
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
        .set({ verified: 1, verifiedAt: nowTimestamp() })
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
          tierExpiresAt: input.expiresAt ? dateToTimestamp(input.expiresAt) : null,
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

    // Get status breakdown
    const statusStats = await db
      .select({
        pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
        active: sql<number>`SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)`,
        suspended: sql<number>`SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END)`,
        rejected: sql<number>`SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)`,
      })
      .from(professionals);

    // Get tier breakdown
    const tierStats = await db
      .select({
        basic: sql<number>`SUM(CASE WHEN tier = 'basic' THEN 1 ELSE 0 END)`,
        professional: sql<number>`SUM(CASE WHEN tier = 'professional' THEN 1 ELSE 0 END)`,
        premium: sql<number>`SUM(CASE WHEN tier = 'premium' THEN 1 ELSE 0 END)`,
      })
      .from(professionals);

    return {
      ...stats[0],
      byStatus: statusStats[0],
      byTier: tierStats[0],
    };
  }),

  // Get reviews for a professional
  getReviews: publicProcedure
    .input(z.object({
      professionalId: z.number(),
      limit: z.number().min(1).max(50).default(10),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const reviews = await db
        .select()
        .from(professionalReviews)
        .where(and(
          eq(professionalReviews.professionalId, input.professionalId),
          eq(professionalReviews.status, "approved")
        ))
        .orderBy(desc(professionalReviews.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Get average rating
      const ratingResult = await db
        .select({
          avgRating: sql<number>`AVG(rating)`,
          totalReviews: sql<number>`COUNT(*)`,
        })
        .from(professionalReviews)
        .where(and(
          eq(professionalReviews.professionalId, input.professionalId),
          eq(professionalReviews.status, "approved")
        ));

      return {
        reviews,
        averageRating: ratingResult[0]?.avgRating || 0,
        totalReviews: ratingResult[0]?.totalReviews || 0,
      };
    }),

  // Submit a review (must have worked with professional on a deal)
  submitReview: protectedProcedure
    .input(z.object({
      professionalId: z.number(),
      dealId: z.number().optional(),
      rating: z.number().min(1).max(5),
      review: z.string().min(10).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check if user has worked with this professional on a deal
      const workedTogether = await db
        .select()
        .from(dealProfessionals)
        .where(and(
          eq(dealProfessionals.professionalId, input.professionalId),
          eq(dealProfessionals.status, "accepted")
        ))
        .limit(1);

      // For now, allow reviews even without deal verification (can be tightened later)
      // if (workedTogether.length === 0) {
      //   throw new TRPCError({ code: "FORBIDDEN", message: "You can only review professionals you've worked with" });
      // }

      // Check if user already reviewed this professional
      const existingReview = await db
        .select()
        .from(professionalReviews)
        .where(and(
          eq(professionalReviews.professionalId, input.professionalId),
          eq(professionalReviews.reviewerId, ctx.user.id)
        ))
        .limit(1);

      if (existingReview.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You have already reviewed this professional" });
      }

      await db.insert(professionalReviews).values({
        professionalId: input.professionalId,
        reviewerId: ctx.user.id,
        dealId: input.dealId || null,
        rating: input.rating,
        review: input.review,
        status: "pending", // Reviews need admin approval
      });

      return { success: true, message: "Review submitted for approval" };
    }),

  // Admin: List pending reviews
  adminListReviews: protectedProcedure
    .input(z.object({
      status: z.enum(["pending", "approved", "rejected"]).optional(),
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
        conditions.push(eq(professionalReviews.status, input.status));
      }

      const query = conditions.length > 0
        ? db.select().from(professionalReviews).where(and(...conditions))
        : db.select().from(professionalReviews);

      const reviews = await query
        .orderBy(desc(professionalReviews.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return { reviews };
    }),

  // Admin: Approve/reject review
  adminModerateReview: protectedProcedure
    .input(z.object({
      reviewId: z.number(),
      status: z.enum(["approved", "rejected"]),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(professionalReviews)
        .set({ status: input.status })
        .where(eq(professionalReviews.id, input.reviewId));

      return { success: true };
    }),

  // Credential Management
  // Upload credential
  uploadCredential: protectedProcedure
    .input(z.object({
      credentialType: z.enum(["license", "certification", "degree", "insurance", "other"]),
      title: z.string().min(1).max(255),
      issuingOrganization: z.string().max(255).optional(),
      issueDate: z.date().optional(),
      expiryDate: z.date().optional(),
      credentialNumber: z.string().max(100).optional(),
      fileUrl: z.string().url().max(500),
      fileName: z.string().min(1).max(255),
      fileSize: z.number().optional(),
      mimeType: z.string().max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get user's professional profile
      const professional = await db
        .select()
        .from(professionals)
        .where(eq(professionals.userId, ctx.user.id))
        .limit(1);

      if (!professional[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Professional profile not found" });
      }

      const result = await db.insert(professionalCredentials).values({
        professionalId: professional[0].id,
        credentialType: input.credentialType,
        title: input.title,
        issuingOrganization: input.issuingOrganization || null,
        issueDate: input.issueDate ? dateToTimestamp(input.issueDate) : null,
        expiryDate: input.expiryDate ? dateToTimestamp(input.expiryDate) : null,
        credentialNumber: input.credentialNumber || null,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileSize: input.fileSize || null,
        mimeType: input.mimeType || null,
        verificationStatus: "pending",
      });

      return { id: result[0].insertId, message: "Credential uploaded successfully" };
    }),

  // Get my credentials
  getMyCredentials: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get user's professional profile
      const professional = await db
        .select()
        .from(professionals)
        .where(eq(professionals.userId, ctx.user.id))
        .limit(1);

      if (!professional[0]) {
        return [];
      }

      const credentials = await db
        .select()
        .from(professionalCredentials)
        .where(eq(professionalCredentials.professionalId, professional[0].id))
        .orderBy(desc(professionalCredentials.createdAt));

      return credentials;
    }),

  // Delete credential
  deleteCredential: protectedProcedure
    .input(z.object({
      credentialId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Get user's professional profile
      const professional = await db
        .select()
        .from(professionals)
        .where(eq(professionals.userId, ctx.user.id))
        .limit(1);

      if (!professional[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Professional profile not found" });
      }

      // Verify ownership
      const credential = await db
        .select()
        .from(professionalCredentials)
        .where(eq(professionalCredentials.id, input.credentialId))
        .limit(1);

      if (!credential[0] || credential[0].professionalId !== professional[0].id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized to delete this credential" });
      }

      await db.delete(professionalCredentials).where(eq(professionalCredentials.id, input.credentialId));

      return { success: true };
    }),

  // Admin: Get all pending credentials
  adminGetPendingCredentials: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const credentials = await db
        .select({
          credential: professionalCredentials,
          professional: professionals,
        })
        .from(professionalCredentials)
        .leftJoin(professionals, eq(professionalCredentials.professionalId, professionals.id))
        .where(eq(professionalCredentials.verificationStatus, "pending"))
        .orderBy(desc(professionalCredentials.createdAt));

      return credentials;
    }),

  // Admin: Verify credential
  adminVerifyCredential: protectedProcedure
    .input(z.object({
      credentialId: z.number(),
      status: z.enum(["verified", "rejected"]),
      rejectionReason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      await db
        .update(professionalCredentials)
        .set({
          verificationStatus: input.status,
          verifiedAt: input.status === "verified" ? nowTimestamp() : null,
          verifiedBy: input.status === "verified" ? ctx.user.id : null,
          rejectionReason: input.rejectionReason || null,
        })
        .where(eq(professionalCredentials.id, input.credentialId));

      // Get credential and professional details for email
      const credentialWithProfessional = await db
        .select({
          credential: professionalCredentials,
          professional: professionals,
        })
        .from(professionalCredentials)
        .leftJoin(professionals, eq(professionalCredentials.professionalId, professionals.id))
        .where(eq(professionalCredentials.id, input.credentialId))
        .limit(1);

      if (!credentialWithProfessional[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Credential not found" });
      }

      const { credential, professional } = credentialWithProfessional[0];

      if (!professional) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Professional not found" });
      }

      // Send email notification
      if (input.status === "verified") {
        await sendCredentialVerifiedEmail({
          email: professional.email!,
          name: professional.name,
          credentialTitle: credential.title,
          credentialType: credential.credentialType,
        });
      } else if (input.status === "rejected" && input.rejectionReason) {
        await sendCredentialRejectedEmail({
          email: professional.email!,
          name: professional.name,
          credentialTitle: credential.title,
          credentialType: credential.credentialType,
          rejectionReason: input.rejectionReason,
        });
      }

      // If all credentials are verified, mark professional as verified
      if (input.status === "verified") {
        const allCredentials = await db
          .select()
          .from(professionalCredentials)
          .where(eq(professionalCredentials.professionalId, credential.professionalId));

        const allVerified = allCredentials.every(c => c.verificationStatus === "verified");

        if (allVerified && allCredentials.length > 0) {
          await db
            .update(professionals)
            .set({
              verified: 1,
              verifiedAt: nowTimestamp(),
            })
            .where(eq(professionals.id, credential.professionalId));
        }
      }

      return { success: true };
    }),
});

export type ProfessionalRouter = typeof professionalRouter;
