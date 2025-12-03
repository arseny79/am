import { describe, expect, it } from "vitest";
import { PRICING_TIERS, calculateSuccessFee, calculateTotalFees, BUYER_PRICING } from "../shared/pricing";

describe("New Pricing Model (3% Success Fee)", () => {
  describe("PRICING_TIERS", () => {
    it("should have standard tier with €0 upfront cost", () => {
      expect(PRICING_TIERS.standard.upfrontCost).toBe(0);
      expect(PRICING_TIERS.standard.successFeePercent).toBe(3);
      expect(PRICING_TIERS.standard.recommended).toBe(true);
    });

    it("should have featured tier with €99/week upfront cost", () => {
      expect(PRICING_TIERS.featured.upfrontCost).toBe(99);
      expect(PRICING_TIERS.featured.successFeePercent).toBe(3);
      expect(PRICING_TIERS.featured.billingPeriod).toBe("weekly");
    });

    it("should not have premium tier", () => {
      expect(PRICING_TIERS).not.toHaveProperty("premium");
    });

    it("should have correct features for standard tier", () => {
      expect(PRICING_TIERS.standard.features).toContain("€0 upfront cost (FREE to list)");
      expect(PRICING_TIERS.standard.features).toContain("Success fee only (3% at closing)");
      expect(PRICING_TIERS.standard.features).toContain("Unlimited listing duration");
    });

    it("should have correct features for featured tier", () => {
      expect(PRICING_TIERS.featured.features).toContain("€99/week (cancel anytime)");
      expect(PRICING_TIERS.featured.features).toContain("Homepage showcase placement");
      expect(PRICING_TIERS.featured.features).toContain("3x more buyer views (based on benchmarks)");
    });
  });

  describe("calculateSuccessFee", () => {
    it("should calculate 3% success fee for standard tier", () => {
      const salePrice = 500000;
      const successFee = calculateSuccessFee(salePrice, "standard");
      expect(successFee).toBe(15000); // 3% of €500,000
    });

    it("should calculate 3% success fee for featured tier", () => {
      const salePrice = 500000;
      const successFee = calculateSuccessFee(salePrice, "featured");
      expect(successFee).toBe(15000); // 3% of €500,000 (same as standard)
    });

    it("should calculate correct fee for small sale", () => {
      const salePrice = 100000;
      const successFee = calculateSuccessFee(salePrice, "standard");
      expect(successFee).toBe(3000); // 3% of €100,000
    });

    it("should calculate correct fee for large sale", () => {
      const salePrice = 2000000;
      const successFee = calculateSuccessFee(salePrice, "standard");
      expect(successFee).toBe(60000); // 3% of €2,000,000
    });
  });

  describe("calculateTotalFees", () => {
    it("should calculate total fees for standard tier (no upfront cost)", () => {
      const salePrice = 500000;
      const fees = calculateTotalFees(salePrice, "standard", 0);
      
      expect(fees.upfrontCost).toBe(0);
      expect(fees.successFee).toBe(15000); // 3%
      expect(fees.totalFees).toBe(15000);
      expect(fees.savingsVsBroker).toBeGreaterThan(0); // Should save vs 7.5% broker
    });

    it("should calculate total fees for featured tier (12 weeks)", () => {
      const salePrice = 500000;
      const weeksListed = 12;
      const fees = calculateTotalFees(salePrice, "featured", weeksListed);
      
      expect(fees.upfrontCost).toBe(1188); // €99 × 12 weeks
      expect(fees.successFee).toBe(15000); // 3%
      expect(fees.totalFees).toBe(16188); // €1,188 + €15,000
      expect(fees.savingsVsBroker).toBeGreaterThan(0);
    });

    it("should calculate savings vs traditional broker (7.5%)", () => {
      const salePrice = 500000;
      const fees = calculateTotalFees(salePrice, "standard", 0);
      
      const brokerFee = salePrice * 0.075; // 7.5%
      expect(fees.savingsVsBroker).toBe(brokerFee - fees.totalFees);
      expect(fees.savingsVsBroker).toBe(22500); // €37,500 - €15,000
    });

    it("should show featured listing is still cheaper than broker", () => {
      const salePrice = 500000;
      const weeksListed = 12;
      const fees = calculateTotalFees(salePrice, "featured", weeksListed);
      
      const brokerFee = salePrice * 0.075;
      expect(fees.totalFees).toBeLessThan(brokerFee);
      expect(fees.savingsVsBroker).toBeGreaterThan(20000); // Significant savings
    });
  });

  describe("BUYER_PRICING", () => {
    it("should have phase 1 pricing as free", () => {
      expect(BUYER_PRICING.phase1.cost).toBe(0);
      expect(BUYER_PRICING.phase1.duration).toBe("unlimited");
    });

    it("should include grandfathering clause", () => {
      expect(BUYER_PRICING.phase1.grandfathering).toContain("Early buyers stay free");
    });

    it("should list all buyer features", () => {
      expect(BUYER_PRICING.phase1.features.length).toBeGreaterThan(5);
      expect(BUYER_PRICING.phase1.features).toContain("100% FREE during Phase 1 (3-9 months)");
    });
  });

  describe("Pricing Comparison Examples", () => {
    it("Example: €500k sale with standard listing", () => {
      const salePrice = 500000;
      const fees = calculateTotalFees(salePrice, "standard", 0);
      
      // Traditional broker (7.5%): €37,500
      // MSP.investments (3%): €15,000
      // Savings: €22,500 (60%)
      expect(fees.totalFees).toBe(15000);
      expect(fees.savingsVsBroker).toBe(22500);
      expect((fees.savingsVsBroker / (salePrice * 0.075)) * 100).toBeCloseTo(60, 0);
    });

    it("Example: €500k sale with featured listing (12 weeks)", () => {
      const salePrice = 500000;
      const fees = calculateTotalFees(salePrice, "featured", 12);
      
      // Featured listing: €99/week × 12 = €1,188
      // Success fee: 3% = €15,000
      // Total: €16,188
      // Traditional broker: €37,500
      // Savings: €21,312 (57%)
      expect(fees.totalFees).toBe(16188);
      expect(fees.savingsVsBroker).toBe(21312);
    });

    it("Example: €1M sale with standard listing", () => {
      const salePrice = 1000000;
      const fees = calculateTotalFees(salePrice, "standard", 0);
      
      // MSP.investments (3%): €30,000
      // Traditional broker (7.5%): €75,000
      // Savings: €45,000 (60%)
      expect(fees.totalFees).toBe(30000);
      expect(fees.savingsVsBroker).toBe(45000);
    });
  });
});
