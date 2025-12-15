import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, verifiedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { dealRouter, documentRouter, notificationRouter, messageRouter as dealMessageRouter } from "./routers/dealRouters";
import { autoAdvanceDealStage } from "./lib/dealStageProgression";
import { buyerRequestRouter } from "./routers/buyerRequestRouters";
import { accessRequestRouter } from "./routers/accessRequestRouters";
import { buyerRequestProposalRouter } from "./routers/buyerRequestProposalRouter";
import * as emailNotifications from "./emailNotifications";
import { stripeCheckoutRouter } from "./stripe/checkoutRouter";
import { paymentHistoryRouter } from "./paymentHistory";
import { refundRouter } from "./stripe/refundRouter";
import { actionItemsRouter } from "./routers/actionItemsRouter";
import { dealActivityRouter } from "./routers/dealActivityRouter";
import { valuationRouter } from "./routers/valuationRouter";
import { savedListingsRouter } from "./routers/savedListingsRouter";
import { logoUploadRouter } from "./routers/logoUploadRouter";
import { adminRouter } from "./routers/adminRouter";
import { platformDocumentsRouter } from "./routers/platformDocumentsRouter";
import { listingDocumentRouter } from "./routers/listingDocumentRouter";
import { verificationRouter } from "./routers/verificationRouter";
import { storageRouter } from "./routers/storageRouter";
import { milestoneRouter } from "./routers/milestoneRouter";
import { milestoneOverdueRouter } from "./routers/milestoneOverdueRouter";
import { offerHistoryRouter } from "./routers/offerHistoryRouter";
import { offerExpirationRouter } from "./routers/offerExpirationRouter";
import { emailAuthRouter } from "./routers/emailAuthRouter";
import { pricePlanRouter } from "./routers/pricePlanRouters";
import { thumbnailUploadRouter } from "./routers/thumbnailUploadRouter";
import { kycRouter } from "./routers/kycRouter";
import { adminEscrowRouter } from "./routers/adminEscrowRouter";
import { preparationRouter } from "./routers/preparationRouter";
import { buyerQualificationRouter } from "./routers/buyerQualificationRouter";
import { dueDiligenceRouter } from "./routers/dueDiligenceRouter";

export const appRouter = router({
  kyc: kycRouter,
  system: systemRouter,
  adminEscrow: adminEscrowRouter,
  preparation: preparationRouter,
  buyerQualification: buyerQualificationRouter,
  dueDiligence: dueDiligenceRouter,
  stripe: stripeCheckoutRouter,
  payments: paymentHistoryRouter,
  refunds: refundRouter,
  actionItems: actionItemsRouter,
  dealActivity: dealActivityRouter,
  valuation: valuationRouter,
  savedListings: savedListingsRouter,
  logoUpload: logoUploadRouter,
  admin: adminRouter,
  platformDocuments: platformDocumentsRouter,
  listingDocument: listingDocumentRouter,
  verification: verificationRouter,
  storage: storageRouter,
  milestone: milestoneRouter,
  milestoneOverdue: milestoneOverdueRouter,
  offerHistory: offerHistoryRouter,
  pricePlan: pricePlanRouter,
  offerExpiration: offerExpirationRouter,
  thumbnailUpload: thumbnailUploadRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    acceptTerms: protectedProcedure.mutation(async ({ ctx }) => {
      const now = new Date();
      await db.updateUserTermsAcceptance(ctx.user.id, now);
      return { success: true, acceptedAt: now };
    }),
  }),

  user: router({
    // Update user profile
    updateProfile: protectedProcedure
      .input(z.object({
        companyName: z.string().optional(),
        companyWebsite: z.string().optional(),
        phoneNumber: z.string().optional(),
        location: z.string().optional(),
        bio: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
    
    // Get user by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getUserById(input.id);
      }),
  }),

  listing: router({
    // Create a new listing
    create: verifiedProcedure
      .input(z.object({
        businessName: z.string(),
        logoUrl: z.string().optional(),
        location: z.string(),
        yearFounded: z.number().optional(),
        employeeCount: z.number().optional(),
        monthlyRecurringRevenue: z.number(),
        annualRevenue: z.number(),
        ebitda: z.number(),
        ebitdaMargin: z.number().optional(),
        clientCount: z.number(),
        averageClientValue: z.number().optional(),
        clientRetentionRate: z.number().optional(),
        serviceMix: z.string().optional(),
        primaryRMM: z.string().optional(),
        primaryPSA: z.string().optional(),
        otherTools: z.string().optional(),
        askingPrice: z.number().optional(),
        estimatedValuation: z.number().optional(),
        valuationMultiple: z.number().optional(),
        description: z.string(),
        keyStrengths: z.string().optional(),
        growthOpportunities: z.string().optional(),
        clientList: z.string().optional(),
        financialDetails: z.string().optional(),
        confidentialityLevel: z.enum(["public", "nda", "private"]).optional(),
        isAnonymous: z.boolean().optional(),
        ndaTemplateUrl: z.string().optional(),
        serviceCategory: z.enum(["managed_security", "cloud_services", "infrastructure", "helpdesk", "backup_dr", "application_mgmt", "consulting", "telecommunications", "other"]).optional(),
        industryVertical: z.enum(["healthcare", "financial_services", "legal", "education", "manufacturing", "professional_services", "retail_ecommerce", "nonprofit", "government", "general_smb"]).optional(),
        listingTier: z.enum(["standard", "featured", "premium"]).optional(),
        thumbnailUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createListing({
          ...input,
          sellerId: ctx.user.id,
          status: "draft",
          isPublished: false,
        });
        return { success: true };
      }),

    // Update a listing
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        businessName: z.string().optional(),
        logoUrl: z.string().optional(),
        location: z.string().optional(),
        yearFounded: z.number().optional(),
        employeeCount: z.number().optional(),
        monthlyRecurringRevenue: z.number().optional(),
        annualRevenue: z.number().optional(),
        ebitda: z.number().optional(),
        ebitdaMargin: z.number().optional(),
        clientCount: z.number().optional(),
        averageClientValue: z.number().optional(),
        clientRetentionRate: z.number().optional(),
        serviceMix: z.string().optional(),
        primaryRMM: z.string().optional(),
        primaryPSA: z.string().optional(),
        otherTools: z.string().optional(),
        askingPrice: z.number().optional(),
        estimatedValuation: z.number().optional(),
        valuationMultiple: z.number().optional(),
        description: z.string().optional(),
        keyStrengths: z.string().optional(),
        growthOpportunities: z.string().optional(),
        clientList: z.string().optional(),
        financialDetails: z.string().optional(),
        status: z.enum(["draft", "active", "under_negotiation", "sold", "withdrawn"]).optional(),
        isPublished: z.boolean().optional(),
        thumbnailUrl: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        const listing = await db.getListingById(id);
        
        if (!listing || listing.sellerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        await db.updateListing(id, data);

        // Send notification if listing is being published for the first time
        if (data.isPublished && !listing.isPublished) {
          await emailNotifications.sendNewListingNotification({
            sellerName: ctx.user.name || "A seller",
            listingName: data.businessName || listing.businessName,
            annualRevenue: data.annualRevenue || listing.annualRevenue,
            ebitda: data.ebitda || listing.ebitda,
          });
        }

        return { success: true };
      }),

    // Delete a listing
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const listing = await db.getListingById(input.id);
        
        if (!listing || listing.sellerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        await db.deleteListing(input.id);
        return { success: true };
      }),

    // Get listing by ID (with NDA check for confidential data)
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const listing = await db.getListingById(input.id);
        if (!listing) return null;
        
        // Record view
        await db.recordListingView({
          listingId: input.id,
          viewerId: ctx.user.id,
        });
        
        // Check if user has signed NDA or is the seller
        const hasNDA = listing.sellerId === ctx.user.id || 
                       await db.hasSignedNDA(ctx.user.id, input.id);
        
        // Hide confidential information if no NDA
        if (!hasNDA) {
          return {
            ...listing,
            clientList: null,
            financialDetails: null,
          };
        }
        
        return listing;
      }),

    // Get similar listings (disabled for premium_featured tier)
    getSimilar: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const listing = await db.getListingById(input.id);
        if (!listing) return [];
        
        // CORE RULE: Premium listings do NOT show similar listings widget
        if (listing.tier === 'premium_featured') {
          return [];
        }
        
        // Get similar listings based on category and industry
        const similar = await db.getSimilarListings({
          listingId: input.id,
          primaryServiceCategory: listing.primaryServiceCategory,
          industryVertical: listing.industryVertical,
          limit: 4,
        });
        
        return similar;
      }),

    // Get random premium listing for homepage hero
    getRandomPremium: publicProcedure
      .query(async () => {
        const premiumListings = await db.getPremiumListings();
        if (!premiumListings || premiumListings.length === 0) return null;
        
        // Return random premium listing
        const randomIndex = Math.floor(Math.random() * premiumListings.length);
        return premiumListings[randomIndex];
      }),

    // Get all listings by current seller
    getMy: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getListingsBySellerId(ctx.user.id);
      }),

    // Search published listings (public marketplace)
    search: protectedProcedure
      .input(z.object({
        minRevenue: z.number().optional(),
        maxRevenue: z.number().optional(),
        minEbitda: z.number().optional(),
        maxEbitda: z.number().optional(),
        location: z.string().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getPublishedListings(input);
      }),

    // Get listing analytics
    getAnalytics: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const listing = await db.getListingById(input.id);
        
        if (!listing || listing.sellerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        const viewCount = await db.getListingViewCount(input.id);
        
        return {
          viewCount,
        };
      }),
  }),

  nda: router({
    // Sign an NDA for a listing (click-wrap)
    signClickwrap: protectedProcedure
      .input(z.object({
        listingId: z.number(),
        ipAddress: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if already signed
        const alreadySigned = await db.hasSignedNDA(ctx.user.id, input.listingId);
        if (alreadySigned) {
          return { success: true, alreadySigned: true };
        }
        
        // Create NDA (expires in 1 year)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        await db.createNDA({
          listingId: input.listingId,
          buyerId: ctx.user.id,
          ipAddress: input.ipAddress,
          expiresAt,
          ndaType: "clickwrap",
        });

        // Send email notification
        const listing = await db.getListingById(input.listingId);
        const seller = listing ? await db.getUserById(listing.sellerId) : null;
        if (listing && seller) {
          await emailNotifications.sendNDASignedNotification({
            buyerName: ctx.user.name || "A buyer",
            sellerName: seller.name || "Seller",
            listingName: listing.businessName,
          });
        }

        // Auto-advance deal stage if there's an active deal
        const deal = await db.getDealByListingAndBuyer(input.listingId, ctx.user.id);
        if (deal) {
          await autoAdvanceDealStage(deal.id, "nda_signed", ctx.user.id);
        }
        
        return { success: true, alreadySigned: false };
      }),

    // Upload signed PDF NDA
    uploadPdf: protectedProcedure
      .input(z.object({
        listingId: z.number(),
        pdfUrl: z.string().url(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if already signed
        const alreadySigned = await db.hasSignedNDA(ctx.user.id, input.listingId);
        if (alreadySigned) {
          return { success: true, alreadySigned: true };
        }
        
        // Create NDA (expires in 1 year)
        const expiresAt = new Date();
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        
        await db.createNDA({
          listingId: input.listingId,
          buyerId: ctx.user.id,
          expiresAt,
          ndaType: "pdf_upload",
          uploadedPdfUrl: input.pdfUrl,
        });
        
        // Notify seller
        const listing = await db.getListingById(input.listingId);
        const seller = listing ? await db.getUserById(listing.sellerId) : null;
        if (listing && seller) {
          await emailNotifications.sendNDASignedNotification({
            buyerName: ctx.user.name || "A buyer",
            sellerName: seller.name || "Seller",
            listingName: listing.businessName,
          });
        }
        
        return { success: true, alreadySigned: false };
      }),

    // Check if user has signed NDA for a listing
    hasSigned: protectedProcedure
      .input(z.object({ listingId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.hasSignedNDA(ctx.user.id, input.listingId);
      }),

    // Get all NDAs signed by current user
    getMy: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getNDAsByBuyerId(ctx.user.id);
      }),
  }),

  message: router({
    // Send a message (deal-scoped)
    send: verifiedProcedure
      .input(z.object({
        dealId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Verify user is part of the deal
        const deal = await db.getDealById(input.dealId);
        if (!deal) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
        }
        if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not part of this deal' });
        }

        await db.createMessage({
          dealId: input.dealId,
          senderId: ctx.user.id,
          content: input.content,
        });
        return { success: true };
      }),

    // Get messages for a deal
    getByDeal: protectedProcedure
      .input(z.object({ dealId: z.number() }))
      .query(async ({ ctx, input }) => {
        // Verify user is part of the deal
        const deal = await db.getDealById(input.dealId);
        if (!deal) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
        }
        if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not part of this deal' });
        }

        return await db.getMessagesByDeal(input.dealId);
      }),

    // Mark message as read
    markAsRead: protectedProcedure
      .input(z.object({ messageId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markMessageAsRead(input.messageId);
        return { success: true };
      }),

    // Get unread message count
    getUnreadCount: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getUnreadMessageCountForUser(ctx.user.id);
      }),
  }),

  savedSearch: router({
    // Create a saved search
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        minRevenue: z.number().optional(),
        maxRevenue: z.number().optional(),
        minEbitda: z.number().optional(),
        maxEbitda: z.number().optional(),
        locations: z.string().optional(),
        emailAlerts: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createSavedSearch({
          ...input,
          buyerId: ctx.user.id,
        });
        return { success: true };
      }),

    // Get all saved searches
    getMy: protectedProcedure
      .query(async ({ ctx }) => {
        return await db.getSavedSearchesByBuyerId(ctx.user.id);
      }),

    // Delete a saved search
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteSavedSearch(input.id);
        return { success: true };
      }),
  }),

  // Deal management routers
  deal: dealRouter,
  document: documentRouter,
  notification: notificationRouter,
  dealMessage: dealMessageRouter,
  buyerRequest: buyerRequestRouter,
  buyerRequestProposal: buyerRequestProposalRouter,
  accessRequest: accessRequestRouter,
  emailAuth: emailAuthRouter,
});

export type AppRouter = typeof appRouter;
