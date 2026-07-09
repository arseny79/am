import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

const fieldTypeEnum = z.enum([
  'text', 'textarea', 'number', 'currency', 'percentage', 'url',
  'dropdown', 'multi_select', 'boolean', 'date', 'wallet_address', 'contract_address',
]);

export const adminFieldDefinitionsRouter = router({
  list: adminProcedure
    .input(z.object({
      verticalId: z.number().optional(),
      assetTypeId: z.number().optional(),
      subcategoryId: z.number().optional(),
      activeOnly: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      return db.getFieldDefinitions(input);
    }),

  create: adminProcedure
    .input(z.object({
      verticalId: z.number().nullable().optional(),
      assetTypeId: z.number().nullable().optional(),
      subcategoryId: z.number().nullable().optional(),
      fieldKey: z.string().min(1).max(100),
      label: z.string().min(1).max(255),
      description: z.string().optional(),
      helpText: z.string().optional(),
      fieldType: fieldTypeEnum,
      required: z.number().min(0).max(1).optional(),
      options: z.string().optional(), // JSON array string
      sortOrder: z.number().optional(),
      isPublic: z.number().min(0).max(1).optional(),
      showOnCard: z.number().min(0).max(1).optional(),
      filterable: z.number().min(0).max(1).optional(),
      sortable: z.number().min(0).max(1).optional(),
      isActive: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const id = await db.createFieldDefinition(input);
      return { success: true, id };
    }),

  update: adminProcedure
    .input(z.object({
      id: z.number(),
      verticalId: z.number().nullable().optional(),
      assetTypeId: z.number().nullable().optional(),
      subcategoryId: z.number().nullable().optional(),
      fieldKey: z.string().min(1).max(100).optional(),
      label: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      helpText: z.string().optional(),
      fieldType: fieldTypeEnum.optional(),
      required: z.number().min(0).max(1).optional(),
      options: z.string().optional(),
      sortOrder: z.number().optional(),
      isPublic: z.number().min(0).max(1).optional(),
      showOnCard: z.number().min(0).max(1).optional(),
      filterable: z.number().min(0).max(1).optional(),
      sortable: z.number().min(0).max(1).optional(),
      isActive: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await db.updateFieldDefinition(id, data);
      return { success: true };
    }),

  deactivate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deactivateFieldDefinition(input.id);
      return { success: true };
    }),
});
