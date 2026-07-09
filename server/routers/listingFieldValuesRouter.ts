import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";

export const listingFieldValuesRouter = router({
  // List active field definitions for a given asset type (seller sees this when building the form)
  listDefinitionsForAssetType: publicProcedure
    .input(z.object({
      assetTypeId: z.number(),
      subcategoryId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      return db.getFieldDefinitions({
        assetTypeId: input.assetTypeId,
        ...(input.subcategoryId !== undefined ? { subcategoryId: input.subcategoryId } : {}),
        activeOnly: true,
      });
    }),

  // Get all saved dynamic values for a listing
  getForListing: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      // Sellers can see their own listing's values; admins can see all
      if (listing.sellerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return db.getListingFieldValues(input.listingId);
    }),

  // Save (upsert) dynamic field values for a listing
  saveValues: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      values: z.array(z.object({
        fieldDefinitionId: z.number(),
        value: z.string().nullable(),
      })).max(200),
    }))
    .mutation(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND" });
      if (listing.sellerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await db.upsertListingFieldValues(input.listingId, input.values);
      return { success: true };
    }),
});
