import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const adminTaxonomyRouter = router({
  // Verticals
  createVertical: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createVertical(input);
      return { success: true, id };
    }),

  updateVertical: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateVertical(id, data);
      return { success: true };
    }),

  deleteVertical: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteVertical(input.id);
      return { success: true };
    }),

  // Asset Types
  createAssetType: adminProcedure
    .input(z.object({
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createAssetType(input);
      return { success: true, id };
    }),

  updateAssetType: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional(),
      icon: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateAssetType(id, data);
      return { success: true };
    }),

  deleteAssetType: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteAssetType(input.id);
      return { success: true };
    }),

  // Assign asset type to vertical
  assignAssetType: adminProcedure
    .input(z.object({
      verticalId: z.number(),
      assetTypeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const id = await db.assignAssetTypeToVertical(input);
      return { success: true, id };
    }),

  removeAssetType: adminProcedure
    .input(z.object({
      verticalId: z.number(),
      assetTypeId: z.number(),
    }))
    .mutation(async ({ input }) => {
      await db.removeAssetTypeFromVertical(input.verticalId, input.assetTypeId);
      return { success: true };
    }),

  // Subcategories
  createSubcategory: adminProcedure
    .input(z.object({
      assetTypeId: z.number(),
      name: z.string().min(1),
      slug: z.string().min(1),
      description: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createSubcategory(input);
      return { success: true, id };
    }),

  updateSubcategory: adminProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      slug: z.string().min(1).optional(),
      description: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateSubcategory(id, data);
      return { success: true };
    }),

  deleteSubcategory: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deleteSubcategory(input.id);
      return { success: true };
    }),
});
