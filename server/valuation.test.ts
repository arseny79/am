import { describe, expect, it } from "vitest";
import { calculateValuation } from "../shared/valuationCalculator";

describe("MSP Valuation Calculator", () => {
  describe("Example from PDF (€2.5M revenue, €500K EBITDA)", () => {
    it("should calculate correct valuation for example case", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 80,
        contractLength: "3-year",
        topClientPercent: 18,
      });

      // Base multiple for €500K EBITDA should be 6.0x (from 5-6x range)
      expect(result.breakdown.baseMultiple).toBe(5.5);

      // Adjustments:
      // - Recurring 80%: +0.5x
      // - 3-year contracts: +0.625x
      // - Top client 18%: -0.5x
      // Total adjustments: +0.625x
      const expectedAdjustments = 0.5 + 0.625 + (-0.5);
      const actualAdjustments =
        result.breakdown.adjustments.recurringRevenue +
        result.breakdown.adjustments.contractQuality +
        result.breakdown.adjustments.clientConcentration;
      expect(actualAdjustments).toBeCloseTo(expectedAdjustments, 2);

      // Final multiple should be around 6.625x
      expect(result.breakdown.finalMultiple).toBeCloseTo(6.125, 2);

      // Fair value should be around €3.3M
      expect(result.fairValue).toBeGreaterThan(3000000);
      expect(result.fairValue).toBeLessThan(3500000);
    });
  });

  describe("EBITDA Multiple Tiers", () => {
    it("should use 4x for EBITDA < €500K", () => {
      const result = calculateValuation({
        annualRevenue: 1000000,
        ebitda: 400000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 12,
      });

      expect(result.breakdown.baseMultiple).toBe(4);
    });

    it("should use 5.5x for EBITDA €500K-€1M", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 750000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 12,
      });

      expect(result.breakdown.baseMultiple).toBe(5.5);
    });

    it("should use 7x for EBITDA €1M-€2.5M", () => {
      const result = calculateValuation({
        annualRevenue: 7500000,
        ebitda: 1500000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 12,
      });

      expect(result.breakdown.baseMultiple).toBe(7);
    });

    it("should use 8.25x for EBITDA €2.5M-€5M", () => {
      const result = calculateValuation({
        annualRevenue: 15000000,
        ebitda: 3000000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 12,
      });

      expect(result.breakdown.baseMultiple).toBe(8.25);
    });

    it("should use 10x for EBITDA > €5M", () => {
      const result = calculateValuation({
        annualRevenue: 30000000,
        ebitda: 6000000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 12,
      });

      expect(result.breakdown.baseMultiple).toBe(10);
    });
  });

  describe("Recurring Revenue Adjustments", () => {
    it("should penalize low recurring revenue (< 50%)", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 40,
        contractLength: "1-year",
        topClientPercent: 12,
      });

      expect(result.breakdown.adjustments.recurringRevenue).toBe(-0.75);
    });

    it("should reward high recurring revenue (> 85%)", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 90,
        contractLength: "1-year",
        topClientPercent: 12,
      });

      expect(result.breakdown.adjustments.recurringRevenue).toBe(0.875);
    });
  });

  describe("Contract Quality Adjustments", () => {
    it("should penalize month-to-month contracts", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 70,
        contractLength: "month-to-month",
        topClientPercent: 12,
      });

      expect(result.breakdown.adjustments.contractQuality).toBe(-1.25);
    });

    it("should reward 3-year contracts", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 70,
        contractLength: "3-year",
        topClientPercent: 12,
      });

      expect(result.breakdown.adjustments.contractQuality).toBe(0.625);
    });

    it("should reward auto-renewal clauses", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 70,
        contractLength: "auto-renewal",
        topClientPercent: 12,
      });

      expect(result.breakdown.adjustments.contractQuality).toBe(0.25);
    });
  });

  describe("Client Concentration Adjustments", () => {
    it("should reward low concentration (< 10%)", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 8,
      });

      expect(result.breakdown.adjustments.clientConcentration).toBe(0.25);
    });

    it("should penalize high concentration (> 25%)", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 30,
      });

      expect(result.breakdown.adjustments.clientConcentration).toBe(-0.875);
    });
  });

  describe("Valuation Range", () => {
    it("should calculate ±15% range around fair value", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 12,
      });

      expect(result.valuationRange.low).toBeCloseTo(result.fairValue * 0.85, 0);
      expect(result.valuationRange.high).toBeCloseTo(result.fairValue * 1.15, 0);
    });

    it("should calculate churn-adjusted range (×0.65)", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 12,
      });

      expect(result.churnAdjustedRange.low).toBeCloseTo(result.fairValue * 0.65 * 0.85, 0);
      expect(result.churnAdjustedRange.high).toBeCloseTo(result.fairValue * 0.65 * 1.15, 0);
    });
  });

  describe("EBITDA Estimation", () => {
    it("should estimate EBITDA at 20% of revenue when not provided", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        // No EBITDA provided
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 12,
      });

      expect(result.breakdown.baseEbitda).toBe(500000); // 20% of 2.5M
    });

    it("should use provided EBITDA when available", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 600000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 12,
      });

      expect(result.breakdown.baseEbitda).toBe(600000);
    });
  });

  describe("Growth Rate Adjustments", () => {
    it("should reward high growth (> 20% YoY)", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 12,
        growthRate: 25,
      });

      expect(result.breakdown.adjustments.growthRate).toBe(1);
    });

    it("should penalize negative/low growth (< 5% YoY)", () => {
      const result = calculateValuation({
        annualRevenue: 2500000,
        ebitda: 500000,
        recurringRevenuePercent: 70,
        contractLength: "1-year",
        topClientPercent: 12,
        growthRate: 2,
      });

      expect(result.breakdown.adjustments.growthRate).toBe(-0.5);
    });
  });
});
