/**
 * Stripe product and price configuration for MSP marketplace listing fees
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
  basic: {
    name: "Basic Listing Fee",
    description: `${PRICING_TIERS.basic.name} - Standard listing visibility with ${PRICING_TIERS.basic.successFeePercent}% success fee`,
    priceAmount: PRICING_TIERS.basic.listingFee * 100, // $299 -> 29900 cents
    tier: "basic",
  },
  featured: {
    name: "Featured Listing Fee",
    description: `${PRICING_TIERS.featured.name} - Featured placement with ${PRICING_TIERS.featured.successFeePercent}% success fee`,
    priceAmount: PRICING_TIERS.featured.listingFee * 100, // $599 -> 59900 cents
    tier: "featured",
  },
  premium: {
    name: "Premium Listing Fee",
    description: `${PRICING_TIERS.premium.name} - Premium placement with ${PRICING_TIERS.premium.successFeePercent}% success fee`,
    priceAmount: PRICING_TIERS.premium.listingFee * 100, // $999 -> 99900 cents
    tier: "premium",
  },
};

/**
 * Get product configuration for a listing tier
 */
export function getProductForTier(tier: ListingTier): StripeProduct {
  return LISTING_FEE_PRODUCTS[tier];
}
