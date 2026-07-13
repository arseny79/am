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
    headline: "Digital Asset Deals Simplified",
    highlightedWord: "Simplified", // This word will be highlighted in primary color
    subheadline: "Acquire or exit digital-native assets with structure and speed",
    description: "List or acquire online businesses, digital assets, and internet-native opportunities through a secure marketplace built for serious dealmaking.",
    primaryCTA: {
      text: "List an Asset",
      href: "/create-listing",
    },
    secondaryCTA: {
      text: "Browse Opportunities",
      href: "/marketplace",
    },
  },

  // Trust Signals (3 items recommended)
  trustSignals: [
    {
      value: "Direct",
      label: "Buyer Access",
    },
    {
      value: "Private",
      label: "NDA Workflows",
    },
    {
      value: "Flexible",
      label: "Asset Types",
    },
  ],

  // Features Section
  featuresHeadline: "Everything Needed to Run a Modern Deal",
  featuresSubheadline: "From discovery to diligence, AM gives buyers and sellers a cleaner way to transact digital-first assets.",
  
  features: [
    {
      icon: Search,
      title: "Source Better Opportunities",
      description: "Browse acquisition opportunities across digital assets, online businesses, and internet-native categories.",
    },
    {
      icon: Calculator,
      title: "Review the Right Metrics",
      description: "Standardized financial and operating data helps buyers compare opportunities faster.",
    },
    {
      icon: Shield,
      title: "Control Confidentiality",
      description: "Built-in NDA flows and private access controls protect sensitive information during live deal discussions.",
    },
    {
      icon: MessageSquare,
      title: "Connect Directly",
      description: "Serious buyers and sellers can engage directly once access is granted and interest is qualified.",
    },
    {
      icon: TrendingUp,
      title: "Move Deals Forward",
      description: "Track listing activity, buyer engagement, and next steps from one operating dashboard.",
    },
    {
      icon: Building2,
      title: "Close with Confidence",
      description: "Support structured negotiations, diligence, and protected closings without relying on messy ad hoc workflows.",
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
