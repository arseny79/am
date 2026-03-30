import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import sanitizeHtml from "sanitize-html";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, verifiedProcedure, kycVerifiedProcedure, emailVerifiedProcedure, router } from "./_core/trpc";
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
import { affiliateTierRouter } from "./routers/affiliateTier";
import { affiliateRouter } from "./routers/affiliate";
import { referralRouter } from "./routers/referral";
import { commissionRouter } from "./routers/commission";
import { adminListingRouter } from "./routers/adminListingRouter";
import { professionalRouter } from "./routers/professionalRouter";
import { dealProfessionalRouter } from "./routers/dealProfessionalRouter";
import { professionalSubscriptionRouter } from "./stripe/professionalSubscriptionRouter";
import { stripeIdentityRouter } from "./routers/stripeIdentityRouter";
import { emailVerificationRouter } from "./routers/emailVerificationRouter";
import { adminKYCReviewRouter } from "./routers/adminKYCReviewRouter";
import { adminBuyerRequestsRouter } from "./routers/adminBuyerRequestsRouter";
import { stripeRouter } from "./routers/stripeRouter";
import { subscriptionRouter } from "./routers/subscriptionRouter";
import { verificationExpiryRouter } from "./routers/verificationExpiryRouter";
import { ndaTemplateRouter } from "./routers/ndaTemplateRouter";
import { ndaSigningRouter } from "./routers/ndaSigningRouter";
import { feedRouter } from "./routers/feedRouter";
import { brokerRouter } from "./brokerRouter";
import { adminAuditRouter } from "./routers/adminAuditRouter";
import { userManagementHubRouter } from "./routers/userManagementHubRouter";
import { analyticsRouter } from "./routers/analyticsRouter";
import { docusignRouter } from "./routers/docusignRouter";
import { categoryRouter } from "./routers/categoryRouter";

export const appRouter = router({
  kyc: kycRouter,
  professional: professionalRouter,
  dealProfessional: dealProfessionalRouter,
  system: systemRouter,
  adminEscrow: adminEscrowRouter,
  preparation: preparationRouter,
  buyerQualification: buyerQualificationRouter,
  dueDiligence: dueDiligenceRouter,
  affiliateTier: affiliateTierRouter,
  affiliate: affiliateRouter,
  referral: referralRouter,
  commission: commissionRouter,
  stripe: stripeCheckoutRouter,
  stripeListingUpgrade: stripeRouter,
  subscription: subscriptionRouter,
  stripeIdentity: stripeIdentityRouter,
  professionalSubscription: professionalSubscriptionRouter,
  payments: paymentHistoryRouter,
  refunds: refundRouter,
  actionItems: actionItemsRouter,
  dealActivity: dealActivityRouter,
  valuation: valuationRouter,
  savedListings: savedListingsRouter,
  logoUpload: logoUploadRouter,
  admin: adminRouter,
  adminListing: adminListingRouter,
  platformDocuments: platformDocumentsRouter,
  listingDocument: listingDocumentRouter,
  verification: verificationRouter,
  emailVerification: emailVerificationRouter,
  adminKYCReview: adminKYCReviewRouter,
  adminBuyerRequests: adminBuyerRequestsRouter,
  verificationExpiry: verificationExpiryRouter,
  ndaTemplate: ndaTemplateRouter,
  ndaSigning: ndaSigningRouter,
  feed: feedRouter,
  broker: brokerRouter,
  adminAudit: adminAuditRouter,
  userManagementHub: userManagementHubRouter,
  analytics: analyticsRouter,
  docusign: docusignRouter,
  storage: storageRouter,
  category: categoryRouter,
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
    
    // Get user by ID — only allowed to look up your own profile
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        if (ctx.user.id !== input.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "You can only view your own profile" });
        }
        return await db.getUserById(input.id);
      }),

    // Upload profile photo
    uploadProfilePhoto: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // base64
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage");
        
        // Convert base64 to buffer
        const base64Data = input.fileData.split(",")[1] || input.fileData;
        const buffer = Buffer.from(base64Data, "base64");
        
        // Generate unique filename
        const ext = input.fileName.split(".").pop();
        const fileName = `profile-photos/${ctx.user.id}-${Date.now()}.${ext}`;
        
        // Upload to S3
        const { url } = await storagePut(fileName, buffer, input.mimeType);
        
        // Update user profile
        await db.updateUserProfile(ctx.user.id, { profilePhotoUrl: url });
        
        return { success: true, url };
      }),

    // Remove profile photo
    removeProfilePhoto: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.updateUserProfile(ctx.user.id, { profilePhotoUrl: null });
        return { success: true };
      }),
  }),

  listing: router({
    // Create a new listing (requires KYC verification)
    create: kycVerifiedProcedure
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
        categoryId: z.number().optional(),
        listingTier: z.enum(["standard", "featured", "premium"]).optional(),
        thumbnailUrl: z.string().optional(),
        fieldVisibility: z.record(z.enum(["public", "gated"])).optional(),
        listingType: z.enum(["for_sale", "seeking_investment"]).optional(),
        investmentType: z.enum(["equity", "debt", "convertible_note", "revenue_share", "other"]).optional(),
        investmentAmount: z.number().optional(),
        equityOffered: z.number().optional(),
        currentValuation: z.number().optional(),
        useOfFunds: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const listingId = await db.createListing({
          businessName: input.businessName,
          logoUrl: input.logoUrl,
          location: input.location,
          yearFounded: input.yearFounded,
          employeeCount: input.employeeCount,
          monthlyRecurringRevenue: input.monthlyRecurringRevenue,
          annualRevenue: input.annualRevenue,
          ebitda: input.ebitda,
          ebitdaMargin: input.ebitdaMargin,
          clientCount: input.clientCount,
          averageClientValue: input.averageClientValue,
          clientRetentionRate: input.clientRetentionRate,
          serviceMix: input.serviceMix,
          primaryRmm: input.primaryRMM,
          primaryPsa: input.primaryPSA,
          otherTools: input.otherTools,
          askingPrice: input.askingPrice,
          estimatedValuation: input.estimatedValuation,
          valuationMultiple: input.valuationMultiple,
          // H9: Sanitize rich text fields to prevent XSS
          description: sanitizeHtml(input.description, { allowedTags: sanitizeHtml.defaults.allowedTags, allowedAttributes: sanitizeHtml.defaults.allowedAttributes }),
          keyStrengths: input.keyStrengths ? sanitizeHtml(input.keyStrengths, { allowedTags: sanitizeHtml.defaults.allowedTags, allowedAttributes: sanitizeHtml.defaults.allowedAttributes }) : input.keyStrengths,
          growthOpportunities: input.growthOpportunities ? sanitizeHtml(input.growthOpportunities, { allowedTags: sanitizeHtml.defaults.allowedTags, allowedAttributes: sanitizeHtml.defaults.allowedAttributes }) : input.growthOpportunities,
          clientList: input.clientList,
          financialDetails: input.financialDetails,
          confidentialityLevel: input.confidentialityLevel,
          isAnonymous: input.isAnonymous ? 1 : 0,
          ndaTemplateUrl: input.ndaTemplateUrl,
          categoryId: input.categoryId,
          thumbnailUrl: input.thumbnailUrl,
          fieldVisibility: input.fieldVisibility ?? null,
          listingType: input.listingType ?? "for_sale",
          investmentType: input.investmentType,
          investmentAmount: input.investmentAmount,
          equityOffered: input.equityOffered?.toString(),
          currentValuation: input.currentValuation,
          useOfFunds: input.useOfFunds,
          sellerId: ctx.user.id,
          status: input.listingTier === "standard" ? "active" : "draft",
          isPublished: input.listingTier === "standard" ? 1 : 0,
          paymentStatus: input.listingTier === "standard" ? "paid" : "pending",
          listingTier: input.listingTier,
        });
        return { success: true, id: listingId };
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
        isAnonymous: z.boolean().optional(),
        confidentialityLevel: z.enum(["public", "nda", "private"]).optional(),
        categoryId: z.number().optional(),
        fieldVisibility: z.record(z.enum(["public", "gated"])).optional(),
        listingType: z.enum(["for_sale", "seeking_investment"]).optional(),
        investmentType: z.enum(["equity", "debt", "convertible_note", "revenue_share", "other"]).optional(),
        investmentAmount: z.number().optional(),
        equityOffered: z.number().optional(),
        currentValuation: z.number().optional(),
        useOfFunds: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, isPublished, isAnonymous, equityOffered, ...restData } = input;
        const listing = await db.getListingById(id);
        
        if (!listing || listing.sellerId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        
        // Map input fields to schema fields
        const updateData: Record<string, unknown> = { ...restData };
        if (isPublished !== undefined) updateData.isPublished = isPublished ? 1 : 0;
        if (isAnonymous !== undefined) updateData.isAnonymous = isAnonymous ? 1 : 0;
        if (equityOffered !== undefined) updateData.equityOffered = equityOffered?.toString();
        // H9: Sanitize rich text fields in update
        if (updateData.description) updateData.description = sanitizeHtml(updateData.description as string, { allowedTags: sanitizeHtml.defaults.allowedTags, allowedAttributes: sanitizeHtml.defaults.allowedAttributes });
        if (updateData.keyStrengths) updateData.keyStrengths = sanitizeHtml(updateData.keyStrengths as string, { allowedTags: sanitizeHtml.defaults.allowedTags, allowedAttributes: sanitizeHtml.defaults.allowedAttributes });
        if (updateData.growthOpportunities) updateData.growthOpportunities = sanitizeHtml(updateData.growthOpportunities as string, { allowedTags: sanitizeHtml.defaults.allowedTags, allowedAttributes: sanitizeHtml.defaults.allowedAttributes });
        await db.updateListing(id, updateData);

        // Send notification if listing is being published for the first time
        if (isPublished && !listing.isPublished) {
          await emailNotifications.sendNewListingNotification({
            sellerName: ctx.user.name || "A seller",
            listingName: restData.businessName || listing.businessName,
            annualRevenue: restData.annualRevenue || listing.annualRevenue,
            ebitda: restData.ebitda || listing.ebitda,
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

    // Get listing by ID (with NDA check for confidential data) - public so visitors can view listings
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const listing = await db.getListingById(input.id);
        if (!listing) return null;
        
        // Record view only if user is logged in
        if (ctx.user) {
          await db.recordListingView({
            listingId: input.id,
            viewerId: ctx.user.id,
          });
        }
        
        // Check if user has signed NDA or is the seller (only if logged in)
        const hasNDA = ctx.user && (
          listing.sellerId === ctx.user.id || 
          await db.hasSignedNDA(ctx.user.id, input.id)
        );
        
        // Hide confidential information if no NDA or not logged in
        if (!hasNDA) {
          return {
            ...listing,
            clientList: null,
            financialDetails: null,
          };
        }
        
        return listing;
      }),

    // Get similar listings (disabled for premium_featured tier) - public so visitors can see related listings
    getSimilar: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const listing = await db.getListingById(input.id);
        if (!listing) return [];
        
        // CORE RULE: Premium and featured listings do NOT show similar listings widget
        if (listing.listingTier === 'premium' || listing.listingTier === 'featured') {
          return [];
        }
        
        // Get similar listings based on category
        const similar = await db.getSimilarListings({
          listingId: input.id,
          categoryId: listing.categoryId ?? null,
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
    search: publicProcedure
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
        const expiresAtDate = new Date();
        expiresAtDate.setFullYear(expiresAtDate.getFullYear() + 1);
        const expiresAt = expiresAtDate.toISOString().slice(0, 19).replace('T', ' ');
        
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
        pdfUrl: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if already signed
        const alreadySigned = await db.hasSignedNDA(ctx.user.id, input.listingId);
        if (alreadySigned) {
          return { success: true, alreadySigned: true };
        }
        
        // Create NDA (expires in 1 year)
        const expiresAtDate2 = new Date();
        expiresAtDate2.setFullYear(expiresAtDate2.getFullYear() + 1);
        const expiresAt2 = expiresAtDate2.toISOString().slice(0, 19).replace('T', ' ');
        
        await db.createNDA({
          listingId: input.listingId,
          buyerId: ctx.user.id,
          expiresAt: expiresAt2,
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

  message: (() => {
    // Per-user sliding-window rate limiter: max 20 messages per 5 minutes
    const MESSAGE_LIMIT = 20;
    const MESSAGE_WINDOW_MS = 5 * 60 * 1000;
    const userMessageTimestamps = new Map<number, number[]>();

    function checkMessageRateLimit(userId: number): boolean {
      const now = Date.now();
      const timestamps = (userMessageTimestamps.get(userId) || []).filter(
        (t) => now - t < MESSAGE_WINDOW_MS
      );
      if (timestamps.length >= MESSAGE_LIMIT) return false;
      timestamps.push(now);
      userMessageTimestamps.set(userId, timestamps);
      return true;
    }

    return router({
    // Send a message (deal-scoped)
    send: verifiedProcedure
      .input(z.object({
        dealId: z.number(),
        // H8: Enforce content length limits
        content: z.string().min(1, "Message cannot be empty").max(10000, "Message too long (max 10000 characters)"),
      }))
      .mutation(async ({ ctx, input }) => {
        // Per-user rate limit: max 20 messages per 5 minutes
        if (!checkMessageRateLimit(ctx.user.id)) {
          throw new TRPCError({ code: 'TOO_MANY_REQUESTS', message: 'You are sending messages too quickly. Please wait a moment.' });
        }

        // Verify user is part of the deal
        const deal = await db.getDealById(input.dealId);
        if (!deal) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Deal not found' });
        }
        if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'You are not part of this deal' });
        }

        // C3: Sanitize message content to prevent XSS
        const sanitizedContent = sanitizeHtml(input.content, { allowedTags: [], allowedAttributes: {} });
        await db.createMessage({
          dealId: input.dealId,
          senderId: ctx.user.id,
          content: sanitizedContent,
        });

        // Send email notification to the other party
        const recipientId = deal.buyerId === ctx.user.id ? deal.sellerId : deal.buyerId;
        const recipient = await db.getUserById(recipientId);
        const listing = await db.getListingById(deal.listingId);
        
        if (recipient?.email) {
          const { sendEmail, EmailTemplates } = await import('./lib/emailService');
          const frontendUrl = process.env.VITE_APP_URL || 'https://acq.market';
          const dealUrl = `${frontendUrl}/deal/${deal.id}?tab=messages`;
          
          const emailContent = EmailTemplates.newMessage({
            recipientName: recipient.name || 'there',
            senderName: ctx.user.name || 'Someone',
            dealTitle: listing?.businessName || 'your deal',
            messagePreview: input.content.substring(0, 200) + (input.content.length > 200 ? '...' : ''),
            dealUrl,
          });
          
          // Send email asynchronously (don't block the response)
          sendEmail({
            to: recipient.email,
            subject: emailContent.subject,
            text: emailContent.text,
            html: emailContent.html,
          }).catch(err => console.error('[Email] Failed to send message notification:', err));
        }

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
  });
  })(),

  savedSearch: router({
    // Create a saved search
    create: protectedProcedure
      .input(z.object({
        // M7: Input length limits
        name: z.string().min(1, "Name is required").max(200, "Name too long"),
        minRevenue: z.number().optional(),
        maxRevenue: z.number().optional(),
        minEbitda: z.number().optional(),
        maxEbitda: z.number().optional(),
        locations: z.string().max(500, "Locations too long").optional(),
        emailAlerts: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createSavedSearch({
          ...input,
          emailAlerts: input.emailAlerts ? 1 : 0,
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
