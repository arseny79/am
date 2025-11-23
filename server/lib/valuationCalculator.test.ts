import { describe, expect, it } from "vitest";
import {
  calculateAdjustedEbitda,
  getBaseMultiple,
  calculateRecurringRevenueAdjustment,
  calculateContractQualityAdjustment,
  calculateClientConcentrationAdjustment,
  calculateGrowthRateAdjustment,
  calculateFinalMultiple,
  calculateChurnAdjustedValuation,
  calculateValuation,
  validateInputs,
  type ValuationInputs,
} from "./valuationCalculator";

describe("Valuation Calculator", () => {
  // Sample input data for tests
  const sampleInputs: ValuationInputs = {
    total_revenue_ttm: 5000000,
    ebitda_ttm: 1000000,
    owner_salary_add_back: 150000,
    one_time_expenses_add_back: 50000,
    recurring_revenue_ttm: 4500000,
    project_based_revenue_ttm: 500000,
    yoy_growth_rate: 15,
    client_count: 50,
    top_1_client_revenue: 500000,
    top_5_clients_revenue: 1500000,
    clients_under_contract_pct: 90,
    avg_contract_length_months: 24,
    contracts_with_transferability_pct: 80,
  };

  describe("calculateAdjustedEbitda", () => {
    it("adds owner salary and one-time expenses to EBITDA", () => {
      const result = calculateAdjustedEbitda(sampleInputs);
      expect(result).toBe(1200000); // 1000000 + 150000 + 50000
    });

    it("handles zero add-backs", () => {
      const inputs = { ...sampleInputs, owner_salary_add_back: 0, one_time_expenses_add_back: 0 };
      const result = calculateAdjustedEbitda(inputs);
      expect(result).toBe(1000000);
    });

    it("handles negative EBITDA", () => {
      const inputs = { ...sampleInputs, ebitda_ttm: -100000 };
      const result = calculateAdjustedEbitda(inputs);
      expect(result).toBe(100000); // -100000 + 150000 + 50000
    });
  });

  describe("getBaseMultiple", () => {
    it("returns 3.5x for EBITDA < $500k", () => {
      expect(getBaseMultiple(400000)).toBe(3.5);
    });

    it("returns 4.75x for EBITDA $500k-$1M", () => {
      expect(getBaseMultiple(750000)).toBe(4.75);
    });

    it("returns 6.25x for EBITDA $1M-$2.5M", () => {
      expect(getBaseMultiple(1500000)).toBe(6.25);
    });

    it("returns 7.75x for EBITDA $2.5M-$5M", () => {
      expect(getBaseMultiple(3000000)).toBe(7.75);
    });

    it("returns 8.5x for EBITDA > $5M", () => {
      expect(getBaseMultiple(6000000)).toBe(8.5);
    });

    it("handles boundary values correctly", () => {
      expect(getBaseMultiple(500000)).toBe(4.75); // Exactly $500k
      expect(getBaseMultiple(1000000)).toBe(6.25); // Exactly $1M
      expect(getBaseMultiple(2500000)).toBe(7.75); // Exactly $2.5M
      expect(getBaseMultiple(5000000)).toBe(8.5); // Exactly $5M
    });
  });

  describe("calculateRecurringRevenueAdjustment", () => {
    it("returns +1.25x for >85% recurring revenue", () => {
      const inputs = { ...sampleInputs, recurring_revenue_ttm: 4500000, total_revenue_ttm: 5000000 }; // 90%
      expect(calculateRecurringRevenueAdjustment(inputs)).toBe(1.25);
    });

    it("returns +0.5x for 70-85% recurring revenue", () => {
      const inputs = { ...sampleInputs, recurring_revenue_ttm: 3750000, total_revenue_ttm: 5000000 }; // 75%
      expect(calculateRecurringRevenueAdjustment(inputs)).toBe(0.5);
    });

    it("returns -0.75x for 50-70% recurring revenue", () => {
      const inputs = { ...sampleInputs, recurring_revenue_ttm: 3000000, total_revenue_ttm: 5000000 }; // 60%
      expect(calculateRecurringRevenueAdjustment(inputs)).toBe(-0.75);
    });

    it("returns -1.5x for <50% recurring revenue", () => {
      const inputs = { ...sampleInputs, recurring_revenue_ttm: 2000000, total_revenue_ttm: 5000000 }; // 40%
      expect(calculateRecurringRevenueAdjustment(inputs)).toBe(-1.5);
    });

    it("handles boundary values correctly", () => {
      const inputs1 = { ...sampleInputs, recurring_revenue_ttm: 4250000, total_revenue_ttm: 5000000 }; // Exactly 85%
      expect(calculateRecurringRevenueAdjustment(inputs1)).toBe(0.5);

      const inputs2 = { ...sampleInputs, recurring_revenue_ttm: 3500000, total_revenue_ttm: 5000000 }; // Exactly 70%
      expect(calculateRecurringRevenueAdjustment(inputs2)).toBe(0.5);

      const inputs3 = { ...sampleInputs, recurring_revenue_ttm: 2500000, total_revenue_ttm: 5000000 }; // Exactly 50%
      expect(calculateRecurringRevenueAdjustment(inputs3)).toBe(-0.75);
    });
  });

  describe("calculateContractQualityAdjustment", () => {
    it("returns +0.75x for contract score >85", () => {
      const inputs = { ...sampleInputs, clients_under_contract_pct: 90, contracts_with_transferability_pct: 90 }; // Score: 90
      expect(calculateContractQualityAdjustment(inputs)).toBe(0.75);
    });

    it("returns +0.25x for contract score 60-85", () => {
      const inputs = { ...sampleInputs, clients_under_contract_pct: 70, contracts_with_transferability_pct: 70 }; // Score: 70
      expect(calculateContractQualityAdjustment(inputs)).toBe(0.25);
    });

    it("returns -0.75x for contract score <60", () => {
      const inputs = { ...sampleInputs, clients_under_contract_pct: 50, contracts_with_transferability_pct: 50 }; // Score: 50
      expect(calculateContractQualityAdjustment(inputs)).toBe(-0.75);
    });

    it("calculates contract score correctly", () => {
      // Contract Score = (% under contract * 0.5) + (% with transferability * 0.5)
      const inputs = { ...sampleInputs, clients_under_contract_pct: 80, contracts_with_transferability_pct: 60 }; // Score: 70
      expect(calculateContractQualityAdjustment(inputs)).toBe(0.25);
    });
  });

  describe("calculateClientConcentrationAdjustment", () => {
    it("returns -1.25x for top client >25% of revenue", () => {
      const inputs = { ...sampleInputs, top_1_client_revenue: 1500000, total_revenue_ttm: 5000000 }; // 30%
      expect(calculateClientConcentrationAdjustment(inputs)).toBe(-1.25);
    });

    it("returns -0.75x for top client 15-25% of revenue", () => {
      const inputs = { ...sampleInputs, top_1_client_revenue: 1000000, total_revenue_ttm: 5000000 }; // 20%
      expect(calculateClientConcentrationAdjustment(inputs)).toBe(-0.75);
    });

    it("returns 0 for top client <15% of revenue", () => {
      const inputs = { ...sampleInputs, top_1_client_revenue: 500000, total_revenue_ttm: 5000000 }; // 10%
      expect(calculateClientConcentrationAdjustment(inputs)).toBe(0);
    });

    it("handles boundary values correctly", () => {
      const inputs1 = { ...sampleInputs, top_1_client_revenue: 1250000, total_revenue_ttm: 5000000 }; // Exactly 25%
      expect(calculateClientConcentrationAdjustment(inputs1)).toBe(-0.75);

      const inputs2 = { ...sampleInputs, top_1_client_revenue: 750000, total_revenue_ttm: 5000000 }; // Exactly 15%
      expect(calculateClientConcentrationAdjustment(inputs2)).toBe(-0.75);
    });
  });

  describe("calculateGrowthRateAdjustment", () => {
    it("returns +0.75x for growth >20%", () => {
      const inputs = { ...sampleInputs, yoy_growth_rate: 25 };
      expect(calculateGrowthRateAdjustment(inputs)).toBe(0.75);
    });

    it("returns +0.25x for growth 10-20%", () => {
      const inputs = { ...sampleInputs, yoy_growth_rate: 15 };
      expect(calculateGrowthRateAdjustment(inputs)).toBe(0.25);
    });

    it("returns -0.5x for growth <10%", () => {
      const inputs = { ...sampleInputs, yoy_growth_rate: 5 };
      expect(calculateGrowthRateAdjustment(inputs)).toBe(-0.5);
    });

    it("handles negative growth", () => {
      const inputs = { ...sampleInputs, yoy_growth_rate: -5 };
      expect(calculateGrowthRateAdjustment(inputs)).toBe(-0.5);
    });

    it("handles boundary values correctly", () => {
      const inputs1 = { ...sampleInputs, yoy_growth_rate: 20 };
      expect(calculateGrowthRateAdjustment(inputs1)).toBe(0.25);

      const inputs2 = { ...sampleInputs, yoy_growth_rate: 10 };
      expect(calculateGrowthRateAdjustment(inputs2)).toBe(0.25);
    });
  });

  describe("calculateFinalMultiple", () => {
    it("sums base multiple and all adjustments", () => {
      const baseMultiple = 5.0;
      const adjustments = {
        recurring_revenue_premium: 1.25,
        contract_quality_premium: 0.75,
        client_concentration_discount: -0.75,
        growth_rate_premium: 0.25,
      };
      const result = calculateFinalMultiple(baseMultiple, adjustments);
      expect(result).toBe(6.5); // 5.0 + 1.25 + 0.75 - 0.75 + 0.25
    });

    it("handles all negative adjustments", () => {
      const baseMultiple = 5.0;
      const adjustments = {
        recurring_revenue_premium: -1.5,
        contract_quality_premium: -0.75,
        client_concentration_discount: -1.25,
        growth_rate_premium: -0.5,
      };
      const result = calculateFinalMultiple(baseMultiple, adjustments);
      expect(result).toBe(1.0); // 5.0 - 4.0
    });

    it("handles all positive adjustments", () => {
      const baseMultiple = 5.0;
      const adjustments = {
        recurring_revenue_premium: 1.25,
        contract_quality_premium: 0.75,
        client_concentration_discount: 0,
        growth_rate_premium: 0.75,
      };
      const result = calculateFinalMultiple(baseMultiple, adjustments);
      expect(result).toBe(7.75); // 5.0 + 2.75
    });
  });

  describe("calculateChurnAdjustedValuation", () => {
    it("applies 35% churn discount by default", () => {
      const result = calculateChurnAdjustedValuation(10000000);
      expect(result).toBe(6500000); // 10M * (1 - 0.35)
    });

    it("applies custom churn rate", () => {
      const result = calculateChurnAdjustedValuation(10000000, 0.25);
      expect(result).toBe(7500000); // 10M * (1 - 0.25)
    });

    it("handles zero churn", () => {
      const result = calculateChurnAdjustedValuation(10000000, 0);
      expect(result).toBe(10000000);
    });
  });

  describe("calculateValuation", () => {
    it("returns complete valuation outputs", () => {
      const result = calculateValuation(sampleInputs);

      expect(result).toHaveProperty("adjusted_ebitda");
      expect(result).toHaveProperty("base_multiple");
      expect(result).toHaveProperty("final_adjusted_multiple");
      expect(result).toHaveProperty("calculated_fair_value");
      expect(result).toHaveProperty("churn_adjusted_valuation");
      expect(result).toHaveProperty("adjustments");
    });

    it("calculates adjusted EBITDA correctly", () => {
      const result = calculateValuation(sampleInputs);
      expect(result.adjusted_ebitda).toBe(1200000); // 1000000 + 150000 + 50000
    });

    it("calculates all adjustment factors", () => {
      const result = calculateValuation(sampleInputs);
      
      expect(result.adjustments).toHaveProperty("recurring_revenue_premium");
      expect(result.adjustments).toHaveProperty("contract_quality_premium");
      expect(result.adjustments).toHaveProperty("client_concentration_discount");
      expect(result.adjustments).toHaveProperty("growth_rate_premium");
    });

    it("calculates fair value as adjusted EBITDA × final multiple", () => {
      const result = calculateValuation(sampleInputs);
      const expectedValue = result.adjusted_ebitda * result.final_adjusted_multiple;
      expect(result.calculated_fair_value).toBe(expectedValue);
    });

    it("calculates churn-adjusted valuation", () => {
      const result = calculateValuation(sampleInputs);
      const expectedChurnValue = result.calculated_fair_value * 0.65; // 35% churn
      expect(result.churn_adjusted_valuation).toBe(expectedChurnValue);
    });

    it("handles edge case: small MSP with low metrics", () => {
      const smallMspInputs: ValuationInputs = {
        total_revenue_ttm: 500000,
        ebitda_ttm: 100000,
        owner_salary_add_back: 50000,
        one_time_expenses_add_back: 10000,
        recurring_revenue_ttm: 200000, // 40% recurring
        project_based_revenue_ttm: 300000,
        yoy_growth_rate: 5,
        client_count: 10,
        top_1_client_revenue: 150000, // 30% concentration
        top_5_clients_revenue: 300000,
        clients_under_contract_pct: 50,
        avg_contract_length_months: 12,
        contracts_with_transferability_pct: 30,
      };

      const result = calculateValuation(smallMspInputs);
      
      // Should have lower multiples due to poor metrics
      expect(result.base_multiple).toBe(3.5); // Small EBITDA
      expect(result.adjustments.recurring_revenue_premium).toBeLessThan(0); // Low recurring revenue
      expect(result.adjustments.contract_quality_premium).toBeLessThan(0); // Weak contracts
      expect(result.adjustments.client_concentration_discount).toBeLessThan(0); // High concentration
      expect(result.adjustments.growth_rate_premium).toBeLessThan(0); // Low growth
    });

    it("handles edge case: large MSP with excellent metrics", () => {
      const largeMspInputs: ValuationInputs = {
        total_revenue_ttm: 20000000,
        ebitda_ttm: 6000000,
        owner_salary_add_back: 200000,
        one_time_expenses_add_back: 100000,
        recurring_revenue_ttm: 19000000, // 95% recurring
        project_based_revenue_ttm: 1000000,
        yoy_growth_rate: 25,
        client_count: 200,
        top_1_client_revenue: 1000000, // 5% concentration
        top_5_clients_revenue: 4000000,
        clients_under_contract_pct: 95,
        avg_contract_length_months: 36,
        contracts_with_transferability_pct: 90,
      };

      const result = calculateValuation(largeMspInputs);
      
      // Should have higher multiples due to excellent metrics
      expect(result.base_multiple).toBe(8.5); // Large EBITDA
      expect(result.adjustments.recurring_revenue_premium).toBeGreaterThan(0); // High recurring revenue
      expect(result.adjustments.contract_quality_premium).toBeGreaterThan(0); // Strong contracts
      expect(result.adjustments.client_concentration_discount).toBe(0); // Well-diversified
      expect(result.adjustments.growth_rate_premium).toBeGreaterThan(0); // High growth
    });
  });

  describe("validateInputs", () => {
    it("returns no errors for valid inputs", () => {
      const errors = validateInputs(sampleInputs);
      expect(errors).toHaveLength(0);
    });

    it("requires total revenue > 0", () => {
      const inputs = { ...sampleInputs, total_revenue_ttm: 0 };
      const errors = validateInputs(inputs);
      expect(errors).toContain("Total revenue must be greater than 0");
    });

    it("requires EBITDA", () => {
      const inputs = { ...sampleInputs, ebitda_ttm: undefined as any };
      const errors = validateInputs(inputs);
      expect(errors).toContain("EBITDA is required");
    });

    it("requires recurring revenue >= 0", () => {
      const inputs = { ...sampleInputs, recurring_revenue_ttm: -1000 };
      const errors = validateInputs(inputs);
      expect(errors).toContain("Recurring revenue must be 0 or greater");
    });

    it("requires client count > 0", () => {
      const inputs = { ...sampleInputs, client_count: 0 };
      const errors = validateInputs(inputs);
      expect(errors).toContain("Client count must be greater than 0");
    });

    it("validates recurring revenue <= total revenue", () => {
      const inputs = { ...sampleInputs, recurring_revenue_ttm: 6000000, total_revenue_ttm: 5000000 };
      const errors = validateInputs(inputs);
      expect(errors).toContain("Recurring revenue cannot exceed total revenue");
    });

    it("validates top client revenue <= total revenue", () => {
      const inputs = { ...sampleInputs, top_1_client_revenue: 6000000, total_revenue_ttm: 5000000 };
      const errors = validateInputs(inputs);
      expect(errors).toContain("Top client revenue cannot exceed total revenue");
    });

    it("validates top 5 clients revenue <= total revenue", () => {
      const inputs = { ...sampleInputs, top_5_clients_revenue: 6000000, total_revenue_ttm: 5000000 };
      const errors = validateInputs(inputs);
      expect(errors).toContain("Top 5 clients revenue cannot exceed total revenue");
    });

    it("validates contract percentage 0-100", () => {
      const inputs1 = { ...sampleInputs, clients_under_contract_pct: -10 };
      const errors1 = validateInputs(inputs1);
      expect(errors1).toContain("Clients under contract percentage must be between 0 and 100");

      const inputs2 = { ...sampleInputs, clients_under_contract_pct: 110 };
      const errors2 = validateInputs(inputs2);
      expect(errors2).toContain("Clients under contract percentage must be between 0 and 100");
    });

    it("validates transferability percentage 0-100", () => {
      const inputs1 = { ...sampleInputs, contracts_with_transferability_pct: -10 };
      const errors1 = validateInputs(inputs1);
      expect(errors1).toContain("Contracts with transferability percentage must be between 0 and 100");

      const inputs2 = { ...sampleInputs, contracts_with_transferability_pct: 110 };
      const errors2 = validateInputs(inputs2);
      expect(errors2).toContain("Contracts with transferability percentage must be between 0 and 100");
    });

    it("validates growth rate >= -100%", () => {
      const inputs = { ...sampleInputs, yoy_growth_rate: -150 };
      const errors = validateInputs(inputs);
      expect(errors).toContain("Year-over-year growth rate cannot be less than -100%");
    });

    it("returns multiple errors for multiple invalid fields", () => {
      const inputs = {
        ...sampleInputs,
        total_revenue_ttm: 0,
        client_count: 0,
        clients_under_contract_pct: 110,
      };
      const errors = validateInputs(inputs);
      expect(errors.length).toBeGreaterThan(1);
    });
  });
});
