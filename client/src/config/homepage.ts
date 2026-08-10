/**
 * Homepage Content Configuration
 * 
 * Customize all homepage content here without touching the code.
 * Simply edit the values below and the changes will appear on your homepage.
 */

import { LucideIcon, Building2, TrendingUp, Shield, MessageSquare, Users, Search } from "lucide-react";

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

export const homepageContent: HomepageContent = {
  hero: {
    headline: "Private M&A for Crypto-Friendly iGaming",
    highlightedWord: "iGaming",
    subheadline: "Curated businesses, technology and traffic assets",
    description:
      "Manually reviewed listings. Qualified buyers. Seller-controlled access. Operating iGaming businesses, B2B technology platforms and affiliate, media and traffic assets. Transaction values from €250k to €20m, with exceptions reviewed case by case.",
    primaryCTA: {
      text: "Submit a Business",
      href: "/create-listing",
    },
    secondaryCTA: {
      text: "Share Your Acquisition Mandate",
      href: "/buy-asset",
    },
  },

  trustSignals: [
    {
      value: "Manual Review",
      label: "Every Listing",
    },
    {
      value: "Confidential",
      label: "By Design",
    },
    {
      value: "€250k–€20m",
      label: "Target Range",
    },
  ],

  featuresHeadline: "Built for Private iGaming Deals",
  featuresSubheadline:
    "From curated sourcing to qualified introductions, AM handles the confidential groundwork so parties can focus on the deal.",

  features: [
    {
      icon: Search,
      title: "Curated iGaming Opportunities",
      description:
        "Browse privately listed iGaming businesses, B2B technology platforms and affiliate, media and traffic assets — each manually reviewed before publication.",
    },
    {
      icon: Users,
      title: "Qualified Buyers Only",
      description:
        "Each buyer completes a profile review before accessing confidential information. Sellers choose who sees their deal and when.",
    },
    {
      icon: Shield,
      title: "Confidential by Design",
      description:
        "NDA workflows and seller-controlled access protect sensitive financials and operating data throughout the process.",
    },
    {
      icon: TrendingUp,
      title: "iGaming-Native Diligence",
      description:
        "Opportunities include iGaming-relevant context — licensing status, revenue model, traffic sources and regulatory exposure.",
    },
    {
      icon: MessageSquare,
      title: "Direct Introductions",
      description:
        "Once access is granted, buyers and sellers communicate directly. No intermediated auction, no anonymous bidding.",
    },
    {
      icon: Building2,
      title: "External Advisors & Closing",
      description:
        "AM facilitates introductions and diligence access. Final negotiations and legal closing are handled by the parties and their own advisors.",
    },
  ],
};
