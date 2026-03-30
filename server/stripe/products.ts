/**
 * Stripe product and price configuration for AM iGaming marketplace listing fees
 */

import { PRICING_TIERS, type ListingTier } from "@shared/pricing";

export interface StripeProduct {
  name: string;
  description: string;
  priceAmount: number; // in cents
  tier: ListingTier;
}

/**
 * Listing fee products mapped to pricing tiers
 */
export const LISTING_FEE_PRODUCTS: Record<ListingTier, StripeProduct> = {
  standard: {
    name: "Standard Listing Fee",
    description: `${PRICING_TIERS.standard.name} - FREE listing with ${PRICING_TIERS.standard.successFeePercent}% success fee`,
    priceAmount: PRICING_TIERS.standard.upfrontCost * 100, // €0 -> 0 cents
    tier: "standard",
  },
  featured: {
    name: "Featured Listing Fee",
    description: `${PRICING_TIERS.featured.name} - €${PRICING_TIERS.featured.upfrontCost}/week with ${PRICING_TIERS.featured.successFeePercent}% success fee`,
    priceAmount: PRICING_TIERS.featured.upfrontCost * 100, // €99 -> 9900 cents
    tier: "featured",
  },
};

/**
 * Get product configuration for a listing tier
 */
export function getProductForTier(tier: ListingTier): StripeProduct {
  return LISTING_FEE_PRODUCTS[tier];
}
