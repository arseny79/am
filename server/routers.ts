import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { dealRouter, documentRouter, notificationRouter, messageRouter as dealMessageRouter } from "./routers/dealRouters";
import { buyerRequestRouter } from "./routers/buyerRequestRouters";
import { accessRequestRouter } from "./routers/accessRequestRouters";
import * as emailNotifications from "./emailNotifications";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
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
    create: protectedProcedure
      .input(z.object({
        businessName: z.string(),
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
    // Send a message
    send: protectedProcedure
      .input(z.object({
        listingId: z.number(),
        receiverId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.createMessage({
          listingId: input.listingId,
          senderId: ctx.user.id,
          receiverId: input.receiverId,
          content: input.content,
        });
        return { success: true };
      }),

    // Get messages for a listing
    getByListing: protectedProcedure
      .input(z.object({ listingId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getMessagesByListing(input.listingId, ctx.user.id);
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
        return await db.getUnreadMessageCount(ctx.user.id);
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

  valuation: router({
    // Calculate MSP valuation based on metrics
    calculate: publicProcedure
      .input(z.object({
        annualRevenue: z.number(),
        ebitda: z.number(),
        clientCount: z.number(),
        clientRetentionRate: z.number().optional(),
        growthRate: z.number().optional(),
      }))
      .query(({ input }) => {
        // Base multiple: 3.5x - 5.5x EBITDA for MSPs
        let baseMultiple = 4.0;
        
        // Adjust based on EBITDA margin
        const ebitdaMargin = (input.ebitda / input.annualRevenue) * 100;
        if (ebitdaMargin > 25) baseMultiple += 0.5;
        if (ebitdaMargin > 30) baseMultiple += 0.5;
        if (ebitdaMargin < 15) baseMultiple -= 0.5;
        
        // Adjust based on client retention
        if (input.clientRetentionRate) {
          if (input.clientRetentionRate > 95) baseMultiple += 0.3;
          if (input.clientRetentionRate < 85) baseMultiple -= 0.3;
        }
        
        // Adjust based on growth rate
        if (input.growthRate) {
          if (input.growthRate > 20) baseMultiple += 0.5;
          if (input.growthRate > 30) baseMultiple += 0.5;
          if (input.growthRate < 0) baseMultiple -= 0.5;
        }
        
        // Calculate valuation
        const valuation = Math.round(input.ebitda * baseMultiple);
        
        return {
          estimatedValuation: valuation,
          multiple: Math.round(baseMultiple * 10), // Store as integer (e.g., 45 for 4.5x)
          ebitdaMargin: Math.round(ebitdaMargin),
          methodology: "EBITDA Multiple Method",
          factors: {
            baseMultiple: 4.0,
            ebitdaMarginAdjustment: ebitdaMargin > 25 ? "+0.5 to +1.0" : ebitdaMargin < 15 ? "-0.5" : "0",
            retentionAdjustment: input.clientRetentionRate ? 
              (input.clientRetentionRate > 95 ? "+0.3" : input.clientRetentionRate < 85 ? "-0.3" : "0") : "N/A",
            growthAdjustment: input.growthRate ?
              (input.growthRate > 30 ? "+1.0" : input.growthRate > 20 ? "+0.5" : input.growthRate < 0 ? "-0.5" : "0") : "N/A",
          }
        };
      }),
  }),

  // Deal management routers
  deal: dealRouter,
  document: documentRouter,
  notification: notificationRouter,
  dealMessage: dealMessageRouter,
  buyerRequest: buyerRequestRouter,
  accessRequest: accessRequestRouter,
});

export type AppRouter = typeof appRouter;
