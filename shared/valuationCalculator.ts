/**
 * iGaming Business Valuation Calculator
 * Based on industry research from Aventis Advisors, Drake Star, NinjaOne, Worklyn Partners, etc.
 */

export type ContractLength = "month-to-month" | "1-year" | "3-year" | "auto-renewal";

export interface ValuationInput {
  annualRevenue: number;
  ebitda?: number; // Optional - will estimate if not provided
  recurringRevenuePercent: number; // 0-100
  contractLength: ContractLength;
  topClientPercent: number; // 0-100
  growthRate?: number; // Optional - 0-100 (YoY percentage)
}

export interface ValuationResult {
  fairValue: number;
  valuationRange: {
    low: number;
    high: number;
  };
  churnAdjustedRange: {
    low: number;
    high: number;
  };
  breakdown: {
    baseEbitda: number;
    baseMultiple: number;
    adjustments: {
      recurringRevenue: number;
      contractQuality: number;
      clientConcentration: number;
      growthRate: number;
    };
    finalMultiple: number;
  };
}

/**
 * Get EBITDA multiple based on EBITDA size
 * Source: Aventis Advisors research
 */
function getEbitdaMultiple(ebitda: number): number {
  if (ebitda < 500000) return 4; // 3-5x range, using 4x as midpoint
  if (ebitda < 1000000) return 5.5; // 5-6x
  if (ebitda < 2500000) return 7; // 6.5-7.5x
  if (ebitda < 5000000) return 8.25; // 7.5-9x
  return 10; // 9-11.2x, using 10x as midpoint
}

/**
 * Get recurring revenue adjustment
 * Source: NinjaOne & Worklyn Partners
 */
function getRecurringRevenueAdjustment(percent: number): number {
  if (percent < 50) return -0.75; // -0.5 to -1x, using -0.75 as midpoint
  if (percent < 70) return 0; // Baseline
  if (percent < 85) return 0.5; // +0.5x
  return 0.875; // +0.75x to +1x, using +0.875 as midpoint
}

/**
 * Get contract quality adjustment
 * Source: iGaming M&A industry research
 */
function getContractQualityAdjustment(contractLength: ContractLength): number {
  switch (contractLength) {
    case "month-to-month":
      return -1.25; // -1x to -1.5x
    case "1-year":
      return 0; // Baseline
    case "3-year":
      return 0.625; // +0.5x to +0.75x
    case "auto-renewal":
      return 0.25; // +0.25x
    default:
      return 0;
  }
}

/**
 * Get client concentration adjustment
 * Source: Reddit & industry sources
 */
function getClientConcentrationAdjustment(topClientPercent: number): number {
  if (topClientPercent < 10) return 0.25; // +0.25x
  if (topClientPercent < 15) return 0; // Baseline (10-15%)
  if (topClientPercent < 25) return -0.5; // -0.5x
  return -0.875; // -0.75x to -1x
}

/**
 * Get growth rate adjustment
 * Source: Worklyn Partners
 */
function getGrowthRateAdjustment(growthRate?: number): number {
  if (!growthRate) return 0;
  
  if (growthRate < 5) return -0.5; // < 5% YoY
  if (growthRate < 10) return 0; // 5-10% YoY (Baseline)
  if (growthRate < 20) return 0.5; // 10-20% YoY
  return 1; // > 20% YoY
}

/**
 * Calculate iGaming business valuation
 */
export function calculateValuation(input: ValuationInput): ValuationResult {
  // Step 1: Determine EBITDA
  let ebitda = input.ebitda;
  
  // If EBITDA not provided, estimate from revenue (20% margin assumption)
  if (!ebitda) {
    ebitda = input.annualRevenue * 0.20;
  }
  
  // Step 2: Get base multiple
  const baseMultiple = getEbitdaMultiple(ebitda);
  
  // Step 3: Calculate adjustments
  const adjustments = {
    recurringRevenue: getRecurringRevenueAdjustment(input.recurringRevenuePercent),
    contractQuality: getContractQualityAdjustment(input.contractLength),
    clientConcentration: getClientConcentrationAdjustment(input.topClientPercent),
    growthRate: getGrowthRateAdjustment(input.growthRate),
  };
  
  // Step 4: Calculate final multiple
  const finalMultiple = baseMultiple + 
    adjustments.recurringRevenue + 
    adjustments.contractQuality + 
    adjustments.clientConcentration + 
    adjustments.growthRate;
  
  // Step 5: Calculate fair value
  const fairValue = ebitda * finalMultiple;
  
  // Step 6: Calculate valuation range (±15%)
  const valuationRange = {
    low: fairValue * 0.85,
    high: fairValue * 1.15,
  };
  
  // Step 7: Calculate churn-adjusted range (×0.65 for 35-40% expected churn)
  const churnAdjustedRange = {
    low: fairValue * 0.65 * 0.85,
    high: fairValue * 0.65 * 1.15,
  };
  
  return {
    fairValue,
    valuationRange,
    churnAdjustedRange,
    breakdown: {
      baseEbitda: ebitda,
      baseMultiple,
      adjustments,
      finalMultiple,
    },
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `€${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `€${(amount / 1000).toFixed(0)}K`;
  }
  return `€${amount.toFixed(0)}`;
}

/**
 * Get contract length display name
 */
export function getContractLengthLabel(contractLength: ContractLength): string {
  switch (contractLength) {
    case "month-to-month":
      return "Month-to-month";
    case "1-year":
      return "1-year contracts";
    case "3-year":
      return "3-year contracts";
    case "auto-renewal":
      return "Auto-renewal clauses";
    default:
      return contractLength;
  }
}
