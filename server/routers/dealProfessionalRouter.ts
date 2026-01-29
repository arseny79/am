import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { dealProfessionals, professionals, deals } from "../../drizzle/schema";
import { nowTimestamp } from "../lib/dbHelpers";

export const dealProfessionalRouter = router({
  // Invite a professional to a deal
  invite: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      professionalId: z.number(),
      accessLevel: z.enum(["view_only", "participant", "full_access"]).default("view_only"),
      invitationNote: z.string().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify user is part of the deal
      const deal = await db
        .select()
        .from(deals)
        .where(eq(deals.id, input.dealId))
        .limit(1);

      if (!deal[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      const isBuyer = deal[0].buyerId === ctx.user.id;
      const isSeller = deal[0].sellerId === ctx.user.id;

      if (!isBuyer && !isSeller) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not part of this deal" });
      }

      // Check if professional exists and is active
      const professional = await db
        .select()
        .from(professionals)
        .where(eq(professionals.id, input.professionalId))
        .limit(1);

      if (!professional[0] || professional[0].status !== "active") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Professional not found or not active" });
      }

      // Check if already invited
      const existing = await db
        .select()
        .from(dealProfessionals)
        .where(and(
          eq(dealProfessionals.dealId, input.dealId),
          eq(dealProfessionals.professionalId, input.professionalId)
        ))
        .limit(1);

      if (existing[0] && existing[0].status !== "removed") {
        throw new TRPCError({ code: "CONFLICT", message: "Professional already invited to this deal" });
      }

      // Create invitation
      const result = await db.insert(dealProfessionals).values({
        dealId: input.dealId,
        professionalId: input.professionalId,
        invitedBy: ctx.user.id,
        invitedByRole: isBuyer ? "buyer" : "seller",
        accessLevel: input.accessLevel,
        invitationNote: input.invitationNote || null,
        status: "invited",
      });

      // Increment professional's invitation count
      await db
        .update(professionals)
        .set({ dealInvitations: sql`${professionals.dealInvitations} + 1` })
        .where(eq(professionals.id, input.professionalId));

      return { id: result[0].insertId, success: true };
    }),

  // Get professionals for a deal
  listByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify user is part of the deal
      const deal = await db
        .select()
        .from(deals)
        .where(eq(deals.id, input.dealId))
        .limit(1);

      if (!deal[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      const isBuyer = deal[0].buyerId === ctx.user.id;
      const isSeller = deal[0].sellerId === ctx.user.id;
      const isAdmin = ctx.user.role === "admin";

      if (!isBuyer && !isSeller && !isAdmin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not part of this deal" });
      }

      // Get all professionals for this deal with their profile info
      const results = await db
        .select({
          invitation: dealProfessionals,
          professional: professionals,
        })
        .from(dealProfessionals)
        .innerJoin(professionals, eq(dealProfessionals.professionalId, professionals.id))
        .where(eq(dealProfessionals.dealId, input.dealId))
        .orderBy(desc(dealProfessionals.invitedAt));

      return results;
    }),

  // Accept invitation (for professionals)
  accept: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      responseNote: z.string().max(500).optional(),
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
        throw new TRPCError({ code: "NOT_FOUND", message: "You don't have a professional profile" });
      }

      // Find the invitation
      const invitation = await db
        .select()
        .from(dealProfessionals)
        .where(and(
          eq(dealProfessionals.dealId, input.dealId),
          eq(dealProfessionals.professionalId, professional[0].id),
          eq(dealProfessionals.status, "invited")
        ))
        .limit(1);

      if (!invitation[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      await db
        .update(dealProfessionals)
        .set({
          status: "accepted",
          responseNote: input.responseNote || null,
          respondedAt: nowTimestamp(),
        })
        .where(eq(dealProfessionals.id, invitation[0].id));

      return { success: true };
    }),

  // Decline invitation (for professionals)
  decline: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      responseNote: z.string().max(500).optional(),
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
        throw new TRPCError({ code: "NOT_FOUND", message: "You don't have a professional profile" });
      }

      // Find the invitation
      const invitation = await db
        .select()
        .from(dealProfessionals)
        .where(and(
          eq(dealProfessionals.dealId, input.dealId),
          eq(dealProfessionals.professionalId, professional[0].id),
          eq(dealProfessionals.status, "invited")
        ))
        .limit(1);

      if (!invitation[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      await db
        .update(dealProfessionals)
        .set({
          status: "declined",
          responseNote: input.responseNote || null,
          respondedAt: nowTimestamp(),
        })
        .where(eq(dealProfessionals.id, invitation[0].id));

      return { success: true };
    }),

  // Remove professional from deal
  remove: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      professionalId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verify user is part of the deal
      const deal = await db
        .select()
        .from(deals)
        .where(eq(deals.id, input.dealId))
        .limit(1);

      if (!deal[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      const isBuyer = deal[0].buyerId === ctx.user.id;
      const isSeller = deal[0].sellerId === ctx.user.id;

      if (!isBuyer && !isSeller) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not part of this deal" });
      }

      await db
        .update(dealProfessionals)
        .set({
          status: "removed",
          removedAt: nowTimestamp(),
        })
        .where(and(
          eq(dealProfessionals.dealId, input.dealId),
          eq(dealProfessionals.professionalId, input.professionalId)
        ));

      return { success: true };
    }),

  // Get pending invitations for current professional
  getMyInvitations: protectedProcedure.query(async ({ ctx }) => {
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

    // Get pending invitations with deal info
    const results = await db
      .select({
        invitation: dealProfessionals,
        deal: deals,
      })
      .from(dealProfessionals)
      .innerJoin(deals, eq(dealProfessionals.dealId, deals.id))
      .where(and(
        eq(dealProfessionals.professionalId, professional[0].id),
        eq(dealProfessionals.status, "invited")
      ))
      .orderBy(desc(dealProfessionals.invitedAt));

    return results;
  }),
});

export type DealProfessionalRouter = typeof dealProfessionalRouter;
