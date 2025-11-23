import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { listings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { 
  calculateValuation, 
  validateInputs,
  type ValuationInputs,
  type ValuationOutputs 
} from "../lib/valuationCalculator";

// Validation schema for valuation inputs
const valuationInputsSchema = z.object({
  total_revenue_ttm: z.number().positive("Total revenue must be positive"),
  ebitda_ttm: z.number(),
  owner_salary_add_back: z.number().min(0).default(0),
  one_time_expenses_add_back: z.number().min(0).default(0),
  recurring_revenue_ttm: z.number().min(0),
  project_based_revenue_ttm: z.number().min(0).default(0),
  yoy_growth_rate: z.number().min(-100).max(1000),
  client_count: z.number().int().positive("Client count must be positive"),
  top_1_client_revenue: z.number().min(0),
  top_5_clients_revenue: z.number().min(0),
  clients_under_contract_pct: z.number().min(0).max(100),
  avg_contract_length_months: z.number().min(0),
  contracts_with_transferability_pct: z.number().min(0).max(100),
});

export const valuationRouter = router({
  /**
   * Calculate valuation for a listing
   * Stores the inputs and outputs in the listing record
   */
  calculate: protectedProcedure
    .input(z.object({
      listingId: z.number().int().positive(),
      inputs: valuationInputsSchema,
      sellerDesiredPrice: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Verify listing exists and user owns it
      const listing = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (listing.length === 0) {
        throw new Error("Listing not found");
      }

      if (listing[0].sellerId !== ctx.user.id) {
        throw new Error("You do not have permission to update this listing");
      }

      // Validate inputs
      const validationErrors = validateInputs(input.inputs);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
      }

      // Calculate valuation
      const outputs = calculateValuation(input.inputs);

      // Update listing with valuation data
      await db
        .update(listings)
        .set({
          valuationInputs: input.inputs as any,
          valuationOutputs: outputs as any,
          sellerDesiredPrice: input.sellerDesiredPrice,
          valuationCompletedAt: new Date(),
          // Also update the legacy estimatedValuation field for backward compatibility
          estimatedValuation: Math.round(outputs.calculated_fair_value),
          valuationMultiple: Math.round(outputs.final_adjusted_multiple * 10), // Store as integer (e.g., 45 for 4.5x)
        })
        .where(eq(listings.id, input.listingId));

      return {
        success: true,
        outputs,
      };
    }),

  /**
   * Get valuation data for a listing
   * Only accessible by the listing owner
   */
  getByListingId: protectedProcedure
    .input(z.object({
      listingId: z.number().int().positive(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const listing = await db
        .select({
          id: listings.id,
          sellerId: listings.sellerId,
          valuationInputs: listings.valuationInputs,
          valuationOutputs: listings.valuationOutputs,
          sellerDesiredPrice: listings.sellerDesiredPrice,
          valuationCompletedAt: listings.valuationCompletedAt,
        })
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (listing.length === 0) {
        throw new Error("Listing not found");
      }

      if (listing[0].sellerId !== ctx.user.id) {
        throw new Error("You do not have permission to view this valuation");
      }

      return listing[0];
    }),

  /**
   * Preview valuation without saving
   * Useful for the wizard to show real-time calculations
   */
  preview: protectedProcedure
    .input(valuationInputsSchema)
    .mutation(async ({ input }) => {
      // Validate inputs
      const validationErrors = validateInputs(input);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
      }

      // Calculate and return outputs
      const outputs = calculateValuation(input);

      return {
        success: true,
        outputs,
      };
    }),
});
