import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { categories, categoryPriceStructures } from "../../drizzle/schema";
import { eq, asc } from "drizzle-orm";

const categoryInput = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  type: z.enum(["business", "asset"]),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  priceStructure: z.object({
    feeType: z.enum(["percentage", "fixed"]),
    feeValue: z.string().regex(/^\d+(\.\d{1,4})?$/),
    currency: z.string().length(3).default("USD"),
    premiumUpgradePrice: z.number().int().nullable().optional(),
  }).optional(),
});

export const categoryRouter = router({
  // ── Public ─────────────────────────────────────────────────────────────────

  /** List all active categories (used by listing forms and filters) */
  listActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
      .select()
      .from(categories)
      .where(eq(categories.isActive, 1))
      .orderBy(asc(categories.sortOrder), asc(categories.name));
  }),

  /** List all categories with their price structures (admin use) */
  listAll: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const cats = await db
      .select()
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.name));

    const prices = await db
      .select()
      .from(categoryPriceStructures);

    // Merge price structures into categories
    return cats.map((cat) => ({
      ...cat,
      priceStructure: prices.find((p) => p.categoryId === cat.id) ?? null,
    }));
  }),

  // ── Admin CRUD ─────────────────────────────────────────────────────────────

  create: adminProcedure
    .input(categoryInput)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check slug uniqueness
      const existing = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, input.slug))
        .limit(1);
      if (existing.length > 0) throw new Error("A category with this slug already exists");

      const [result] = await db.insert(categories).values({
        name: input.name,
        slug: input.slug,
        type: input.type,
        description: input.description ?? null,
        isActive: input.isActive ? 1 : 0,
        sortOrder: input.sortOrder,
      });

      const newId = (result as any).insertId as number;

      if (input.priceStructure) {
        await db.insert(categoryPriceStructures).values({
          categoryId: newId,
          feeType: input.priceStructure.feeType,
          feeValue: input.priceStructure.feeValue,
          currency: input.priceStructure.currency,
          premiumUpgradePrice: input.priceStructure.premiumUpgradePrice ?? null,
        });
      }

      return { id: newId };
    }),

  update: adminProcedure
    .input(categoryInput.extend({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check slug uniqueness (excluding self)
      const existing = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, input.slug))
        .limit(1);
      if (existing.length > 0 && existing[0].id !== input.id) {
        throw new Error("A category with this slug already exists");
      }

      await db
        .update(categories)
        .set({
          name: input.name,
          slug: input.slug,
          type: input.type,
          description: input.description ?? null,
          isActive: input.isActive ? 1 : 0,
          sortOrder: input.sortOrder,
        })
        .where(eq(categories.id, input.id));

      if (input.priceStructure) {
        const existingPrice = await db
          .select({ id: categoryPriceStructures.id })
          .from(categoryPriceStructures)
          .where(eq(categoryPriceStructures.categoryId, input.id))
          .limit(1);

        if (existingPrice.length > 0) {
          await db
            .update(categoryPriceStructures)
            .set({
              feeType: input.priceStructure.feeType,
              feeValue: input.priceStructure.feeValue,
              currency: input.priceStructure.currency,
              premiumUpgradePrice: input.priceStructure.premiumUpgradePrice ?? null,
            })
            .where(eq(categoryPriceStructures.categoryId, input.id));
        } else {
          await db.insert(categoryPriceStructures).values({
            categoryId: input.id,
            feeType: input.priceStructure.feeType,
            feeValue: input.priceStructure.feeValue,
            currency: input.priceStructure.currency,
            premiumUpgradePrice: input.priceStructure.premiumUpgradePrice ?? null,
          });
        }
      }

      return { success: true };
    }),

  toggleActive: adminProcedure
    .input(z.object({ id: z.number().int(), isActive: z.boolean() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(categories)
        .set({ isActive: input.isActive ? 1 : 0 })
        .where(eq(categories.id, input.id));

      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Price structures cascade-delete via FK
      await db.delete(categories).where(eq(categories.id, input.id));

      return { success: true };
    }),
});
