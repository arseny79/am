import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";
import { adminVerificationRouter } from "./adminVerificationRouter";
import { adminKYCRouter } from "./adminKYCRouter";
import { apiKeyValidationRouter } from "./apiKeyValidationRouter";
import { adminEscrowRouter } from "./adminEscrowRouter";
import { adminTaxonomyRouter } from "./adminTaxonomyRouter";
import { adminChainsRouter } from "./adminChainsRouter";
import { adminWalletVerificationRouter } from "./adminWalletVerificationRouter";
import { getDb, createAdminAuditLog } from "../db";
import { siteSettings, users } from "../../drizzle/schema";
import { desc, sql, and, gte, lte } from "drizzle-orm";
import { generateSitemap } from "../sitemap";
import { runKYCReminderJob } from "../jobs/kycReminderJob";
import { getJobStatus } from "../jobs/scheduler";
import { dateToTimestamp } from "../lib/dbHelpers";

export const adminRouter = router({
  verification: adminVerificationRouter,
  kyc: adminKYCRouter,
  apiKeyValidation: apiKeyValidationRouter,
  escrow: adminEscrowRouter,
  taxonomy: adminTaxonomyRouter,
  chains: adminChainsRouter,
  wallet: adminWalletVerificationRouter,
  // Get site settings (analytics configuration) - public so logo can be fetched by anyone
  getSiteSettings: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const result = await db.select().from(siteSettings).limit(1);
    
    // Return first row or default empty values
    return result[0] || {
      id: 0,
      googleAnalyticsId: null,
      statcounterId: null,
      statcounterSecurity: null,
      siteName: null,
      siteUrl: null,
      twitterHandle: null,
      defaultMetaRobots: null,
      homeSeoTitle: null,
      homeSeoDescription: null,
      marketplaceSeoTitle: null,
      marketplaceSeoDescription: null,
      createListingSeoTitle: null,
      createListingSeoDescription: null,
      buyAssetSeoTitle: null,
      buyAssetSeoDescription: null,
      pricingSeoTitle: null,
      pricingSeoDescription: null,
      valuationToolSeoTitle: null,
      valuationToolSeoDescription: null,
      verifyStripeSeoTitle: null,
      verifyStripeSeoDescription: null,
      statConfidential: null,
      statConfidentialLabel: null,
      featuresEyebrow: null,
      featuresHeadline: null,
      featuresSubheadline: null,
      featureCardsJson: null,
      howItWorksEyebrow: null,
      howItWorksHeadline: null,
      howItWorksSubheadline: null,
      howItWorksSellersJson: null,
      howItWorksBuyersJson: null,
      ctaEyebrow: null,
      ctaHeadline: null,
      ctaDescription: null,
      activeOpportunitiesHeadline: null,
      activeOpportunitiesSubheadline: null,
      statusBarLiveLabel: null,
      statusBarActiveListingsLabel: null,
      statusBarAccessLabel: null,
      statusBarAccessValue: null,
      statusBarConfidentialTagline: null,
      heroBadge1Text: null,
      heroBadge2Text: null,
      heroTrust1Text: null,
      heroTrust2Text: null,
      heroTrust3Text: null,
      ctaBrowseListingsText: null,
      ctaBrowseListingsUrl: null,
      ctaListBusinessText: null,
      ctaListBusinessUrl: null,
      ctaSignUpText: null,
      activeOpportunitiesEyebrow: null,
      activeOpportunitiesEyebrowBadge: null,
      activeOpportunitiesSubmitBtn: null,
      activeOpportunitiesMandateBtn: null,
      activeOpportunitiesGhostCardsJson: null,
      activeOpportunitiesViewListingBtn: null,
      activeOpportunitiesViewAllBtnText: null,
      activeOpportunitiesFilterAllLabel: null,
      heroDealCardEmptyJson: null,
      heroDealCardCuratedLabel: null,
      heroDealCardManuallyReviewedLabel: null,
      navMarketplaceLabel: null,
      navBuyerMandatesLabel: null,
      navSellBusinessLabel: null,
      navHowItWorksLabel: null,
      navLoginLabel: null,
      footerTagline: null,
      footerDisclaimer: null,
      footerLinksJson: null,
      footerCopyrightText: null,
      updatedAt: new Date(),
      updatedBy: null,
    };
  }),

  // Update site settings (analytics configuration + SEO metadata)
  updateSiteSettings: adminProcedure
    .input(
      z.object({
        // Analytics
        googleAnalyticsId: z.string().nullable().optional(),
        statcounterId: z.string().nullable().optional(),
        statcounterSecurity: z.string().nullable().optional(),
        // SEO Metadata
        seoTitle: z.string().nullable().optional(),
        seoDescription: z.string().nullable().optional(),
        ogTitle: z.string().nullable().optional(),
        ogDescription: z.string().nullable().optional(),
        ogImage: z.string().nullable().optional(),
        siteName: z.string().nullable().optional(),
        siteUrl: z.string().url().nullable().optional(),
        twitterHandle: z.string().nullable().optional(),
        defaultMetaRobots: z.string().nullable().optional(),
        homeSeoTitle: z.string().nullable().optional(),
        homeSeoDescription: z.string().nullable().optional(),
        marketplaceSeoTitle: z.string().nullable().optional(),
        marketplaceSeoDescription: z.string().nullable().optional(),
        createListingSeoTitle: z.string().nullable().optional(),
        createListingSeoDescription: z.string().nullable().optional(),
        buyAssetSeoTitle: z.string().nullable().optional(),
        buyAssetSeoDescription: z.string().nullable().optional(),
        pricingSeoTitle: z.string().nullable().optional(),
        pricingSeoDescription: z.string().nullable().optional(),
        valuationToolSeoTitle: z.string().nullable().optional(),
        valuationToolSeoDescription: z.string().nullable().optional(),
        verifyStripeSeoTitle: z.string().nullable().optional(),
        verifyStripeSeoDescription: z.string().nullable().optional(),
        // Homepage Hero Content
        heroHeadline: z.string().nullable().optional(),
        heroSubheadline: z.string().nullable().optional(),
        heroDescription: z.string().nullable().optional(),
        heroPrimaryButtonText: z.string().nullable().optional(),
        heroPrimaryButtonUrl: z.string().nullable().optional(),
        heroSecondaryButtonText: z.string().nullable().optional(),
        heroSecondaryButtonUrl: z.string().nullable().optional(),
        // Homepage Stats Section
        statGmv: z.string().nullable().optional(),
        statGmvLabel: z.string().nullable().optional(),
        statActiveListings: z.string().nullable().optional(),
        statActiveListingsLabel: z.string().nullable().optional(),
        statEscrowProtected: z.string().nullable().optional(),
        statEscrowProtectedLabel: z.string().nullable().optional(),
        // Valuation Tool Footer
        valuationDataSources: z.string().nullable().optional(),
        valuationDisclaimer: z.string().nullable().optional(),
        // Valuation Tool Header
        valuationToolHeading: z.string().nullable().optional(),
        valuationToolSubheading: z.string().nullable().optional(),
        // Marketplace Page Header
        marketplaceHeading: z.string().nullable().optional(),
        marketplaceSubheading: z.string().nullable().optional(),
        // Buy Asset Page Header
        buyAssetHeading: z.string().nullable().optional(),
        buyAssetSubheading: z.string().nullable().optional(),
        // Livechat Settings
        livechatScript: z.string().nullable().optional(),
        livechatEnabledPublic: z.boolean().optional(),
        livechatEnabledAdmin: z.boolean().optional(),
        // Launch mode
        launchMode: z.enum(["pre_launch", "live"]).optional(),
        // Homepage proof ribbon — 4th slot
        statConfidential: z.string().nullable().optional(),
        statConfidentialLabel: z.string().nullable().optional(),
        // Homepage Features Section
        featuresEyebrow: z.string().nullable().optional(),
        featuresHeadline: z.string().nullable().optional(),
        featuresSubheadline: z.string().nullable().optional(),
        featureCardsJson: z.string().nullable().optional(),
        // Homepage How It Works Section
        howItWorksEyebrow: z.string().nullable().optional(),
        howItWorksHeadline: z.string().nullable().optional(),
        howItWorksSubheadline: z.string().nullable().optional(),
        howItWorksSellersJson: z.string().nullable().optional(),
        howItWorksBuyersJson: z.string().nullable().optional(),
        // Homepage CTA Section
        ctaEyebrow: z.string().nullable().optional(),
        ctaHeadline: z.string().nullable().optional(),
        ctaDescription: z.string().nullable().optional(),
        // Active Opportunities Section
        activeOpportunitiesHeadline: z.string().nullable().optional(),
        activeOpportunitiesSubheadline: z.string().nullable().optional(),
        // Homepage status bar
        statusBarLiveLabel: z.string().nullable().optional(),
        statusBarActiveListingsLabel: z.string().nullable().optional(),
        statusBarAccessLabel: z.string().nullable().optional(),
        statusBarAccessValue: z.string().nullable().optional(),
        statusBarConfidentialTagline: z.string().nullable().optional(),
        // Hero badges and trust strip
        heroBadge1Text: z.string().nullable().optional(),
        heroBadge2Text: z.string().nullable().optional(),
        heroTrust1Text: z.string().nullable().optional(),
        heroTrust2Text: z.string().nullable().optional(),
        heroTrust3Text: z.string().nullable().optional(),
        // CTA section buttons
        ctaBrowseListingsText: z.string().nullable().optional(),
        ctaBrowseListingsUrl: z.string().nullable().optional(),
        ctaListBusinessText: z.string().nullable().optional(),
        ctaListBusinessUrl: z.string().nullable().optional(),
        ctaSignUpText: z.string().nullable().optional(),
        // Active Opportunities extended
        activeOpportunitiesEyebrow: z.string().nullable().optional(),
        activeOpportunitiesEyebrowBadge: z.string().nullable().optional(),
        activeOpportunitiesSubmitBtn: z.string().nullable().optional(),
        activeOpportunitiesMandateBtn: z.string().nullable().optional(),
        activeOpportunitiesGhostCardsJson: z.string().nullable().optional(),
        activeOpportunitiesViewListingBtn: z.string().nullable().optional(),
        activeOpportunitiesViewAllBtnText: z.string().nullable().optional(),
        activeOpportunitiesFilterAllLabel: z.string().nullable().optional(),
        // Hero deal card
        heroDealCardEmptyJson: z.string().nullable().optional(),
        heroDealCardCuratedLabel: z.string().nullable().optional(),
        heroDealCardManuallyReviewedLabel: z.string().nullable().optional(),
        // Navigation labels (site-wide)
        navMarketplaceLabel: z.string().nullable().optional(),
        navBuyerMandatesLabel: z.string().nullable().optional(),
        navSellBusinessLabel: z.string().nullable().optional(),
        navHowItWorksLabel: z.string().nullable().optional(),
        navLoginLabel: z.string().nullable().optional(),
        // Footer (site-wide)
        footerTagline: z.string().nullable().optional(),
        footerDisclaimer: z.string().nullable().optional(),
        footerLinksJson: z.string().nullable().optional(),
        footerCopyrightText: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if settings row exists
      const existing = await db.select().from(siteSettings).limit(1);

      if (existing.length === 0) {
        // Insert new row
        await db.insert(siteSettings).values({
          googleAnalyticsId: input.googleAnalyticsId !== undefined ? input.googleAnalyticsId : null,
          statcounterId: input.statcounterId !== undefined ? input.statcounterId : null,
          statcounterSecurity: input.statcounterSecurity !== undefined ? input.statcounterSecurity : null,
          seoTitle: input.seoTitle !== undefined ? input.seoTitle : null,
          seoDescription: input.seoDescription !== undefined ? input.seoDescription : null,
          ogTitle: input.ogTitle !== undefined ? input.ogTitle : null,
          ogDescription: input.ogDescription !== undefined ? input.ogDescription : null,
          ogImage: input.ogImage !== undefined ? input.ogImage : null,
          siteName: input.siteName !== undefined ? input.siteName : null,
          siteUrl: input.siteUrl !== undefined ? input.siteUrl : null,
          twitterHandle: input.twitterHandle !== undefined ? input.twitterHandle : null,
          defaultMetaRobots: input.defaultMetaRobots !== undefined ? input.defaultMetaRobots : null,
          homeSeoTitle: input.homeSeoTitle !== undefined ? input.homeSeoTitle : null,
          homeSeoDescription: input.homeSeoDescription !== undefined ? input.homeSeoDescription : null,
          marketplaceSeoTitle: input.marketplaceSeoTitle !== undefined ? input.marketplaceSeoTitle : null,
          marketplaceSeoDescription: input.marketplaceSeoDescription !== undefined ? input.marketplaceSeoDescription : null,
          createListingSeoTitle: input.createListingSeoTitle !== undefined ? input.createListingSeoTitle : null,
          createListingSeoDescription: input.createListingSeoDescription !== undefined ? input.createListingSeoDescription : null,
          buyAssetSeoTitle: input.buyAssetSeoTitle !== undefined ? input.buyAssetSeoTitle : null,
          buyAssetSeoDescription: input.buyAssetSeoDescription !== undefined ? input.buyAssetSeoDescription : null,
          pricingSeoTitle: input.pricingSeoTitle !== undefined ? input.pricingSeoTitle : null,
          pricingSeoDescription: input.pricingSeoDescription !== undefined ? input.pricingSeoDescription : null,
          valuationToolSeoTitle: input.valuationToolSeoTitle !== undefined ? input.valuationToolSeoTitle : null,
          valuationToolSeoDescription: input.valuationToolSeoDescription !== undefined ? input.valuationToolSeoDescription : null,
          verifyStripeSeoTitle: input.verifyStripeSeoTitle !== undefined ? input.verifyStripeSeoTitle : null,
          verifyStripeSeoDescription: input.verifyStripeSeoDescription !== undefined ? input.verifyStripeSeoDescription : null,
          heroHeadline: input.heroHeadline !== undefined ? input.heroHeadline : null,
          heroSubheadline: input.heroSubheadline !== undefined ? input.heroSubheadline : null,
          heroDescription: input.heroDescription !== undefined ? input.heroDescription : null,
          heroPrimaryButtonText: input.heroPrimaryButtonText !== undefined ? input.heroPrimaryButtonText : null,
          heroPrimaryButtonUrl: input.heroPrimaryButtonUrl !== undefined ? input.heroPrimaryButtonUrl : null,
          heroSecondaryButtonText: input.heroSecondaryButtonText !== undefined ? input.heroSecondaryButtonText : null,
          heroSecondaryButtonUrl: input.heroSecondaryButtonUrl !== undefined ? input.heroSecondaryButtonUrl : null,
          statGmv: input.statGmv !== undefined ? input.statGmv : null,
          statGmvLabel: input.statGmvLabel !== undefined ? input.statGmvLabel : null,
          statActiveListings: input.statActiveListings !== undefined ? input.statActiveListings : null,
          statActiveListingsLabel: input.statActiveListingsLabel !== undefined ? input.statActiveListingsLabel : null,
          statEscrowProtected: input.statEscrowProtected !== undefined ? input.statEscrowProtected : null,
          statEscrowProtectedLabel: input.statEscrowProtectedLabel !== undefined ? input.statEscrowProtectedLabel : null,
          valuationDataSources: input.valuationDataSources !== undefined ? input.valuationDataSources : null,
          valuationDisclaimer: input.valuationDisclaimer !== undefined ? input.valuationDisclaimer : null,
          valuationToolHeading: input.valuationToolHeading !== undefined ? input.valuationToolHeading : null,
          valuationToolSubheading: input.valuationToolSubheading !== undefined ? input.valuationToolSubheading : null,
          marketplaceHeading: input.marketplaceHeading !== undefined ? input.marketplaceHeading : null,
          marketplaceSubheading: input.marketplaceSubheading !== undefined ? input.marketplaceSubheading : null,
          buyAssetHeading: input.buyAssetHeading !== undefined ? input.buyAssetHeading : null,
          buyAssetSubheading: input.buyAssetSubheading !== undefined ? input.buyAssetSubheading : null,
          livechatScript: input.livechatScript !== undefined ? input.livechatScript : null,
          livechatEnabledPublic: input.livechatEnabledPublic !== undefined ? (input.livechatEnabledPublic ? 1 : 0) : 1,
          livechatEnabledAdmin: input.livechatEnabledAdmin !== undefined ? (input.livechatEnabledAdmin ? 1 : 0) : 0,
          launchMode: input.launchMode !== undefined ? input.launchMode : 'live',
          statConfidential: input.statConfidential !== undefined ? input.statConfidential : null,
          statConfidentialLabel: input.statConfidentialLabel !== undefined ? input.statConfidentialLabel : null,
          featuresEyebrow: input.featuresEyebrow !== undefined ? input.featuresEyebrow : null,
          featuresHeadline: input.featuresHeadline !== undefined ? input.featuresHeadline : null,
          featuresSubheadline: input.featuresSubheadline !== undefined ? input.featuresSubheadline : null,
          featureCardsJson: input.featureCardsJson !== undefined ? input.featureCardsJson : null,
          howItWorksEyebrow: input.howItWorksEyebrow !== undefined ? input.howItWorksEyebrow : null,
          howItWorksHeadline: input.howItWorksHeadline !== undefined ? input.howItWorksHeadline : null,
          howItWorksSubheadline: input.howItWorksSubheadline !== undefined ? input.howItWorksSubheadline : null,
          howItWorksSellersJson: input.howItWorksSellersJson !== undefined ? input.howItWorksSellersJson : null,
          howItWorksBuyersJson: input.howItWorksBuyersJson !== undefined ? input.howItWorksBuyersJson : null,
          ctaEyebrow: input.ctaEyebrow !== undefined ? input.ctaEyebrow : null,
          ctaHeadline: input.ctaHeadline !== undefined ? input.ctaHeadline : null,
          ctaDescription: input.ctaDescription !== undefined ? input.ctaDescription : null,
          activeOpportunitiesHeadline: input.activeOpportunitiesHeadline !== undefined ? input.activeOpportunitiesHeadline : null,
          activeOpportunitiesSubheadline: input.activeOpportunitiesSubheadline !== undefined ? input.activeOpportunitiesSubheadline : null,
          statusBarLiveLabel: input.statusBarLiveLabel !== undefined ? input.statusBarLiveLabel : null,
          statusBarActiveListingsLabel: input.statusBarActiveListingsLabel !== undefined ? input.statusBarActiveListingsLabel : null,
          statusBarAccessLabel: input.statusBarAccessLabel !== undefined ? input.statusBarAccessLabel : null,
          statusBarAccessValue: input.statusBarAccessValue !== undefined ? input.statusBarAccessValue : null,
          statusBarConfidentialTagline: input.statusBarConfidentialTagline !== undefined ? input.statusBarConfidentialTagline : null,
          heroBadge1Text: input.heroBadge1Text !== undefined ? input.heroBadge1Text : null,
          heroBadge2Text: input.heroBadge2Text !== undefined ? input.heroBadge2Text : null,
          heroTrust1Text: input.heroTrust1Text !== undefined ? input.heroTrust1Text : null,
          heroTrust2Text: input.heroTrust2Text !== undefined ? input.heroTrust2Text : null,
          heroTrust3Text: input.heroTrust3Text !== undefined ? input.heroTrust3Text : null,
          ctaBrowseListingsText: input.ctaBrowseListingsText !== undefined ? input.ctaBrowseListingsText : null,
          ctaBrowseListingsUrl: input.ctaBrowseListingsUrl !== undefined ? input.ctaBrowseListingsUrl : null,
          ctaListBusinessText: input.ctaListBusinessText !== undefined ? input.ctaListBusinessText : null,
          ctaListBusinessUrl: input.ctaListBusinessUrl !== undefined ? input.ctaListBusinessUrl : null,
          ctaSignUpText: input.ctaSignUpText !== undefined ? input.ctaSignUpText : null,
          activeOpportunitiesEyebrow: input.activeOpportunitiesEyebrow !== undefined ? input.activeOpportunitiesEyebrow : null,
          activeOpportunitiesEyebrowBadge: input.activeOpportunitiesEyebrowBadge !== undefined ? input.activeOpportunitiesEyebrowBadge : null,
          activeOpportunitiesSubmitBtn: input.activeOpportunitiesSubmitBtn !== undefined ? input.activeOpportunitiesSubmitBtn : null,
          activeOpportunitiesMandateBtn: input.activeOpportunitiesMandateBtn !== undefined ? input.activeOpportunitiesMandateBtn : null,
          activeOpportunitiesGhostCardsJson: input.activeOpportunitiesGhostCardsJson !== undefined ? input.activeOpportunitiesGhostCardsJson : null,
          activeOpportunitiesViewListingBtn: input.activeOpportunitiesViewListingBtn !== undefined ? input.activeOpportunitiesViewListingBtn : null,
          activeOpportunitiesViewAllBtnText: input.activeOpportunitiesViewAllBtnText !== undefined ? input.activeOpportunitiesViewAllBtnText : null,
          activeOpportunitiesFilterAllLabel: input.activeOpportunitiesFilterAllLabel !== undefined ? input.activeOpportunitiesFilterAllLabel : null,
          heroDealCardEmptyJson: input.heroDealCardEmptyJson !== undefined ? input.heroDealCardEmptyJson : null,
          heroDealCardCuratedLabel: input.heroDealCardCuratedLabel !== undefined ? input.heroDealCardCuratedLabel : null,
          heroDealCardManuallyReviewedLabel: input.heroDealCardManuallyReviewedLabel !== undefined ? input.heroDealCardManuallyReviewedLabel : null,
          navMarketplaceLabel: input.navMarketplaceLabel !== undefined ? input.navMarketplaceLabel : null,
          navBuyerMandatesLabel: input.navBuyerMandatesLabel !== undefined ? input.navBuyerMandatesLabel : null,
          navSellBusinessLabel: input.navSellBusinessLabel !== undefined ? input.navSellBusinessLabel : null,
          navHowItWorksLabel: input.navHowItWorksLabel !== undefined ? input.navHowItWorksLabel : null,
          navLoginLabel: input.navLoginLabel !== undefined ? input.navLoginLabel : null,
          footerTagline: input.footerTagline !== undefined ? input.footerTagline : null,
          footerDisclaimer: input.footerDisclaimer !== undefined ? input.footerDisclaimer : null,
          footerLinksJson: input.footerLinksJson !== undefined ? input.footerLinksJson : null,
          footerCopyrightText: input.footerCopyrightText !== undefined ? input.footerCopyrightText : null,
          updatedBy: ctx.user.id,
        });
      } else {
        // Update existing row - only update fields that are provided
        const updateData: Record<string, unknown> = {
          updatedBy: ctx.user.id,
          updatedAt: dateToTimestamp(new Date())!,
        };
        
        // Only include fields that were explicitly provided in the input
        if (input.googleAnalyticsId !== undefined) {
          updateData.googleAnalyticsId = input.googleAnalyticsId;
        }
        if (input.statcounterId !== undefined) {
          updateData.statcounterId = input.statcounterId;
        }
        if (input.statcounterSecurity !== undefined) {
          updateData.statcounterSecurity = input.statcounterSecurity;
        }
        if (input.seoTitle !== undefined) {
          updateData.seoTitle = input.seoTitle;
        }
        if (input.seoDescription !== undefined) {
          updateData.seoDescription = input.seoDescription;
        }
        if (input.ogTitle !== undefined) {
          updateData.ogTitle = input.ogTitle;
        }
        if (input.ogDescription !== undefined) {
          updateData.ogDescription = input.ogDescription;
        }
        if (input.ogImage !== undefined) {
          updateData.ogImage = input.ogImage;
        }
        if (input.siteName !== undefined) {
          updateData.siteName = input.siteName;
        }
        if (input.siteUrl !== undefined) {
          updateData.siteUrl = input.siteUrl;
        }
        if (input.twitterHandle !== undefined) {
          updateData.twitterHandle = input.twitterHandle;
        }
        if (input.defaultMetaRobots !== undefined) {
          updateData.defaultMetaRobots = input.defaultMetaRobots;
        }
        if (input.homeSeoTitle !== undefined) {
          updateData.homeSeoTitle = input.homeSeoTitle;
        }
        if (input.homeSeoDescription !== undefined) {
          updateData.homeSeoDescription = input.homeSeoDescription;
        }
        if (input.marketplaceSeoTitle !== undefined) {
          updateData.marketplaceSeoTitle = input.marketplaceSeoTitle;
        }
        if (input.marketplaceSeoDescription !== undefined) {
          updateData.marketplaceSeoDescription = input.marketplaceSeoDescription;
        }
        if (input.createListingSeoTitle !== undefined) {
          updateData.createListingSeoTitle = input.createListingSeoTitle;
        }
        if (input.createListingSeoDescription !== undefined) {
          updateData.createListingSeoDescription = input.createListingSeoDescription;
        }
        if (input.buyAssetSeoTitle !== undefined) {
          updateData.buyAssetSeoTitle = input.buyAssetSeoTitle;
        }
        if (input.buyAssetSeoDescription !== undefined) {
          updateData.buyAssetSeoDescription = input.buyAssetSeoDescription;
        }
        if (input.pricingSeoTitle !== undefined) {
          updateData.pricingSeoTitle = input.pricingSeoTitle;
        }
        if (input.pricingSeoDescription !== undefined) {
          updateData.pricingSeoDescription = input.pricingSeoDescription;
        }
        if (input.valuationToolSeoTitle !== undefined) {
          updateData.valuationToolSeoTitle = input.valuationToolSeoTitle;
        }
        if (input.valuationToolSeoDescription !== undefined) {
          updateData.valuationToolSeoDescription = input.valuationToolSeoDescription;
        }
        if (input.verifyStripeSeoTitle !== undefined) {
          updateData.verifyStripeSeoTitle = input.verifyStripeSeoTitle;
        }
        if (input.verifyStripeSeoDescription !== undefined) {
          updateData.verifyStripeSeoDescription = input.verifyStripeSeoDescription;
        }
        if (input.heroHeadline !== undefined) {
          updateData.heroHeadline = input.heroHeadline;
        }
        if (input.heroSubheadline !== undefined) {
          updateData.heroSubheadline = input.heroSubheadline;
        }
        if (input.heroDescription !== undefined) {
          updateData.heroDescription = input.heroDescription;
        }
        if (input.heroPrimaryButtonText !== undefined) {
          updateData.heroPrimaryButtonText = input.heroPrimaryButtonText;
        }
        if (input.heroPrimaryButtonUrl !== undefined) {
          updateData.heroPrimaryButtonUrl = input.heroPrimaryButtonUrl;
        }
        if (input.heroSecondaryButtonText !== undefined) {
          updateData.heroSecondaryButtonText = input.heroSecondaryButtonText;
        }
        if (input.heroSecondaryButtonUrl !== undefined) {
          updateData.heroSecondaryButtonUrl = input.heroSecondaryButtonUrl;
        }
        if (input.statGmv !== undefined) {
          updateData.statGmv = input.statGmv;
        }
        if (input.statGmvLabel !== undefined) {
          updateData.statGmvLabel = input.statGmvLabel;
        }
        if (input.statActiveListings !== undefined) {
          updateData.statActiveListings = input.statActiveListings;
        }
        if (input.statActiveListingsLabel !== undefined) {
          updateData.statActiveListingsLabel = input.statActiveListingsLabel;
        }
        if (input.statEscrowProtected !== undefined) {
          updateData.statEscrowProtected = input.statEscrowProtected;
        }
        if (input.statEscrowProtectedLabel !== undefined) {
          updateData.statEscrowProtectedLabel = input.statEscrowProtectedLabel;
        }
        if (input.valuationDataSources !== undefined) {
          updateData.valuationDataSources = input.valuationDataSources;
        }
        if (input.valuationDisclaimer !== undefined) {
          updateData.valuationDisclaimer = input.valuationDisclaimer;
        }
        if (input.valuationToolHeading !== undefined) {
          updateData.valuationToolHeading = input.valuationToolHeading;
        }
        if (input.valuationToolSubheading !== undefined) {
          updateData.valuationToolSubheading = input.valuationToolSubheading;
        }
        if (input.marketplaceHeading !== undefined) {
          updateData.marketplaceHeading = input.marketplaceHeading;
        }
        if (input.marketplaceSubheading !== undefined) {
          updateData.marketplaceSubheading = input.marketplaceSubheading;
        }
        if (input.buyAssetHeading !== undefined) {
          updateData.buyAssetHeading = input.buyAssetHeading;
        }
        if (input.buyAssetSubheading !== undefined) {
          updateData.buyAssetSubheading = input.buyAssetSubheading;
        }
        if (input.livechatScript !== undefined) {
          updateData.livechatScript = input.livechatScript;
        }
        if (input.livechatEnabledPublic !== undefined) {
          updateData.livechatEnabledPublic = input.livechatEnabledPublic ? 1 : 0;
        }
        if (input.livechatEnabledAdmin !== undefined) {
          updateData.livechatEnabledAdmin = input.livechatEnabledAdmin ? 1 : 0;
        }
        if (input.launchMode !== undefined) {
          updateData.launchMode = input.launchMode;
        }
        if (input.statConfidential !== undefined) {
          updateData.statConfidential = input.statConfidential;
        }
        if (input.statConfidentialLabel !== undefined) {
          updateData.statConfidentialLabel = input.statConfidentialLabel;
        }
        if (input.featuresEyebrow !== undefined) {
          updateData.featuresEyebrow = input.featuresEyebrow;
        }
        if (input.featuresHeadline !== undefined) {
          updateData.featuresHeadline = input.featuresHeadline;
        }
        if (input.featuresSubheadline !== undefined) {
          updateData.featuresSubheadline = input.featuresSubheadline;
        }
        if (input.featureCardsJson !== undefined) {
          updateData.featureCardsJson = input.featureCardsJson;
        }
        if (input.howItWorksEyebrow !== undefined) {
          updateData.howItWorksEyebrow = input.howItWorksEyebrow;
        }
        if (input.howItWorksHeadline !== undefined) {
          updateData.howItWorksHeadline = input.howItWorksHeadline;
        }
        if (input.howItWorksSubheadline !== undefined) {
          updateData.howItWorksSubheadline = input.howItWorksSubheadline;
        }
        if (input.howItWorksSellersJson !== undefined) {
          updateData.howItWorksSellersJson = input.howItWorksSellersJson;
        }
        if (input.howItWorksBuyersJson !== undefined) {
          updateData.howItWorksBuyersJson = input.howItWorksBuyersJson;
        }
        if (input.ctaEyebrow !== undefined) {
          updateData.ctaEyebrow = input.ctaEyebrow;
        }
        if (input.ctaHeadline !== undefined) {
          updateData.ctaHeadline = input.ctaHeadline;
        }
        if (input.ctaDescription !== undefined) {
          updateData.ctaDescription = input.ctaDescription;
        }
        if (input.activeOpportunitiesHeadline !== undefined) {
          updateData.activeOpportunitiesHeadline = input.activeOpportunitiesHeadline;
        }
        if (input.activeOpportunitiesSubheadline !== undefined) {
          updateData.activeOpportunitiesSubheadline = input.activeOpportunitiesSubheadline;
        }
        if (input.statusBarLiveLabel !== undefined) updateData.statusBarLiveLabel = input.statusBarLiveLabel;
        if (input.statusBarActiveListingsLabel !== undefined) updateData.statusBarActiveListingsLabel = input.statusBarActiveListingsLabel;
        if (input.statusBarAccessLabel !== undefined) updateData.statusBarAccessLabel = input.statusBarAccessLabel;
        if (input.statusBarAccessValue !== undefined) updateData.statusBarAccessValue = input.statusBarAccessValue;
        if (input.statusBarConfidentialTagline !== undefined) updateData.statusBarConfidentialTagline = input.statusBarConfidentialTagline;
        if (input.heroBadge1Text !== undefined) updateData.heroBadge1Text = input.heroBadge1Text;
        if (input.heroBadge2Text !== undefined) updateData.heroBadge2Text = input.heroBadge2Text;
        if (input.heroTrust1Text !== undefined) updateData.heroTrust1Text = input.heroTrust1Text;
        if (input.heroTrust2Text !== undefined) updateData.heroTrust2Text = input.heroTrust2Text;
        if (input.heroTrust3Text !== undefined) updateData.heroTrust3Text = input.heroTrust3Text;
        if (input.ctaBrowseListingsText !== undefined) updateData.ctaBrowseListingsText = input.ctaBrowseListingsText;
        if (input.ctaBrowseListingsUrl !== undefined) updateData.ctaBrowseListingsUrl = input.ctaBrowseListingsUrl;
        if (input.ctaListBusinessText !== undefined) updateData.ctaListBusinessText = input.ctaListBusinessText;
        if (input.ctaListBusinessUrl !== undefined) updateData.ctaListBusinessUrl = input.ctaListBusinessUrl;
        if (input.ctaSignUpText !== undefined) updateData.ctaSignUpText = input.ctaSignUpText;
        if (input.activeOpportunitiesEyebrow !== undefined) updateData.activeOpportunitiesEyebrow = input.activeOpportunitiesEyebrow;
        if (input.activeOpportunitiesEyebrowBadge !== undefined) updateData.activeOpportunitiesEyebrowBadge = input.activeOpportunitiesEyebrowBadge;
        if (input.activeOpportunitiesSubmitBtn !== undefined) updateData.activeOpportunitiesSubmitBtn = input.activeOpportunitiesSubmitBtn;
        if (input.activeOpportunitiesMandateBtn !== undefined) updateData.activeOpportunitiesMandateBtn = input.activeOpportunitiesMandateBtn;
        if (input.activeOpportunitiesGhostCardsJson !== undefined) updateData.activeOpportunitiesGhostCardsJson = input.activeOpportunitiesGhostCardsJson;
        if (input.activeOpportunitiesViewListingBtn !== undefined) updateData.activeOpportunitiesViewListingBtn = input.activeOpportunitiesViewListingBtn;
        if (input.activeOpportunitiesViewAllBtnText !== undefined) updateData.activeOpportunitiesViewAllBtnText = input.activeOpportunitiesViewAllBtnText;
        if (input.activeOpportunitiesFilterAllLabel !== undefined) updateData.activeOpportunitiesFilterAllLabel = input.activeOpportunitiesFilterAllLabel;
        if (input.heroDealCardEmptyJson !== undefined) updateData.heroDealCardEmptyJson = input.heroDealCardEmptyJson;
        if (input.heroDealCardCuratedLabel !== undefined) updateData.heroDealCardCuratedLabel = input.heroDealCardCuratedLabel;
        if (input.heroDealCardManuallyReviewedLabel !== undefined) updateData.heroDealCardManuallyReviewedLabel = input.heroDealCardManuallyReviewedLabel;
        if (input.navMarketplaceLabel !== undefined) updateData.navMarketplaceLabel = input.navMarketplaceLabel;
        if (input.navBuyerMandatesLabel !== undefined) updateData.navBuyerMandatesLabel = input.navBuyerMandatesLabel;
        if (input.navSellBusinessLabel !== undefined) updateData.navSellBusinessLabel = input.navSellBusinessLabel;
        if (input.navHowItWorksLabel !== undefined) updateData.navHowItWorksLabel = input.navHowItWorksLabel;
        if (input.navLoginLabel !== undefined) updateData.navLoginLabel = input.navLoginLabel;
        if (input.footerTagline !== undefined) updateData.footerTagline = input.footerTagline;
        if (input.footerDisclaimer !== undefined) updateData.footerDisclaimer = input.footerDisclaimer;
        if (input.footerLinksJson !== undefined) updateData.footerLinksJson = input.footerLinksJson;
        if (input.footerCopyrightText !== undefined) updateData.footerCopyrightText = input.footerCopyrightText;

        await db.update(siteSettings).set(updateData);
      }

      // M4: Audit log for admin site settings update
      await createAdminAuditLog({
        adminId: ctx.user.id,
        adminName: ctx.user.name || undefined,
        adminEmail: ctx.user.email || undefined,
        action: 'update_site_settings',
        resource: 'siteSettings',
        details: JSON.stringify({ fieldsUpdated: Object.keys(input).filter(k => (input as Record<string, unknown>)[k] !== undefined) }),
      });

      return { success: true };
    }),

  // Update analytics settings ONLY - this is the ONLY way to modify analytics fields
  // This procedure is intentionally separate to prevent accidental clearing of analytics
  // configuration when other site settings are updated
  updateAnalyticsSettings: adminProcedure
    .input(
      z.object({
        googleAnalyticsId: z.string().nullable().optional(),
        statcounterId: z.string().nullable().optional(),
        statcounterSecurity: z.string().nullable().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if settings row exists
      const existing = await db.select().from(siteSettings).limit(1);

      if (existing.length === 0) {
        // Insert new row with analytics settings only
        await db.insert(siteSettings).values({
          googleAnalyticsId: input.googleAnalyticsId !== undefined ? input.googleAnalyticsId : null,
          statcounterId: input.statcounterId !== undefined ? input.statcounterId : null,
          statcounterSecurity: input.statcounterSecurity !== undefined ? input.statcounterSecurity : null,
          updatedBy: ctx.user.id,
        });
      } else {
        // Update existing row - only update analytics fields that are explicitly provided
        const updateData: Record<string, unknown> = {
          updatedBy: ctx.user.id,
          updatedAt: dateToTimestamp(new Date())!,
        };
        
        // Only update analytics fields that are explicitly provided in the input
        if (input.googleAnalyticsId !== undefined) {
          updateData.googleAnalyticsId = input.googleAnalyticsId;
        }
        if (input.statcounterId !== undefined) {
          updateData.statcounterId = input.statcounterId;
        }
        if (input.statcounterSecurity !== undefined) {
          updateData.statcounterSecurity = input.statcounterSecurity;
        }
        
        await db.update(siteSettings).set(updateData);
      }

      return { success: true };
    }),

  // Get TOS acceptance audit log for compliance reporting
  getTOSAcceptanceAuditLog: adminProcedure
    .input(
      z.object({
        startDate: z.string().optional(), // ISO date string
        endDate: z.string().optional(), // ISO date string
        acceptanceStatus: z.enum(["all", "accepted", "not_accepted"]).optional().default("all"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Build filter conditions
      const conditions = [];
      
      if (input.acceptanceStatus === "accepted") {
        conditions.push(sql`${users.tosAcceptedAt} IS NOT NULL`);
      } else if (input.acceptanceStatus === "not_accepted") {
        conditions.push(sql`${users.tosAcceptedAt} IS NULL`);
      }

      if (input.startDate) {
        const startDate = new Date(input.startDate);
        const startDateStr = dateToTimestamp(startDate);
        conditions.push(gte(users.tosAcceptedAt, startDateStr!));
      }

      if (input.endDate) {
        const endDate = new Date(input.endDate);
        endDate.setHours(23, 59, 59, 999); // End of day
        const endDateStr = dateToTimestamp(endDate);
        conditions.push(lte(users.tosAcceptedAt, endDateStr!));
      }

      // Fetch all users with TOS acceptance data
      let query = db.select({
        id: users.id,
        name: users.name,
        email: users.email,
        tosAcceptedAt: users.tosAcceptedAt,
        privacyPolicyAcceptedAt: users.privacyPolicyAcceptedAt,
        createdAt: users.createdAt,
        lastSignedIn: users.lastSignedIn,
      }).from(users);

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }

      const result = await query.orderBy(desc(users.tosAcceptedAt));

      return result;
    }),

  // Update site logo
  updateLogo: adminProcedure
    .input(
      z.object({
        fileData: z.string(), // base64 encoded image (data URL format)
        fileName: z.string(),
        mimeType: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate mime type against the same allowlist used by logoUploadRouter
      const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];
      if (!allowedMimeTypes.includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid file type. Only JPG, PNG, WebP, and SVG are allowed.",
        });
      }

      // Store the logo as a base64 data URL directly in the database
      // This avoids S3 access issues and works for small images like logos
      // The input.fileData is already in data URL format (data:image/png;base64,...)
      const dataUrl = input.fileData.startsWith('data:')
        ? input.fileData
        : `data:${input.mimeType};base64,${input.fileData}`;

      // Validate the data URL is a well-formed base64 image
      const dataUrlPattern = /^data:image\/[a-zA-Z0-9.+-]+;base64,([A-Za-z0-9+/=]+)$/;
      if (!dataUrlPattern.test(dataUrl)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Uploaded file is not a valid image.",
        });
      }

      // Validate file size (max 2MB for base64 storage, matches client-side limit)
      const base64Part = dataUrl.split(',')[1] || '';
      const sizeInBytes = (base64Part.length * 3) / 4;
      if (sizeInBytes > 2 * 1024 * 1024) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Logo file too large. Maximum size is 2MB.",
        });
      }

      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Update or insert site settings
      const existing = await db.select().from(siteSettings).limit(1);

      if (existing.length === 0) {
        await db.insert(siteSettings).values({
          logoUrl: dataUrl,
          updatedBy: ctx.user.id,
        });
      } else {
        await db.update(siteSettings).set({
          logoUrl: dataUrl,
          updatedBy: ctx.user.id,
          updatedAt: dateToTimestamp(new Date())!,
        });
      }

      return { success: true, logoUrl: dataUrl };
    }),

  // Generate sitemap.xml
  generateSitemap: adminProcedure
    .input(
      z.object({
        baseUrl: z.string().url().optional(),
      })
    )
    .query(async ({ input }) => {
      const xml = await generateSitemap(input.baseUrl);
      return { xml };
    }),

  // Get scheduled job status
  getJobStatus: adminProcedure.query(async () => {
    return getJobStatus();
  }),

  // Manually trigger KYC reminder job
  triggerKYCReminders: adminProcedure.mutation(async () => {
    const result = await runKYCReminderJob();
    return result;
  }),
});
