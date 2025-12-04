import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { calculateValuation, type ContractLength } from "../../shared/valuationCalculator";

const contractLengthSchema = z.enum(["month-to-month", "1-year", "3-year", "auto-renewal"]);

const valuationInputSchema = z.object({
  annualRevenue: z.number().positive("Annual revenue must be positive"),
  ebitda: z.number().positive("EBITDA must be positive").optional(),
  recurringRevenuePercent: z.number().min(0).max(100, "Must be between 0-100%"),
  contractLength: contractLengthSchema,
  topClientPercent: z.number().min(0).max(100, "Must be between 0-100%"),
  growthRate: z.number().min(0).max(100, "Must be between 0-100%").optional(),
});

export const valuationRouter = router({
  /**
   * Calculate MSP valuation based on input metrics
   */
  calculate: publicProcedure
    .input(valuationInputSchema)
    .mutation(({ input }) => {
      const result = calculateValuation({
        annualRevenue: input.annualRevenue,
        ebitda: input.ebitda,
        recurringRevenuePercent: input.recurringRevenuePercent,
        contractLength: input.contractLength as ContractLength,
        topClientPercent: input.topClientPercent,
        growthRate: input.growthRate,
      });

      return result;
    }),
});
