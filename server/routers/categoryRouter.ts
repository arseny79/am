import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { listingCategories } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const categoryRouter = router({
  /** Public: list all active categories, grouped */
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const rows = await db
      .select()
      .from(listingCategories)
      .where(eq(listingCategories.isActive, 1))
      .orderBy(asc(listingCategories.sortOrder), asc(listingCategories.label));
    return rows;
  }),

  /** Admin: list all categories (including inactive) */
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const rows = await db
      .select()
      .from(listingCategories)
      .orderBy(asc(listingCategories.sortOrder), asc(listingCategories.label));
    return rows;
  }),

  /** Admin: create a new category */
  create: adminProcedure
    .input(z.object({
      group: z.string().min(1).max(100),
      label: z.string().min(1).max(100),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
      sortOrder: z.number().int().default(0),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.insert(listingCategories).values({
        group: input.group,
        label: input.label,
        slug: input.slug,
        sortOrder: input.sortOrder,
        isActive: 1,
      });
      return { success: true };
    }),

  /** Admin: update a category */
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      group: z.string().min(1).max(100).optional(),
      label: z.string().min(1).max(100).optional(),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
      sortOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { id, isActive, ...rest } = input;
      const updates: Record<string, unknown> = { ...rest };
      if (isActive !== undefined) updates.isActive = isActive ? 1 : 0;
      if (Object.keys(updates).length === 0) return { success: true };
      await db
        .update(listingCategories)
        .set(updates as Partial<typeof listingCategories.$inferInsert>)
        .where(eq(listingCategories.id, id));
      return { success: true };
    }),

  /** Admin: delete (hard delete — only safe if no listings reference it) */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(listingCategories).where(eq(listingCategories.id, input.id));
      return { success: true };
    }),
});
