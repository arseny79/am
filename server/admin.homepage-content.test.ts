import { describe, expect, it, beforeEach } from "vitest";
import {
  resetMockSiteSettings,
  getMockSiteSettings,
  updateMockSiteSettings,
} from "./test-setup";

describe("admin.siteSettings - homepage content (mocked)", () => {
  beforeEach(() => {
    resetMockSiteSettings();
  });

  it("new homepage content fields default to null", () => {
    const s = getMockSiteSettings();
    expect(s.statConfidential).toBeNull();
    expect(s.statConfidentialLabel).toBeNull();
    expect(s.featuresEyebrow).toBeNull();
    expect(s.featuresHeadline).toBeNull();
    expect(s.featuresSubheadline).toBeNull();
    expect(s.featureCardsJson).toBeNull();
    expect(s.howItWorksEyebrow).toBeNull();
    expect(s.howItWorksHeadline).toBeNull();
    expect(s.howItWorksSubheadline).toBeNull();
    expect(s.howItWorksSellersJson).toBeNull();
    expect(s.howItWorksBuyersJson).toBeNull();
    expect(s.ctaEyebrow).toBeNull();
    expect(s.ctaHeadline).toBeNull();
    expect(s.ctaDescription).toBeNull();
    expect(s.activeOpportunitiesHeadline).toBeNull();
    expect(s.activeOpportunitiesSubheadline).toBeNull();
    // Phase 2 fields
    expect(s.statusBarLiveLabel).toBeNull();
    expect(s.statusBarActiveListingsLabel).toBeNull();
    expect(s.statusBarAccessLabel).toBeNull();
    expect(s.statusBarAccessValue).toBeNull();
    expect(s.statusBarConfidentialTagline).toBeNull();
    expect(s.heroBadge1Text).toBeNull();
    expect(s.heroBadge2Text).toBeNull();
    expect(s.heroTrust1Text).toBeNull();
    expect(s.heroTrust2Text).toBeNull();
    expect(s.heroTrust3Text).toBeNull();
    expect(s.ctaBrowseListingsText).toBeNull();
    expect(s.ctaBrowseListingsUrl).toBeNull();
    expect(s.ctaListBusinessText).toBeNull();
    expect(s.ctaListBusinessUrl).toBeNull();
    expect(s.ctaSignUpText).toBeNull();
    expect(s.activeOpportunitiesEyebrow).toBeNull();
    expect(s.activeOpportunitiesEyebrowBadge).toBeNull();
    expect(s.activeOpportunitiesSubmitBtn).toBeNull();
    expect(s.activeOpportunitiesMandateBtn).toBeNull();
    expect(s.activeOpportunitiesGhostCardsJson).toBeNull();
    expect(s.activeOpportunitiesViewListingBtn).toBeNull();
    expect(s.activeOpportunitiesViewAllBtnText).toBeNull();
    expect(s.activeOpportunitiesFilterAllLabel).toBeNull();
    expect(s.heroDealCardEmptyJson).toBeNull();
    expect(s.heroDealCardCuratedLabel).toBeNull();
    expect(s.heroDealCardManuallyReviewedLabel).toBeNull();
    expect(s.navMarketplaceLabel).toBeNull();
    expect(s.navBuyerMandatesLabel).toBeNull();
    expect(s.navSellBusinessLabel).toBeNull();
    expect(s.navHowItWorksLabel).toBeNull();
    expect(s.navLoginLabel).toBeNull();
    expect(s.footerTagline).toBeNull();
    expect(s.footerDisclaimer).toBeNull();
    expect(s.footerLinksJson).toBeNull();
    expect(s.footerCopyrightText).toBeNull();
  });

  it("saves and retrieves the proof ribbon confidential slot", () => {
    updateMockSiteSettings({
      statConfidential: "100% Private",
      statConfidentialLabel: "Listings",
    });
    const s = getMockSiteSettings();
    expect(s.statConfidential).toBe("100% Private");
    expect(s.statConfidentialLabel).toBe("Listings");
  });

  it("saves and retrieves features section scalars", () => {
    updateMockSiteSettings({
      featuresEyebrow: "Our Edge",
      featuresHeadline: "What Makes AM Different",
      featuresSubheadline: "Curated, confidential, iGaming-native.",
    });
    const s = getMockSiteSettings();
    expect(s.featuresEyebrow).toBe("Our Edge");
    expect(s.featuresHeadline).toBe("What Makes AM Different");
    expect(s.featuresSubheadline).toBe("Curated, confidential, iGaming-native.");
  });

  it("stores feature cards as valid JSON and round-trips correctly", () => {
    const cards = [
      { title: "Card 1", description: "Desc 1" },
      { title: "Card 2", description: "Desc 2" },
    ];
    updateMockSiteSettings({ featureCardsJson: JSON.stringify(cards) });
    const s = getMockSiteSettings();
    expect(s.featureCardsJson).not.toBeNull();
    const parsed = JSON.parse(s.featureCardsJson!);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].title).toBe("Card 1");
    expect(parsed[1].description).toBe("Desc 2");
  });

  it("saves how-it-works section scalars", () => {
    updateMockSiteSettings({
      howItWorksEyebrow: "The Process",
      howItWorksHeadline: "Simple Steps",
      howItWorksSubheadline: "From listing to introduction.",
    });
    const s = getMockSiteSettings();
    expect(s.howItWorksEyebrow).toBe("The Process");
    expect(s.howItWorksHeadline).toBe("Simple Steps");
    expect(s.howItWorksSubheadline).toBe("From listing to introduction.");
  });

  it("stores seller and buyer steps as valid JSON", () => {
    const sellersJson = JSON.stringify({
      label: "For Sellers",
      subtitle: "Sell your iGaming asset",
      steps: [{ title: "Apply", desc: "Submit details" }],
    });
    const buyersJson = JSON.stringify({
      label: "For Buyers",
      subtitle: "Find your next acquisition",
      steps: [{ title: "Qualify", desc: "Complete your profile" }],
    });
    updateMockSiteSettings({
      howItWorksSellersJson: sellersJson,
      howItWorksBuyersJson: buyersJson,
    });
    const s = getMockSiteSettings();
    const sellers = JSON.parse(s.howItWorksSellersJson!);
    const buyers = JSON.parse(s.howItWorksBuyersJson!);
    expect(sellers.label).toBe("For Sellers");
    expect(sellers.steps[0].title).toBe("Apply");
    expect(buyers.label).toBe("For Buyers");
    expect(buyers.steps[0].title).toBe("Qualify");
  });

  it("saves CTA section fields", () => {
    updateMockSiteSettings({
      ctaEyebrow: "Get Started",
      ctaHeadline: "List or Buy an iGaming Asset Today",
      ctaDescription: "Join the curated marketplace for iGaming M&A.",
    });
    const s = getMockSiteSettings();
    expect(s.ctaEyebrow).toBe("Get Started");
    expect(s.ctaHeadline).toBe("List or Buy an iGaming Asset Today");
    expect(s.ctaDescription).toBe("Join the curated marketplace for iGaming M&A.");
  });

  it("saves active opportunities section fields", () => {
    updateMockSiteSettings({
      activeOpportunitiesHeadline: "Current Deals",
      activeOpportunitiesSubheadline: "Manually reviewed iGaming assets.",
    });
    const s = getMockSiteSettings();
    expect(s.activeOpportunitiesHeadline).toBe("Current Deals");
    expect(s.activeOpportunitiesSubheadline).toBe("Manually reviewed iGaming assets.");
  });

  it("partial updates do not clear unrelated fields", () => {
    updateMockSiteSettings({
      featuresEyebrow: "Initial",
      ctaEyebrow: "CTA Initial",
    });
    // Update only ctaEyebrow
    updateMockSiteSettings({ ctaEyebrow: "CTA Updated" });
    const s = getMockSiteSettings();
    expect(s.featuresEyebrow).toBe("Initial");
    expect(s.ctaEyebrow).toBe("CTA Updated");
  });

  it("allows clearing fields by setting to null", () => {
    updateMockSiteSettings({ featuresHeadline: "Temp Headline" });
    updateMockSiteSettings({ featuresHeadline: null });
    const s = getMockSiteSettings();
    expect(s.featuresHeadline).toBeNull();
  });

  it("saves status bar fields", () => {
    updateMockSiteSettings({
      statusBarLiveLabel: "LIVE NOW",
      statusBarActiveListingsLabel: "Listings:",
      statusBarAccessLabel: "Access:",
      statusBarAccessValue: "Vetted Buyers Only",
      statusBarConfidentialTagline: "NDA Protected",
    });
    const s = getMockSiteSettings();
    expect(s.statusBarLiveLabel).toBe("LIVE NOW");
    expect(s.statusBarActiveListingsLabel).toBe("Listings:");
    expect(s.statusBarAccessLabel).toBe("Access:");
    expect(s.statusBarAccessValue).toBe("Vetted Buyers Only");
    expect(s.statusBarConfidentialTagline).toBe("NDA Protected");
  });

  it("saves hero badge and trust strip fields", () => {
    updateMockSiteSettings({
      heroBadge1Text: "Verified Listings",
      heroBadge2Text: "Private by Default",
      heroTrust1Text: "Seller Controls Access",
      heroTrust2Text: "Verified Buyers",
      heroTrust3Text: "NDA Financials",
    });
    const s = getMockSiteSettings();
    expect(s.heroBadge1Text).toBe("Verified Listings");
    expect(s.heroBadge2Text).toBe("Private by Default");
    expect(s.heroTrust1Text).toBe("Seller Controls Access");
    expect(s.heroTrust2Text).toBe("Verified Buyers");
    expect(s.heroTrust3Text).toBe("NDA Financials");
  });

  it("saves CTA button labels and URLs", () => {
    updateMockSiteSettings({
      ctaBrowseListingsText: "Explore Deals",
      ctaBrowseListingsUrl: "/listings",
      ctaListBusinessText: "Sell Your Asset",
      ctaListBusinessUrl: "/submit",
      ctaSignUpText: "Create Account",
    });
    const s = getMockSiteSettings();
    expect(s.ctaBrowseListingsText).toBe("Explore Deals");
    expect(s.ctaBrowseListingsUrl).toBe("/listings");
    expect(s.ctaListBusinessText).toBe("Sell Your Asset");
    expect(s.ctaListBusinessUrl).toBe("/submit");
    expect(s.ctaSignUpText).toBe("Create Account");
  });

  it("stores ghost cards JSON for active opportunities", () => {
    const ghostCards = [
      { type: "iGaming Operator", region: "Malta", badge: "Private" },
      { type: "B2B SaaS", region: "EU Remote", badge: "NDA Required" },
    ];
    updateMockSiteSettings({ activeOpportunitiesGhostCardsJson: JSON.stringify(ghostCards) });
    const s = getMockSiteSettings();
    const parsed = JSON.parse(s.activeOpportunitiesGhostCardsJson!);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].type).toBe("iGaming Operator");
    expect(parsed[1].badge).toBe("NDA Required");
  });

  it("saves hero deal card fields", () => {
    const emptyState = { title: "Private Asset", category: "B2B Tech", region: "Global" };
    updateMockSiteSettings({
      heroDealCardCuratedLabel: "Featured",
      heroDealCardManuallyReviewedLabel: "Reviewed",
      heroDealCardEmptyJson: JSON.stringify(emptyState),
    });
    const s = getMockSiteSettings();
    expect(s.heroDealCardCuratedLabel).toBe("Featured");
    expect(s.heroDealCardManuallyReviewedLabel).toBe("Reviewed");
    const parsed = JSON.parse(s.heroDealCardEmptyJson!);
    expect(parsed.title).toBe("Private Asset");
  });

  it("saves navigation labels", () => {
    updateMockSiteSettings({
      navMarketplaceLabel: "Deals",
      navBuyerMandatesLabel: "Buy",
      navSellBusinessLabel: "Sell",
      navHowItWorksLabel: "Learn",
      navLoginLabel: "Sign In",
    });
    const s = getMockSiteSettings();
    expect(s.navMarketplaceLabel).toBe("Deals");
    expect(s.navBuyerMandatesLabel).toBe("Buy");
    expect(s.navSellBusinessLabel).toBe("Sell");
    expect(s.navHowItWorksLabel).toBe("Learn");
    expect(s.navLoginLabel).toBe("Sign In");
  });

  it("saves footer content fields", () => {
    updateMockSiteSettings({
      footerTagline: "The iGaming M&A platform.",
      footerDisclaimer: "This is not investment advice.",
      footerCopyrightText: "All rights reserved.",
    });
    const s = getMockSiteSettings();
    expect(s.footerTagline).toBe("The iGaming M&A platform.");
    expect(s.footerDisclaimer).toBe("This is not investment advice.");
    expect(s.footerCopyrightText).toBe("All rights reserved.");
  });

  it("stores footer links JSON and round-trips correctly", () => {
    const footerLinks = {
      columns: [
        { heading: "Deals", links: [{ label: "Browse", href: "/marketplace" }] },
        { heading: "Info", links: [{ label: "About", href: "/about" }] },
      ],
      legalHeading: "Compliance",
    };
    updateMockSiteSettings({ footerLinksJson: JSON.stringify(footerLinks) });
    const s = getMockSiteSettings();
    const parsed = JSON.parse(s.footerLinksJson!);
    expect(parsed.columns).toHaveLength(2);
    expect(parsed.columns[0].heading).toBe("Deals");
    expect(parsed.legalHeading).toBe("Compliance");
  });

  it("saves active opportunities button labels", () => {
    updateMockSiteSettings({
      activeOpportunitiesViewListingBtn: "Open Deal",
      activeOpportunitiesViewAllBtnText: "Browse All {count} Assets",
      activeOpportunitiesFilterAllLabel: "All Deals",
    });
    const s = getMockSiteSettings();
    expect(s.activeOpportunitiesViewListingBtn).toBe("Open Deal");
    expect(s.activeOpportunitiesViewAllBtnText).toBe("Browse All {count} Assets");
    expect(s.activeOpportunitiesFilterAllLabel).toBe("All Deals");
  });
});
