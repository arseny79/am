import { router, publicProcedure, superadminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { listingCategories } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

export const categoriesRouter = router({
  /** Public — used by CreateListing form and Marketplace filters */
  list: publicProcedure
    .input(z.object({
      group: z.enum(['business', 'asset']).optional(),
      includeInactive: z.boolean().optional().default(false),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const rows = await db
        .select()
        .from(listingCategories)
        .orderBy(asc(listingCategories.group), asc(listingCategories.displayOrder), asc(listingCategories.name));

      return rows.filter(r => {
        if (!input?.includeInactive && !r.isActive) return false;
        if (input?.group && r.group !== input.group) return false;
        return true;
      });
    }),

  /** Public — get a single category by id */
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(listingCategories).where(eq(listingCategories.id, input.id)).limit(1);
      if (!rows.length) throw new TRPCError({ code: "NOT_FOUND" });
      return rows[0];
    }),

  /** Superadmin — create a new category */
  create: superadminProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens only"),
      group: z.enum(['business', 'asset']),
      description: z.string().optional(),
      displayOrder: z.number().int().optional().default(0),
      relevantMetrics: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Check slug uniqueness
      const existing = await db.select({ id: listingCategories.id })
        .from(listingCategories)
        .where(eq(listingCategories.slug, input.slug))
        .limit(1);
      if (existing.length) {
        throw new TRPCError({ code: "CONFLICT", message: `Slug "${input.slug}" is already in use.` });
      }

      await db.insert(listingCategories).values({
        name: input.name,
        slug: input.slug,
        group: input.group,
        description: input.description ?? null,
        displayOrder: input.displayOrder ?? 0,
        isActive: 1,
        relevantMetrics: input.relevantMetrics ?? null,
      });

      return { success: true };
    }),

  /** Superadmin — update a category (name, group, description, order, active, metrics) */
  update: superadminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(100).optional(),
      group: z.enum(['business', 'asset']).optional(),
      description: z.string().optional(),
      displayOrder: z.number().int().optional(),
      isActive: z.boolean().optional(),
      relevantMetrics: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const { id, ...fields } = input;

      const updateData: Record<string, unknown> = {};
      if (fields.name !== undefined) updateData.name = fields.name;
      if (fields.group !== undefined) updateData.group = fields.group;
      if (fields.description !== undefined) updateData.description = fields.description;
      if (fields.displayOrder !== undefined) updateData.displayOrder = fields.displayOrder;
      if (fields.isActive !== undefined) updateData.isActive = fields.isActive ? 1 : 0;
      if (fields.relevantMetrics !== undefined) updateData.relevantMetrics = fields.relevantMetrics;

      await db.update(listingCategories).set(updateData).where(eq(listingCategories.id, id));
      return { success: true };
    }),

  /** Superadmin — delete a category (only if no listings use it) */
  delete: superadminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Soft-delete by deactivating rather than hard delete to preserve data integrity
      await db.update(listingCategories)
        .set({ isActive: 0 })
        .where(eq(listingCategories.id, input.id));
      return { success: true };
    }),
});
