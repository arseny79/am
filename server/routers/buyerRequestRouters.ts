import { z } from "zod";
import { protectedProcedure, verifiedProcedure, kycVerifiedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { notifyMatchingSellers } from "../lib/buyerRequestMatching";
import { dateToTimestamp } from "../lib/dbHelpers";

export const buyerRequestRouter = router({
  // Create a new buyer request (requires KYC verification)
  create: kycVerifiedProcedure
    .input(z.object({
      title: z.string().min(10),
      description: z.string().min(50),
      targetRevenue: z.number().optional(),
      minRevenue: z.number().optional(),
      maxRevenue: z.number().optional(),
      targetEbitda: z.number().optional(),
      minEbitda: z.number().optional(),
      maxEbitda: z.number().optional(),
      preferredLocations: z.string().optional(),
      requiredServiceMix: z.string().optional(),
      budget: z.number().optional(),
      timeline: z.string().optional(),
      additionalRequirements: z.string().optional(),
      isPublic: z.boolean().optional(),
      isAnonymous: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const expiresAtDate = new Date();
      expiresAtDate.setMonth(expiresAtDate.getMonth() + 3); // Expire in 3 months

      const request = await db.createBuyerRequest({
        buyerId: ctx.user.id,
        ...input,
        isPublic: input.isPublic ? 1 : 0,
        isAnonymous: input.isAnonymous ? 1 : 0,
        expiresAt: dateToTimestamp(expiresAtDate),
      });

      // Notify sellers with matching listings
      if (input.isPublic !== false) {
        notifyMatchingSellers(request.id).catch((err) =>
          console.error("Failed to notify matching sellers:", err)
        );
      }

      return request;
    }),

  // Get all public buyer requests
  getAll: publicProcedure
    .input(z.object({
      activeOnly: z.boolean().optional().default(true),
    }))
    .query(async ({ input }) => {
      return db.getAllBuyerRequests(input.activeOnly);
    }),

  // Get my buyer requests
  getMy: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getBuyerRequestsByUser(ctx.user.id);
    }),

  // Get buyer request by ID
  getById: publicProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const request = await db.getBuyerRequestById(input.id);
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return request;
    }),

  // Update buyer request
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(10).max(200).optional(),
      description: z.string().min(50).max(1000).optional(),
      targetRevenue: z.number().optional(),
      minRevenue: z.number().optional(),
      maxRevenue: z.number().optional(),
      targetEbitda: z.number().optional(),
      minEbitda: z.number().optional(),
      maxEbitda: z.number().optional(),
      preferredLocations: z.string().optional(),
      requiredServiceMix: z.string().optional(),
      budget: z.number().optional(),
      timeline: z.string().optional(),
      additionalRequirements: z.string().optional(),
      status: z.enum(["active", "fulfilled", "expired", "withdrawn"]).optional(),
      isPublic: z.boolean().optional(),
      isAnonymous: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, isPublic, isAnonymous, ...data } = input;
      const request = await db.getBuyerRequestById(id);

      if (!request || request.buyerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.updateBuyerRequest(id, {
        ...data,
        ...(isPublic !== undefined && { isPublic: isPublic ? 1 : 0 }),
        ...(isAnonymous !== undefined && { isAnonymous: isAnonymous ? 1 : 0 }),
      });

      return { success: true };
    }),

  // Update buyer request status
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "fulfilled", "expired", "withdrawn"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const request = await db.getBuyerRequestById(input.id);

      if (!request || request.buyerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.updateBuyerRequest(input.id, {
        status: input.status,
      });

      const updated = await db.getBuyerRequestById(input.id);
      return updated!;
    }),

  // Delete buyer request (soft delete - sets status to withdrawn)
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const request = await db.getBuyerRequestById(input.id);

      if (!request || request.buyerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.updateBuyerRequest(input.id, { status: "withdrawn" });
      return { success: true };
    }),
});
