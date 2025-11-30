/**
 * Pricing configuration for the MSP M&A Marketplace
 * Based on hybrid model: listing fee + success fee
 */

export type ListingTier = "standard" | "featured" | "premium";

export interface PricingTier {
  id: ListingTier;
  name: string;
  listingFee: number; // one-time fee in dollars
  successFeePercent: number; // percentage (e.g., 5 for 5%)
  minimumSuccessFee: number; // minimum success fee in dollars
  features: string[];
  perfectFor: string[];
  recommended?: boolean;
}

export const PRICING_TIERS: Record<ListingTier, PricingTier> = {
  standard: {
    id: "standard",
    name: "Standard Listing",
    listingFee: 0,
    successFeePercent: 5,
    minimumSuccessFee: 2500,
    features: [
      "Standard listing visibility",
      "Instant valuation calculator",
      "Basic messaging with buyers",
      "Built-in NDA management",
      "Secure document sharing",
      "Deal status tracking",
      "30-day listing duration",
      "Email support",
    ],
    perfectFor: [
      "First-time sellers testing the market",
      "MSPs wanting zero-risk exposure",
      "Sellers who want to 'try before they buy'",
    ],
  },
  featured: {
    id: "featured",
    name: "Featured Listing",
    listingFee: 299,
    successFeePercent: 4,
    minimumSuccessFee: 2500,
    recommended: true,
    features: [
      "Everything in Standard, PLUS:",
      "Featured placement in search results",
      "Homepage showcase (3x more buyer views)",
      "90-day listing duration (3x longer)",
      "Buyer analytics dashboard (see who's interested)",
      "Marketing boost to qualified buyers",
      "Priority email support (24-hour response)",
      "Listing optimization tips (maximize your price)",
      "Buyer intent notifications (know when serious buyers view)",
    ],
    perfectFor: [
      "Serious sellers ready to close in 3-6 months",
      "MSPs wanting maximum buyer exposure",
      "Sellers who want data on buyer interest",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium Listing",
    listingFee: 599,
    successFeePercent: 3,
    minimumSuccessFee: 2500,
    features: [
      "Everything in Featured, PLUS:",
      "Priority placement (top of search, always)",
      "180-day listing duration (6 months exposure)",
      "Professional listing optimization (we write your listing)",
      "Buyer vetting assistance (we help qualify serious buyers)",
      "Negotiation playbook (proven tactics to maximize price)",
      "Deal structure templates (earnouts, escrow, seller notes)",
      "Priority phone + email support (12-hour response)",
      "Confidential buyer outreach (we contact qualified buyers for you)",
      "Weekly performance reports (listing views, buyer engagement)",
    ],
    perfectFor: [
      "High-value MSPs ($1M+ revenue)",
      "Sellers who want hands-on support",
      "MSPs seeking maximum sale price",
    ],
  },
};

/**
 * Calculate the success fee for a given sale price and tier
 */
export function calculateSuccessFee(
  salePrice: number,
  tier: ListingTier
): number {
  const tierConfig = PRICING_TIERS[tier];
  const calculatedFee = salePrice * (tierConfig.successFeePercent / 100);
  return Math.max(calculatedFee, tierConfig.minimumSuccessFee);
}

/**
 * Calculate total fees for a given sale price and tier
 */
export function calculateTotalFees(
  salePrice: number,
  tier: ListingTier
): {
  listingFee: number;
  successFee: number;
  totalFees: number;
  savingsVsBroker: number; // assuming 10% broker fee
} {
  const tierConfig = PRICING_TIERS[tier];
  const listingFee = tierConfig.listingFee;
  const successFee = calculateSuccessFee(salePrice, tier);
  const totalFees = listingFee + successFee;
  
  // Traditional broker typically charges 10% for deals under $1M
  const brokerFee = salePrice * 0.10;
  const savingsVsBroker = brokerFee - totalFees;
  
  return {
    listingFee,
    successFee,
    totalFees,
    savingsVsBroker,
  };
}
