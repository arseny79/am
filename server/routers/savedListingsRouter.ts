import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { savedListings, listings } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const savedListingsRouter = router({
  /**
   * Save/bookmark a listing
   */
  save: protectedProcedure
    .input(z.object({
      listingId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if already saved
      const existing = await db
        .select()
        .from(savedListings)
        .where(
          and(
            eq(savedListings.userId, ctx.user.id),
            eq(savedListings.listingId, input.listingId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Listing already saved" });
      }

      // Save the listing
      await db.insert(savedListings).values({
        userId: ctx.user.id,
        listingId: input.listingId,
      });

      return { success: true };
    }),

  /**
   * Unsave/remove bookmark from a listing
   */
  unsave: protectedProcedure
    .input(z.object({
      listingId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .delete(savedListings)
        .where(
          and(
            eq(savedListings.userId, ctx.user.id),
            eq(savedListings.listingId, input.listingId)
          )
        );

      return { success: true };
    }),

  /**
   * Check if a listing is saved by current user
   */
  isSaved: protectedProcedure
    .input(z.object({
      listingId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return false;

      const result = await db
        .select()
        .from(savedListings)
        .where(
          and(
            eq(savedListings.userId, ctx.user.id),
            eq(savedListings.listingId, input.listingId)
          )
        )
        .limit(1);

      return result.length > 0;
    }),

  /**
   * Get all saved listings for current user with full listing details
   */
  getMySavedListings: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return [];

      const result = await db
        .select({
          savedAt: savedListings.savedAt,
          listing: listings,
        })
        .from(savedListings)
        .innerJoin(listings, eq(savedListings.listingId, listings.id))
        .where(eq(savedListings.userId, ctx.user.id))
        .orderBy(desc(savedListings.savedAt));

      return result.map(r => ({
        ...r.listing,
        savedAt: r.savedAt,
      }));
    }),

  /**
   * Get count of users who saved a specific listing (for social proof)
   */
  getSaveCount: protectedProcedure
    .input(z.object({
      listingId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return 0;

      const result = await db
        .select()
        .from(savedListings)
        .where(eq(savedListings.listingId, input.listingId));

      return result.length;
    }),
});
