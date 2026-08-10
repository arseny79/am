import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

const fieldTypeEnum = z.enum([
  'text', 'textarea', 'number', 'currency', 'percentage', 'url',
  'dropdown', 'multi_select', 'boolean', 'date', 'wallet_address', 'contract_address',
]);

const fieldVisibilityEnum = z.enum([
  'public',
  'registered_users',
  'nda_required',
  'seller_approval_required',
  'admin_only',
]);

const OPTION_TYPES = new Set(['dropdown', 'multi_select']);

function validateOptions(options: string | undefined, fieldType: string) {
  if (!options || options.trim() === '') {
    throw new TRPCError({ code: 'BAD_REQUEST', message: `Options are required for ${fieldType} fields` });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(options);
  } catch {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Options must be valid JSON' });
  }
  if (!Array.isArray(parsed)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Options must be a JSON array' });
  }
  if (parsed.length === 0) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Options array must not be empty' });
  }
}

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
      visibilityLevel: fieldVisibilityEnum.optional(),
      showOnCard: z.number().min(0).max(1).optional(),
      filterable: z.number().min(0).max(1).optional(),
      sortable: z.number().min(0).max(1).optional(),
      isActive: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      if (OPTION_TYPES.has(input.fieldType)) {
        validateOptions(input.options, input.fieldType);
      }

      const scope = {
        verticalId: input.verticalId ?? null,
        assetTypeId: input.assetTypeId ?? null,
        subcategoryId: input.subcategoryId ?? null,
      };
      const collision = await db.checkFieldKeyScope(input.fieldKey, scope);
      if (collision) {
        throw new TRPCError({ code: 'CONFLICT', message: `Field key "${input.fieldKey}" already exists in this scope` });
      }

      const payload = {
        ...input,
        isPublic: input.visibilityLevel ? (input.visibilityLevel === 'public' ? 1 : 0) : input.isPublic,
      };
      const id = await db.createFieldDefinition(payload);
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
      visibilityLevel: fieldVisibilityEnum.optional(),
      showOnCard: z.number().min(0).max(1).optional(),
      filterable: z.number().min(0).max(1).optional(),
      sortable: z.number().min(0).max(1).optional(),
      isActive: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const current = await db.getFieldDefinitionById(id);
      if (!current) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Field definition not found' });
      }

      const finalFieldType = data.fieldType ?? current.fieldType;
      const finalOptions = data.options !== undefined ? data.options : (current.options ?? undefined);

      if (OPTION_TYPES.has(finalFieldType)) {
        validateOptions(finalOptions, finalFieldType);
      }

      const scopeFieldsUpdated =
        data.fieldKey !== undefined ||
        data.verticalId !== undefined ||
        data.assetTypeId !== undefined ||
        data.subcategoryId !== undefined;

      if (scopeFieldsUpdated) {
        const finalKey = data.fieldKey ?? current.fieldKey;
        const scope = {
          verticalId: data.verticalId !== undefined ? (data.verticalId ?? null) : (current.verticalId ?? null),
          assetTypeId: data.assetTypeId !== undefined ? (data.assetTypeId ?? null) : (current.assetTypeId ?? null),
          subcategoryId: data.subcategoryId !== undefined ? (data.subcategoryId ?? null) : (current.subcategoryId ?? null),
        };
        const collision = await db.checkFieldKeyScope(finalKey, scope, id);
        if (collision) {
          throw new TRPCError({ code: 'CONFLICT', message: `Field key "${finalKey}" already exists in this scope` });
        }
      }

      await db.updateFieldDefinition(id, {
        ...data,
        isPublic: data.visibilityLevel ? (data.visibilityLevel === 'public' ? 1 : 0) : data.isPublic,
      });
      return { success: true };
    }),

  deactivate: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.deactivateFieldDefinition(input.id);
      return { success: true };
    }),
});
