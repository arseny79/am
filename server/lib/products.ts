/**
 * Stripe Product and Price Definitions
 * Centralized configuration for all Stripe products
 */

export const STRIPE_PRODUCTS = {
  featured_weekly: {
    id: "featured_weekly",
    name: "Featured Listing",
    description: "Boost your visibility and attract more buyers",
    price: 9900, // $99.00 in cents
    currency: "usd",
    interval: "week" as const,
  },
  premium_weekly: {
    id: "premium_weekly",
    name: "Premium Listing",
    description: "Maximum exposure for serious sellers",
    price: 29900, // $299.00 in cents
    currency: "usd",
    interval: "week" as const,
  },
} as const;

export type ProductId = keyof typeof STRIPE_PRODUCTS;
