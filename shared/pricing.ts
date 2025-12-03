/**
 * Pricing configuration for the MSP M&A Marketplace
 * Phase 1 Model: Free-to-list, success-fee-only (3%)
 * "We only make money when you make money"
 */

export type ListingTier = "standard" | "featured";

export interface PricingTier {
  id: ListingTier;
  name: string;
  upfrontCost: number; // upfront cost in euros (0 for standard, weekly fee for featured)
  successFeePercent: number; // percentage (e.g., 3 for 3%)
  billingPeriod?: "weekly"; // only for featured
  features: string[];
  perfectFor: string[];
  recommended?: boolean;
}

export const PRICING_TIERS: Record<ListingTier, PricingTier> = {
  standard: {
    id: "standard",
    name: "Standard Listing",
    upfrontCost: 0,
    successFeePercent: 3,
    features: [
      "€0 upfront cost (FREE to list)",
      "Success fee only (3% at closing)",
      "Unlimited listing duration",
      "Confidential NDA-gated listing",
      "Seller approval control (approve/reject buyers)",
      "Secure document sharing with version control",
      "Built-in messaging with buyers",
      "Deal status tracking",
      "Basic analytics (views, inquiries)",
    ],
    perfectFor: [
      "All sellers (no risk to list)",
      "First-time sellers testing the market",
      "MSPs wanting zero upfront cost",
    ],
    recommended: true,
  },
  featured: {
    id: "featured",
    name: "Featured Listing",
    upfrontCost: 99,
    billingPeriod: "weekly",
    successFeePercent: 3,
    features: [
      "Everything in Standard, PLUS:",
      "€99/week (cancel anytime)",
      "Same 3% success fee",
      "Homepage showcase placement",
      "Priority in search results",
      "Highlighted in buyer notification emails",
      '"Featured" badge on listing',
      "3x more buyer views (based on benchmarks)",
    ],
    perfectFor: [
      "Sellers who want faster visibility",
      "MSPs seeking more buyer inquiries",
      "Serious sellers ready to close quickly",
    ],
  },
};

/**
 * Calculate the success fee for a given sale price
 * Phase 1: Flat 3% for all tiers
 */
export function calculateSuccessFee(
  salePrice: number,
  tier: ListingTier = "standard"
): number {
  const tierConfig = PRICING_TIERS[tier];
  return salePrice * (tierConfig.successFeePercent / 100);
}

/**
 * Calculate total fees for a given sale price and tier
 * Includes featured listing fees if applicable
 */
export function calculateTotalFees(
  salePrice: number,
  tier: ListingTier = "standard",
  weeksListed: number = 0
): {
  upfrontCost: number;
  successFee: number;
  totalFees: number;
  savingsVsBroker: number;
} {
  const tierConfig = PRICING_TIERS[tier];
  
  // Calculate upfront cost (featured listing fees)
  const upfrontCost = tier === "featured" ? tierConfig.upfrontCost * weeksListed : 0;
  
  // Calculate success fee (3% for all tiers)
  const successFee = calculateSuccessFee(salePrice, tier);
  
  // Total fees
  const totalFees = upfrontCost + successFee;
  
  // Traditional broker typically charges 5-10% (we'll use 7.5% as average)
  const brokerFee = salePrice * 0.075;
  const savingsVsBroker = brokerFee - totalFees;
  
  return {
    upfrontCost,
    successFee,
    totalFees,
    savingsVsBroker,
  };
}

/**
 * Buyer pricing (Phase 1: FREE)
 */
export const BUYER_PRICING = {
  phase1: {
    cost: 0,
    duration: "unlimited",
    features: [
      "100% FREE during Phase 1 (3-9 months)",
      "Unlimited browsing of all MSP listings",
      "One-click NDA requests",
      "Direct messaging with sellers",
      "Build and manage acquisition pipeline",
      "Deal evaluation tools (valuation calculator, due diligence checklists)",
      "Document vault access for active deals",
      "Deal status tracking (Kanban view)",
    ],
    grandfathering: "Early buyers stay free when paid tiers launch",
  },
};
