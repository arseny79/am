/**
 * Homepage Content Configuration — Acquisitions.market
 *
 * Customize all homepage content here without touching the code.
 * Simply edit the values below and the changes will appear on your homepage.
 */

import { LucideIcon, Building2, TrendingUp, Shield, MessageSquare, Bot, Search } from "lucide-react";

export interface HeroSection {
  headline: string;
  highlightedWord?: string;
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
  value: string;
  label: string;
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
  hero: {
    headline: "Buy & Sell iGaming Businesses",
    highlightedWord: "iGaming",
    subheadline: "The M&A Marketplace Built for the Industry",
    description:
      "From online casinos and sportsbooks to affiliate networks and gaming licenses — Acquisitions.market connects serious buyers with verified sellers. No guesswork, no hidden fees. Only pay when your deal closes.",
    primaryCTA: {
      text: "List Your Business Free",
      href: "/create-listing",
    },
    secondaryCTA: {
      text: "Browse Listings",
      href: "/marketplace",
    },
  },

  trustSignals: [
    {
      value: "$0",
      label: "Upfront to list",
    },
    {
      value: "100+",
      label: "Active listings",
    },
    {
      value: "🔒",
      label: "Escrow Protected",
    },
  ],

  featuresHeadline: "Everything You Need in One Place",
  featuresSubheadline:
    "Purpose-built for iGaming M&A — structured deal flow, AI-powered advisors, and compliance-ready workflows from LOI to close.",

  features: [
    {
      icon: Search,
      title: "Find iGaming Businesses & Assets",
      description:
        "Browse casinos, sportsbooks, affiliate sites, gaming licenses, player databases and more — filtered by jurisdiction, revenue, and business type.",
    },
    {
      icon: Bot,
      title: "AI-Powered Deal Advisors",
      description:
        "Access AI Legal Advisors, Deal Success Managers, and Due Diligence Assistants that guide you through every stage of the transaction.",
    },
    {
      icon: Shield,
      title: "NDA & Document Management",
      description:
        "Built-in NDA signing, secure document rooms, and confidential information sharing — all tracked with a full audit trail.",
    },
    {
      icon: MessageSquare,
      title: "Direct Buyer–Seller Communication",
      description:
        "No middlemen. Connect directly with verified counterparties and negotiate in a secure, structured deal room.",
    },
    {
      icon: TrendingUp,
      title: "Full Deal Pipeline Visibility",
      description:
        "Track every stage from initial contact through due diligence, LOI, and escrow in a single, clear dashboard.",
    },
    {
      icon: Building2,
      title: "Close with Confidence",
      description:
        "Integrated escrow protection and multi-currency support (fiat & crypto) ensure secure, transparent transactions from offer to close.",
    },
  ],
};
