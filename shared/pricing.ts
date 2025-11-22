/**
 * Pricing configuration for the MSP M&A Marketplace
 * Based on hybrid model: listing fee + success fee
 */

export type ListingTier = "basic" | "featured" | "premium";

export interface PricingTier {
  id: ListingTier;
  name: string;
  listingFee: number; // one-time fee in dollars
  successFeePercent: number; // percentage (e.g., 5 for 5%)
  minimumSuccessFee: number; // minimum success fee in dollars
  features: string[];
  recommended?: boolean;
}

export const PRICING_TIERS: Record<ListingTier, PricingTier> = {
  basic: {
    id: "basic",
    name: "Basic Listing",
    listingFee: 299,
    successFeePercent: 5,
    minimumSuccessFee: 2500,
    features: [
      "Standard listing visibility",
      "Instant valuation calculator",
      "Basic messaging with buyers",
      "Built-in NDA management",
      "Secure document sharing",
      "Deal status tracking",
    ],
  },
  featured: {
    id: "featured",
    name: "Featured Listing",
    listingFee: 599,
    successFeePercent: 4,
    minimumSuccessFee: 2500,
    recommended: true,
    features: [
      "All Basic features",
      "Featured placement in search",
      "Homepage showcase",
      "Priority customer support",
      "Buyer analytics dashboard",
      "Marketing boost to qualified buyers",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium Listing",
    listingFee: 999,
    successFeePercent: 3,
    minimumSuccessFee: 2500,
    features: [
      "All Featured features",
      "Dedicated account manager",
      "Professional listing optimization",
      "Buyer vetting assistance",
      "Negotiation support",
      "Priority placement (top of search)",
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
