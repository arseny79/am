import { router, protectedProcedure, publicProcedure, adminProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { ndaTemplates, ndaVariableDefinitions } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { boolToInt } from "../lib/dbHelpers";

/**
 * NDA Template Router
 * 
 * Allows admins to:
 * 1. Upload and manage NDA templates
 * 2. Define variables that can be used in templates
 * 3. View and use templates for deals
 */

// Available NDA variables with their metadata
const AVAILABLE_NDA_VARIABLES = [
  {
    variableName: "buyerName",
    displayName: "Buyer Full Name",
    type: "text" as const,
    description: "Full name of the buyer",
    required: true,
  },
  {
    variableName: "buyerCompanyName",
    displayName: "Buyer Company Name",
    type: "company" as const,
    description: "Name of the buyer's company",
    required: true,
  },
  {
    variableName: "buyerEmail",
    displayName: "Buyer Email",
    type: "email" as const,
    description: "Email address of the buyer",
    required: true,
  },
  {
    variableName: "sellerName",
    displayName: "Seller Full Name",
    type: "text" as const,
    description: "Full name of the seller",
    required: true,
  },
  {
    variableName: "sellerCompanyName",
    displayName: "Seller Company Name",
    type: "company" as const,
    description: "Name of the seller's company",
    required: true,
  },
  {
    variableName: "sellerEmail",
    displayName: "Seller Email",
    type: "email" as const,
    description: "Email address of the seller",
    required: true,
  },
  {
    variableName: "listingName",
    displayName: "Business Name",
    type: "text" as const,
    description: "Name of the business being sold",
    required: true,
  },
  {
    variableName: "listingRevenue",
    displayName: "Annual Revenue",
    type: "number" as const,
    description: "Annual revenue of the business",
    required: false,
  },
  {
    variableName: "listingEBITDA",
    displayName: "EBITDA",
    type: "number" as const,
    description: "EBITDA of the business",
    required: false,
  },
  {
    variableName: "dealId",
    displayName: "Deal ID",
    type: "text" as const,
    description: "Unique identifier for this deal",
    required: true,
  },
  {
    variableName: "currentDate",
    displayName: "Current Date",
    type: "date" as const,
    description: "Today's date (will be auto-filled)",
    required: true,
  },
  {
    variableName: "expirationDate",
    displayName: "NDA Expiration Date",
    type: "date" as const,
    description: "Date when NDA signing window expires",
    required: false,
  },
  {
    variableName: "confidentialityPeriod",
    displayName: "Confidentiality Period",
    type: "text" as const,
    description: "Duration of confidentiality obligations (e.g., '2 years')",
    required: false,
  },
];

export const ndaTemplateRouter = router({
  /**
   * Get all available NDA variables
   */
  getAvailableVariables: protectedProcedure.query(() => {
    return AVAILABLE_NDA_VARIABLES;
  }),

  /**
   * Upload a new NDA template
   */
  uploadTemplate: adminProcedure
    .input(
      z.object({
        name: z.string().min(1, "Template name is required"),
        description: z.string().optional(),
        content: z.string().min(1, "Template content is required"),
        fileUrl: z.string().optional(),
        fileName: z.string().optional(),
        fileMimeType: z.string().optional(),
        isDefault: z.boolean().optional().default(false),
        variables: z.array(
          z.object({
            variableName: z.string(),
            displayName: z.string(),
            type: z.enum(["text", "date", "email", "number", "company"]),
            required: z.boolean().optional().default(false),
            defaultValue: z.string().optional(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // If this is being set as default, unset other defaults
        if (input.isDefault) {
          await db
            .update(ndaTemplates)
            .set({ isDefault: 0 })
            .where(eq(ndaTemplates.isDefault, 1));
        }

        // Insert template
        const result = await db.insert(ndaTemplates).values({
          name: input.name,
          description: input.description,
          content: input.content,
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          fileMimeType: input.fileMimeType,
          isDefault: boolToInt(input.isDefault),
          createdBy: ctx.user.id,
          updatedBy: ctx.user.id,
        });

        // Get the inserted template ID
        const insertedTemplate = await db
          .select({ id: ndaTemplates.id })
          .from(ndaTemplates)
          .orderBy(desc(ndaTemplates.createdAt))
          .limit(1);

        const templateId = insertedTemplate[0]?.id || 0;

        // Insert variable definitions if provided
        if (input.variables && input.variables.length > 0) {
          for (const variable of input.variables) {
            await db.insert(ndaVariableDefinitions).values({
              templateId: Number(templateId),
              variableName: variable.variableName,
              displayName: variable.displayName,
              type: variable.type,
              required: boolToInt(variable.required),
              defaultValue: variable.defaultValue,
            });
          }
        }

        return {
          success: true,
          templateId: Number(templateId),
          message: "NDA template uploaded successfully",
        };
      } catch (error) {
        console.error("Failed to upload NDA template:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to upload template",
        });
      }
    }),

  /**
   * Get template by ID with its variables
   */
  getTemplate: protectedProcedure
    .input(z.object({ templateId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const template = await db
        .select()
        .from(ndaTemplates)
        .where(eq(ndaTemplates.id, input.templateId))
        .limit(1);

      if (!template.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      const variables = await db
        .select()
        .from(ndaVariableDefinitions)
        .where(eq(ndaVariableDefinitions.templateId, input.templateId));

      return {
        ...template[0],
        variables,
      };
    }),

  /**
   * List all active NDA templates
   */
  listTemplates: protectedProcedure
    .input(
      z.object({
        includeInactive: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const templates = await db
        .select({
          id: ndaTemplates.id,
          name: ndaTemplates.name,
          description: ndaTemplates.description,
          isDefault: ndaTemplates.isDefault,
          isActive: ndaTemplates.isActive,
          createdAt: ndaTemplates.createdAt,
          updatedAt: ndaTemplates.updatedAt,
        })
        .from(ndaTemplates)
        .where(input.includeInactive ? undefined : eq(ndaTemplates.isActive, 1))
        .orderBy(desc(ndaTemplates.isDefault), desc(ndaTemplates.updatedAt));

      return templates;
    }),

  /**
   * Update template (admin only)
   */
  updateTemplate: adminProcedure
    .input(
      z.object({
        templateId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        content: z.string().optional(),
        isDefault: z.boolean().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check template exists
      const template = await db
        .select()
        .from(ndaTemplates)
        .where(eq(ndaTemplates.id, input.templateId))
        .limit(1);

      if (!template.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      // If setting as default, unset others
      if (input.isDefault) {
        await db
          .update(ndaTemplates)
          .set({ isDefault: 0 })
          .where(eq(ndaTemplates.isDefault, 1));
      }

      // Update template
      await db
        .update(ndaTemplates)
        .set({
          name: input.name,
          description: input.description,
          content: input.content,
          isDefault: boolToInt(input.isDefault),
          isActive: boolToInt(input.isActive),
          updatedBy: ctx.user.id,
        })
        .where(eq(ndaTemplates.id, input.templateId));

      return { success: true, message: "Template updated successfully" };
    }),

  /**
   * Delete template (admin only)
   */
  deleteTemplate: adminProcedure
    .input(z.object({ templateId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Delete variable definitions first
      await db
        .delete(ndaVariableDefinitions)
        .where(eq(ndaVariableDefinitions.templateId, input.templateId));

      // Delete template
      await db
        .delete(ndaTemplates)
        .where(eq(ndaTemplates.id, input.templateId));

      return { success: true, message: "Template deleted successfully" };
    }),

  /**
   * Render template with variables
   * Substitutes {{variableName}} with provided values
   */
  renderTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.number(),
        variables: z.record(z.string(), z.any()), // Map of variable name to value
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const template = await db
        .select()
        .from(ndaTemplates)
        .where(eq(ndaTemplates.id, input.templateId))
        .limit(1);

      if (!template.length) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Template not found" });
      }

      let content = template[0].content;

      // Replace all variables in the template
      for (const [variableName, value] of Object.entries(input.variables)) {
        const regex = new RegExp(`{{\\s*${variableName}\\s*}}`, "g");
        
        // Format value based on type
        let formattedValue = String(value);
        
        if (value instanceof Date) {
          formattedValue = value.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
        } else if (typeof value === "number") {
          formattedValue = value.toLocaleString("en-US");
        }

        content = content.replace(regex, formattedValue);
      }

      // Check for any unreplaced variables
      const unreplacedVars = content.match(/{{[\s\w]+}}/g) || [];

      return {
        content,
        unreplacedVariables: unreplacedVars,
        hasUnreplacedVariables: unreplacedVars.length > 0,
      };
    }),
});
