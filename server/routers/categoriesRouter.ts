import { z } from "zod";
import { adminProcedure, publicProcedure, router, seniorAdminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { listingCategories } from "../../drizzle/schema";
import { eq, isNull, asc } from "drizzle-orm";

export const categoriesRouter = router({
  /** Public: get the full category tree */
  getAll: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const rows = await db
      .select()
      .from(listingCategories)
      .where(eq(listingCategories.isActive, 1))
      .orderBy(asc(listingCategories.displayOrder), asc(listingCategories.name));

    return rows;
  }),

  /** Public: get root-level categories (Businesses, Assets) */
  getRoots: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const rows = await db
      .select()
      .from(listingCategories)
      .where(eq(listingCategories.type, 'root'))
      .orderBy(asc(listingCategories.displayOrder));

    return rows;
  }),

  /** Public: get children of a category by parent id */
  getChildren: publicProcedure
    .input(z.object({ parentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const rows = await db
        .select()
        .from(listingCategories)
        .where(eq(listingCategories.parentId, input.parentId))
        .orderBy(asc(listingCategories.displayOrder), asc(listingCategories.name));

      return rows;
    }),

  /** Admin: create a new category */
  create: seniorAdminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(255),
        type: z.enum(['root', 'business', 'asset']),
        businessType: z.enum(['b2b', 'b2c']).nullable().optional(),
        parentId: z.number().nullable().optional(),
        displayOrder: z.number().optional().default(0),
        description: z.string().nullable().optional(),
        isActive: z.boolean().optional().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(listingCategories).values({
        name: input.name,
        slug: input.slug,
        type: input.type,
        businessType: input.businessType ?? null,
        parentId: input.parentId ?? null,
        displayOrder: input.displayOrder ?? 0,
        description: input.description ?? null,
        isActive: input.isActive ? 1 : 0,
        createdBy: ctx.user.id,
        updatedBy: ctx.user.id,
      });

      return { success: true };
    }),

  /** Admin: update an existing category */
  update: seniorAdminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        slug: z.string().min(1).max(255).optional(),
        type: z.enum(['root', 'business', 'asset']).optional(),
        businessType: z.enum(['b2b', 'b2c']).nullable().optional(),
        parentId: z.number().nullable().optional(),
        displayOrder: z.number().optional(),
        description: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, isActive, ...rest } = input;

      await db
        .update(listingCategories)
        .set({
          ...rest,
          ...(isActive !== undefined ? { isActive: isActive ? 1 : 0 } : {}),
          updatedBy: ctx.user.id,
        })
        .where(eq(listingCategories.id, id));

      return { success: true };
    }),

  /** Admin: soft-delete (deactivate) a category */
  deactivate: seniorAdminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(listingCategories)
        .set({ isActive: 0, updatedBy: ctx.user.id })
        .where(eq(listingCategories.id, input.id));

      return { success: true };
    }),

  /** Admin: reorder categories (batch update displayOrder) */
  reorder: seniorAdminProcedure
    .input(z.array(z.object({ id: z.number(), displayOrder: z.number() })))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await Promise.all(
        input.map(({ id, displayOrder }) =>
          db
            .update(listingCategories)
            .set({ displayOrder, updatedBy: ctx.user.id })
            .where(eq(listingCategories.id, id)),
        ),
      );

      return { success: true };
    }),
});
