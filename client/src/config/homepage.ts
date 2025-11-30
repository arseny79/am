/**
 * Homepage Content Configuration
 * 
 * Customize all homepage content here without touching the code.
 * Simply edit the values below and the changes will appear on your homepage.
 */

import { LucideIcon, Building2, TrendingUp, Shield, MessageSquare, Calculator, Search } from "lucide-react";

export interface HeroSection {
  headline: string;
  highlightedWord?: string; // Optional word to highlight in primary color
  subheadline: string;
  description: string;
  primaryCTA: {
    text: string;
    href: string;
  };
  secondaryCTA: {
    text: string;
    href: string;
  };
}

export interface TrustSignal {
  value: string; // e.g., "$2B+" or "500+" or "🔒"
  label: string; // e.g., "Buyer capital"
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface HomepageContent {
  hero: HeroSection;
  trustSignals: TrustSignal[];
  featuresHeadline: string;
  featuresSubheadline: string;
  features: Feature[];
}

/**
 * EDIT THIS SECTION TO CUSTOMIZE YOUR HOMEPAGE
 */
export const homepageContent: HomepageContent = {
  // Hero Section
  hero: {
    headline: "Sell Your MSP for",
    highlightedWord: "FREE", // This word will be highlighted in primary color
    subheadline: "Only Pay When You Get Paid",
    description: "Traditional brokers charge 5-10% upfront ($50,000 on a $500K sale). We charge 3-5% and only when your business sells. No sale = no fee. Zero risk.",
    primaryCTA: {
      text: "List Your MSP Free",
      href: "/create-listing",
    },
    secondaryCTA: {
      text: "Get Featured for $299",
      href: "/pricing",
    },
  },

  // Trust Signals (4 items recommended)
  trustSignals: [
    {
      value: "$2B+",
      label: "Buyer capital",
    },
    {
      value: "500+",
      label: "MSP owners",
    },
    {
      value: "🔒",
      label: "Escrow protected",
    },
    {
      value: "3-7",
      label: "months to close",
    },
  ],

  // Features Section
  featuresHeadline: "Everything You Need in One Place",
  featuresSubheadline: "No complicated processes or hidden fees. Just simple tools that help you find the right match and get the deal done.",
  
  features: [
    {
      icon: Search,
      title: "Find What You're Looking For",
      description: "Simple search and filters help you quickly find MSP businesses that match your criteria",
    },
    {
      icon: Calculator,
      title: "Know What It's Worth",
      description: "Get an instant valuation estimate in seconds. No spreadsheets or guesswork required",
    },
    {
      icon: Shield,
      title: "Keep Information Safe",
      description: "Built-in NDA management and secure document sharing protect your confidential business information",
    },
    {
      icon: MessageSquare,
      title: "Talk Directly to Buyers",
      description: "No middlemen or gatekeepers. Connect and negotiate directly with serious, qualified buyers",
    },
    {
      icon: TrendingUp,
      title: "Track Your Progress",
      description: "See who's viewing your listing, manage buyer conversations, and monitor deal progress in one dashboard",
    },
    {
      icon: Building2,
      title: "Close with Confidence",
      description: "Integrated Escrow.com payment protection ensures secure, transparent transactions from offer to close",
    },
  ],
};

/**
 * HOW TO CUSTOMIZE:
 * 
 * 1. Hero Section:
 *    - Edit headline and highlightedWord to change the main heading
 *    - Update subheadline for the secondary message
 *    - Modify description to explain your value proposition
 *    - Change CTA text and href to customize buttons
 * 
 * 2. Trust Signals:
 *    - Update value (numbers, icons, or text)
 *    - Change label to describe what the value represents
 *    - Keep 4 items for best visual balance
 * 
 * 3. Features:
 *    - Import new icons from 'lucide-react' if needed
 *    - Update title and description for each feature
 *    - Add or remove features as needed (6 items recommended)
 * 
 * Example: To change hero headline to "Buy or Sell MSPs"
 * 
 * hero: {
 *   headline: "Buy or Sell MSPs",
 *   highlightedWord: undefined, // No highlight
 *   ...
 * }
 */
