/**
 * Valuation Reality Check Calculator
 * 
 * Multi-factor valuation algorithm for iGaming businesses based on:
 * - Adjusted EBITDA
 * - Size-based multiples
 * - Recurring revenue quality
 * - Contract strength
 * - Client concentration risk
 * - Year-over-year growth
 * - Expected churn discount
 */

export interface ValuationInputs {
  total_revenue_ttm: number;
  ebitda_ttm: number;
  owner_salary_add_back: number;
  one_time_expenses_add_back: number;
  recurring_revenue_ttm: number;
  project_based_revenue_ttm: number;
  yoy_growth_rate: number;
  client_count: number;
  top_1_client_revenue: number;
  top_5_clients_revenue: number;
  clients_under_contract_pct: number;
  avg_contract_length_months: number;
  contracts_with_transferability_pct: number;
}

export interface ValuationOutputs {
  adjusted_ebitda: number;
  base_multiple: number;
  final_adjusted_multiple: number;
  calculated_fair_value: number;
  churn_adjusted_valuation: number;
  adjustments: {
    recurring_revenue_premium: number;
    contract_quality_premium: number;
    client_concentration_discount: number;
    growth_rate_premium: number;
  };
}

/**
 * Step 1: Calculate Adjusted EBITDA
 * Adds back owner salary and one-time expenses to get true cash flow
 */
export function calculateAdjustedEbitda(inputs: ValuationInputs): number {
  return inputs.ebitda_ttm + inputs.owner_salary_add_back + inputs.one_time_expenses_add_back;
}

/**
 * Step 2: Determine Base Multiple
 * Based on Adjusted EBITDA size - larger businesses command higher multiples
 */
export function getBaseMultiple(adjustedEbitda: number): number {
  if (adjustedEbitda < 500000) {
    return 3.5; // Midpoint of 3.0x - 4.0x range
  } else if (adjustedEbitda < 1000000) {
    return 4.75; // Midpoint of 4.0x - 5.5x range
  } else if (adjustedEbitda < 2500000) {
    return 6.25; // Midpoint of 5.5x - 7.0x range
  } else if (adjustedEbitda < 5000000) {
    return 7.75; // Midpoint of 7.0x - 8.5x range
  } else {
    return 8.5; // 8.5x+ for large MSPs
  }
}

/**
 * Step 3a: Calculate Recurring Revenue Adjustment
 * Higher recurring revenue = more predictable cash flow = higher valuation
 */
export function calculateRecurringRevenueAdjustment(inputs: ValuationInputs): number {
  const recurringRevenuePct = (inputs.recurring_revenue_ttm / inputs.total_revenue_ttm) * 100;
  
  if (recurringRevenuePct > 85) {
    return 1.25; // Premium for highly recurring revenue
  } else if (recurringRevenuePct >= 70) {
    return 0.5; // Moderate premium
  } else if (recurringRevenuePct >= 50) {
    return -0.75; // Slight discount
  } else {
    return -1.5; // Significant discount for project-heavy business
  }
}

/**
 * Step 3b: Calculate Contract Quality Adjustment
 * Strong contracts with transferability clauses reduce buyer risk
 */
export function calculateContractQualityAdjustment(inputs: ValuationInputs): number {
  // Contract Score = (% under contract * 0.5) + (% with transferability * 0.5)
  const contractScore = 
    (inputs.clients_under_contract_pct * 0.5) + 
    (inputs.contracts_with_transferability_pct * 0.5);
  
  if (contractScore > 85) {
    return 0.75; // Excellent contract quality
  } else if (contractScore >= 60) {
    return 0.25; // Good contract quality
  } else {
    return -0.75; // Weak contract quality
  }
}

/**
 * Step 3c: Calculate Client Concentration Adjustment
 * High concentration in top clients = higher risk = lower valuation
 */
export function calculateClientConcentrationAdjustment(inputs: ValuationInputs): number {
  const topClientPct = (inputs.top_1_client_revenue / inputs.total_revenue_ttm) * 100;
  
  if (topClientPct > 25) {
    return -1.25; // Severe concentration risk
  } else if (topClientPct >= 15) {
    return -0.75; // Moderate concentration risk
  } else {
    return 0; // Well-diversified
  }
}

/**
 * Step 3d: Calculate Growth Rate Adjustment
 * Growing businesses command premium multiples
 */
export function calculateGrowthRateAdjustment(inputs: ValuationInputs): number {
  if (inputs.yoy_growth_rate > 20) {
    return 0.75; // High growth premium
  } else if (inputs.yoy_growth_rate >= 10) {
    return 0.25; // Moderate growth premium
  } else {
    return -0.5; // Declining or flat growth discount
  }
}

/**
 * Step 4: Calculate Final Adjusted Multiple
 * Combines base multiple with all adjustment factors
 */
export function calculateFinalMultiple(
  baseMultiple: number,
  adjustments: {
    recurring_revenue_premium: number;
    contract_quality_premium: number;
    client_concentration_discount: number;
    growth_rate_premium: number;
  }
): number {
  return (
    baseMultiple +
    adjustments.recurring_revenue_premium +
    adjustments.contract_quality_premium +
    adjustments.client_concentration_discount +
    adjustments.growth_rate_premium
  );
}

/**
 * Step 5: Calculate Churn-Adjusted Valuation
 * Accounts for expected client churn (35% baseline)
 */
export function calculateChurnAdjustedValuation(
  calculatedFairValue: number,
  churnRate: number = 0.35
): number {
  return calculatedFairValue * (1 - churnRate);
}

/**
 * Main valuation calculation function
 * Orchestrates all steps and returns complete valuation output
 */
export function calculateValuation(inputs: ValuationInputs): ValuationOutputs {
  // Step 1: Calculate Adjusted EBITDA
  const adjusted_ebitda = calculateAdjustedEbitda(inputs);
  
  // Step 2: Determine Base Multiple
  const base_multiple = getBaseMultiple(adjusted_ebitda);
  
  // Step 3: Calculate all adjustment factors
  const adjustments = {
    recurring_revenue_premium: calculateRecurringRevenueAdjustment(inputs),
    contract_quality_premium: calculateContractQualityAdjustment(inputs),
    client_concentration_discount: calculateClientConcentrationAdjustment(inputs),
    growth_rate_premium: calculateGrowthRateAdjustment(inputs),
  };
  
  // Step 4: Calculate Final Adjusted Multiple
  const final_adjusted_multiple = calculateFinalMultiple(base_multiple, adjustments);
  
  // Step 5: Calculate Fair Value
  const calculated_fair_value = adjusted_ebitda * final_adjusted_multiple;
  
  // Step 6: Calculate Churn-Adjusted Valuation
  const churn_adjusted_valuation = calculateChurnAdjustedValuation(calculated_fair_value);
  
  return {
    adjusted_ebitda,
    base_multiple,
    final_adjusted_multiple,
    calculated_fair_value,
    churn_adjusted_valuation,
    adjustments,
  };
}

/**
 * Validate inputs before calculation
 * Returns array of error messages, empty if valid
 */
export function validateInputs(inputs: Partial<ValuationInputs>): string[] {
  const errors: string[] = [];
  
  // Required fields
  if (!inputs.total_revenue_ttm || inputs.total_revenue_ttm <= 0) {
    errors.push("Total revenue must be greater than 0");
  }
  
  if (!inputs.ebitda_ttm) {
    errors.push("EBITDA is required");
  }
  
  if (!inputs.recurring_revenue_ttm || inputs.recurring_revenue_ttm < 0) {
    errors.push("Recurring revenue must be 0 or greater");
  }
  
  if (!inputs.client_count || inputs.client_count <= 0) {
    errors.push("Client count must be greater than 0");
  }
  
  // Logical validation
  if (inputs.recurring_revenue_ttm && inputs.total_revenue_ttm && 
      inputs.recurring_revenue_ttm > inputs.total_revenue_ttm) {
    errors.push("Recurring revenue cannot exceed total revenue");
  }
  
  if (inputs.top_1_client_revenue && inputs.total_revenue_ttm && 
      inputs.top_1_client_revenue > inputs.total_revenue_ttm) {
    errors.push("Top client revenue cannot exceed total revenue");
  }
  
  if (inputs.top_5_clients_revenue && inputs.total_revenue_ttm && 
      inputs.top_5_clients_revenue > inputs.total_revenue_ttm) {
    errors.push("Top 5 clients revenue cannot exceed total revenue");
  }
  
  // Percentage validation
  if (inputs.clients_under_contract_pct !== undefined && 
      (inputs.clients_under_contract_pct < 0 || inputs.clients_under_contract_pct > 100)) {
    errors.push("Clients under contract percentage must be between 0 and 100");
  }
  
  if (inputs.contracts_with_transferability_pct !== undefined && 
      (inputs.contracts_with_transferability_pct < 0 || inputs.contracts_with_transferability_pct > 100)) {
    errors.push("Contracts with transferability percentage must be between 0 and 100");
  }
  
  if (inputs.yoy_growth_rate !== undefined && inputs.yoy_growth_rate < -100) {
    errors.push("Year-over-year growth rate cannot be less than -100%");
  }
  
  return errors;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Format multiple for display (e.g., 4.5x)
 */
export function formatMultiple(value: number): string {
  return `${value.toFixed(2)}x`;
}
