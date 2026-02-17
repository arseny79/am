import { z } from "zod";
import { protectedProcedure, verifiedProcedure, kycVerifiedProcedure, router } from "../_core/trpc";
import { dateToTimestamp, nowTimestamp } from "../lib/dbHelpers";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";
import { autoAdvanceDealStage } from "../lib/dealStageProgression";
import { autoCreateNDAForDeal } from "../lib/autoCreateNDA";
import { logDealActivity } from "./dealActivityRouter";
import * as emailNotifications from "../emailNotifications";
import { sendEmail, EmailTemplates } from "../lib/emailService";
import { getDb } from "../db";
import { listingDocuments, documents } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const dealRouter = router({
  // Create a new deal (requires KYC verification)
  create: kycVerifiedProcedure
    .input(z.object({
      listingId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      }

      const existingDeal = await db.getDealByListingAndBuyer(input.listingId, ctx.user.id);
      if (existingDeal) {
        return { success: true, dealId: existingDeal.id, alreadyExists: true };
      }

      await db.createDeal({
        listingId: input.listingId,
        buyerId: ctx.user.id,
        sellerId: listing.sellerId,
        stage: "initial_contact",
      });

      const deal = await db.getDealByListingAndBuyer(input.listingId, ctx.user.id);

      // Inherit listing documents to deal
      if (deal) {
        await inheritListingDocuments(input.listingId, deal.id);
      }

      // Log deal_created activity
      if (deal?.id) {
        await logDealActivity({
          dealId: deal.id,
          userId: ctx.user.id,
          activityType: "deal_created",
          description: `Deal created for "${listing.businessName}"`,
          metadata: { listingId: input.listingId, buyerName: ctx.user.name },
        });
      }

      await db.createNotification({
        userId: listing.sellerId,
        type: "new_deal",
        title: "New buyer interest",
        message: `${ctx.user.name} is interested in your listing: ${listing.businessName}`,
        relatedEntityType: "deal",
        relatedEntityId: deal?.id,
        isRead: 0,
        emailSent: 0,
      });

      // Send email notification
      const seller = await db.getUserById(listing.sellerId);
      await emailNotifications.sendNewDealNotification({
        buyerName: ctx.user.name || "A buyer",
        sellerName: seller?.name || "Seller",
        listingName: listing.businessName,
      });

      // Auto-create NDA for the deal
      if (deal?.id) {
        await autoCreateNDAForDeal({
          dealId: deal.id,
          buyerId: ctx.user.id,
          sellerId: listing.sellerId,
          listingName: listing.businessName,
        });
      }

      return { success: true, dealId: deal?.id };
    }),

  getMyDeals: protectedProcedure.query(async ({ ctx }) => {
    const deals = await db.getDealsByUser(ctx.user.id);
    
    const enrichedDeals = await Promise.all(
      deals.map(async (deal) => {
        const listing = await db.getListingById(deal.listingId);
        const buyer = await db.getUserById(deal.buyerId);
        const seller = await db.getUserById(deal.sellerId);
        
        // Get buyer request info if this deal was created from a proposal
        const buyerRequest = deal.buyerRequestId ? await db.getBuyerRequestById(deal.buyerRequestId) : null;
        
        // Determine display names based on anonymity settings
        const isBuyer = ctx.user.id === deal.buyerId;
        const isSeller = ctx.user.id === deal.sellerId;
        
        // For buyer display: check if buyer request has isAnonymous flag
        // Always set displayName so frontend can rely on it
        let buyerDisplayName = buyer?.name || "Unknown Buyer";
        if (buyerRequest?.isAnonymous && !isBuyer) {
          buyerDisplayName = "Anonymous Buyer";
        }
        
        // For seller display: check if listing has isAnonymous flag  
        let sellerDisplayName = seller?.name || "Unknown Seller";
        if (listing?.isAnonymous && !isSeller) {
          sellerDisplayName = "Anonymous Seller";
        }
        
        return {
          ...deal,
          listing,
          buyer: buyer ? { ...buyer, displayName: buyerDisplayName } : null,
          seller: seller ? { ...seller, displayName: sellerDisplayName } : null,
          buyerRequest,
          isOwner: isSeller,
          isBuyer,
        };
      })
    );

    return enrichedDeals;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.id);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Allow admins to view all deals, otherwise restrict to buyer/seller
      if (ctx.user.role !== 'admin' && deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const listing = await db.getListingById(deal.listingId);
      const buyer = await db.getUserById(deal.buyerId);
      const seller = await db.getUserById(deal.sellerId);
      
      // Get buyer request info if this deal was created from a proposal
      const buyerRequest = deal.buyerRequestId ? await db.getBuyerRequestById(deal.buyerRequestId) : null;
      
      // Determine display names based on anonymity settings
      const isBuyer = ctx.user.id === deal.buyerId;
      const isSeller = ctx.user.id === deal.sellerId;
      
      // For buyer display: check if buyer request has isAnonymous flag
      // Always set displayName so frontend can rely on it
      let buyerDisplayName = buyer?.name || "Unknown Buyer";
      if (buyerRequest?.isAnonymous && !isBuyer) {
        buyerDisplayName = "Anonymous Buyer";
      }
      
      // For seller display: check if listing has isAnonymous flag  
      let sellerDisplayName = seller?.name || "Unknown Seller";
      if (listing?.isAnonymous && !isSeller) {
        sellerDisplayName = "Anonymous Seller";
      }

      // SECURITY: Check if NDA is valid before exposing confidential data
      const ndaExpired = deal.ndaExpiresAt && new Date() > new Date(deal.ndaExpiresAt);
      const ndaRevoked = deal.ndaRevokedAt !== null;
      const ndaValid = deal.stage !== 'initial_contact' && !ndaExpired && !ndaRevoked;
      
      // Filter confidential listing data if NDA is not valid
      let filteredListing = listing;
      if (listing && !ndaValid) {
        filteredListing = {
          ...listing,
          businessName: `Confidential Listing #${listing.id}`, // Hide real business name
          clientList: null, // Hide client list
          financialDetails: null, // Hide financial details
        };
      }

      return {
        ...deal,
        listing: filteredListing,
        buyer: buyer ? { ...buyer, displayName: buyerDisplayName } : null,
        seller: seller ? { ...seller, displayName: sellerDisplayName } : null,
        buyerRequest,
        isOwner: isSeller,
        isBuyer,
        ndaStatus: {
          isValid: ndaValid,
          isExpired: ndaExpired,
          isRevoked: ndaRevoked,
          expiresAt: deal.ndaExpiresAt,
          revokedAt: deal.ndaRevokedAt,
          revocationReason: deal.ndaRevocationReason,
        },
      };
    }),

  updateStage: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      stage: z.enum(["initial_contact", "nda_signed", "due_diligence", "negotiation", "escrow", "closing", "closed", "cancelled"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }
      // Allow admins to access all deals
      if (ctx.user.role !== 'admin' && deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.updateDealStage(input.dealId, input.stage);

      // Auto-populate action items from stage templates
      const { getTemplateForStage, calculateDueDate } = await import("@shared/dealStageTemplates");
      const templates = getTemplateForStage(input.stage);
      
      for (const template of templates) {
        await db.createActionItem({
          dealId: input.dealId,
          title: template.title,
          description: template.description,
          assignedTo: template.assignedTo,
          priority: template.priority,
          status: 'pending',
          dueDate: dateToTimestamp(calculateDueDate(template.dueInDays)),
          createdBy: ctx.user.id,
        });
      }

      const otherUserId = ctx.user.id === deal.buyerId ? deal.sellerId : deal.buyerId;
      const listing = await db.getListingById(deal.listingId);

      await db.createNotification({
        userId: otherUserId,
        type: "deal_stage_changed",
        title: "Deal stage updated",
        message: `Deal stage for "${listing?.businessName}" changed to ${input.stage.replace("_", " ")}`,
        relatedEntityType: "deal",
        relatedEntityId: deal.id,
        isRead: 0,
        emailSent: 0,
      });

      // Send email notification to the other party
      const otherUser = await db.getUserById(otherUserId);
      if (otherUser?.email) {
        const dealUrl = `${process.env.VITE_APP_URL || 'https://msp.investments'}/deal/${deal.id}`;
        const stageName = input.stage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        await sendEmail({
          to: otherUser.email,
          ...EmailTemplates.dealStageChanged({
            recipientName: otherUser.name || 'User',
            dealTitle: listing?.businessName || `Deal #${deal.id}`,
            newStage: stageName,
            dealUrl,
          }),
        });
      }
      
      // If deal is closed, check for affiliate commission
      if (input.stage === "closed" && listing) {
        try {
          const { createAffiliateCommission } = await import("../lib/affiliateCommission");
          // Calculate deal amount (use asking price or estimated valuation)
          const dealAmount = (listing.askingPrice || listing.estimatedValuation || 0) * 100; // Convert to cents
          // Platform fee is 3% of deal amount
          const platformFee = Math.floor(dealAmount * 0.03);
          
          await createAffiliateCommission({
            dealId: deal.id,
            buyerId: deal.buyerId,
            dealAmount,
            platformFee,
          });
        } catch (error) {
          // Log but don't fail the deal closure
          console.error("[Affiliate] Error creating commission:", error);
        }
      }

      return { success: true };
    }),

  // Accept asking price and skip negotiation
  acceptAskingPrice: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Only buyer can accept asking price
      if (deal.buyerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the buyer can accept asking price" });
      }

      // Can only accept in early stages
      if (!["initial_contact", "nda_signed", "due_diligence"].includes(deal.stage)) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Can only accept asking price in early stages" 
        });
      }

      // Update deal with quick action flags
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const { deals } = await import("../../drizzle/schema");
      await database
        .update(deals)
        .set({
          acceptedAskingPrice: 1,
          skipNegotiation: 1,
          stageSkipReason: input.reason || "Buyer accepted asking price",
          stage: "escrow", // Skip negotiation, go directly to escrow
          updatedAt: nowTimestamp(),
        })
        .where(eq(deals.id, input.dealId));

      // Log activity
      const listing = await db.getListingById(deal.listingId);
      await db.createDealActivity({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: "stage_changed",
        description: `Buyer accepted asking price of $${listing?.askingPrice?.toLocaleString()}. Deal advanced to escrow, skipping negotiation.`,
        metadata: JSON.stringify({
          oldStage: deal.stage,
          newStage: "escrow",
          askingPrice: listing?.askingPrice,
          reason: input.reason,
        }),
      });

      // Notify seller
      const seller = await db.getUserById(deal.sellerId);
      await db.createNotification({
        userId: deal.sellerId,
        type: "deal_stage_changed",
        title: "Buyer accepted your asking price!",
        message: `${ctx.user.name} accepted your asking price of $${listing?.askingPrice?.toLocaleString()} for ${listing?.businessName}. Deal advanced to escrow.`,
        relatedEntityType: "deal",
        relatedEntityId: deal.id,
        isRead: 0,
        emailSent: 0,
      });

      // Send email notification
      await emailNotifications.sendDealStageChangeNotification({
        buyerName: ctx.user.name || "Buyer",
        sellerName: seller?.name || "Seller",
        listingName: listing?.businessName || "the listing",
        newStage: "escrow",
      });

      return { success: true };
    }),

  // Request counter-offer (buyer initiates negotiation)
  requestCounterOffer: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      counterOfferAmount: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Only buyer can request counter-offer
      if (deal.buyerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the buyer can request a counter-offer" });
      }

      // Can only request in early stages
      if (!["initial_contact", "nda_signed", "due_diligence"].includes(deal.stage)) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Can only request counter-offer in early stages" 
        });
      }

      // Update deal with counter-offer
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const { deals, offerHistory } = await import("../../drizzle/schema");
      await database
        .update(deals)
        .set({
          counterOfferRequested: 1,
          counterOfferAmount: input.counterOfferAmount,
          counterOfferReason: input.reason,
          stage: "negotiation", // Advance to negotiation stage
          updatedAt: nowTimestamp(),
        })
        .where(eq(deals.id, input.dealId));

      // Create offer history record with 72-hour expiration
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);
      
      await database.insert(offerHistory).values({
        dealId: input.dealId,
        offeredBy: ctx.user.id,
        offerType: "buyer_counter_offer",
        amount: input.counterOfferAmount,
        reason: input.reason,
        status: "pending",
        expiresAt: dateToTimestamp(expiresAt),
      });

      // Log activity
      const listing = await db.getListingById(deal.listingId);
      await db.createDealActivity({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: "stage_changed",
        description: `Buyer requested counter-offer of $${input.counterOfferAmount.toLocaleString()}. Deal advanced to negotiation stage.`,
        metadata: JSON.stringify({
          oldStage: deal.stage,
          newStage: "negotiation",
          counterOfferAmount: input.counterOfferAmount,
          askingPrice: listing?.askingPrice,
          reason: input.reason,
        }),
      });

      // Notify seller
      const seller = await db.getUserById(deal.sellerId);
      await db.createNotification({
        userId: deal.sellerId,
        type: "deal_stage_changed",
        title: "Counter-offer received",
        message: `${ctx.user.name} proposed a counter-offer of $${input.counterOfferAmount.toLocaleString()} for ${listing?.businessName}. Original asking price: $${listing?.askingPrice?.toLocaleString()}.`,
        relatedEntityType: "deal",
        relatedEntityId: deal.id,
        isRead: 0,
        emailSent: 0,
      });

      // Send email notification
      await emailNotifications.sendDealStageChangeNotification({
        buyerName: ctx.user.name || "Buyer",
        sellerName: seller?.name || "Seller",
        listingName: listing?.businessName || "the listing",
        newStage: "negotiation",
      });

      return { success: true };
    }),

  // Accept LOI terms (buyer commits to exclusivity)
  acceptLoiTerms: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Only buyer can accept LOI terms
      if (deal.buyerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the buyer can accept LOI terms" });
      }

      // Can only accept LOI in negotiation stage
      if (deal.stage !== "negotiation") {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Can only accept LOI terms during negotiation stage" 
        });
      }

      // Update deal with LOI acceptance
      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const { deals } = await import("../../drizzle/schema");
      await database
        .update(deals)
        .set({
          loiAccepted: 1,
          loiAcceptedAt: nowTimestamp(),
          stage: "escrow", // Advance to escrow stage
          updatedAt: nowTimestamp(),
        })
        .where(eq(deals.id, input.dealId));

      // Log activity
      const listing = await db.getListingById(deal.listingId);
      await db.createDealActivity({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: "stage_changed",
        description: `Buyer accepted Letter of Intent terms. Deal advanced to escrow stage, entering exclusivity period.`,
        metadata: JSON.stringify({
          oldStage: deal.stage,
          newStage: "escrow",
          notes: input.notes,
        }),
      });

      // Notify seller
      const seller = await db.getUserById(deal.sellerId);
      await db.createNotification({
        userId: deal.sellerId,
        type: "deal_stage_changed",
        title: "LOI terms accepted!",
        message: `${ctx.user.name} accepted the Letter of Intent for ${listing?.businessName}. Deal is now in escrow and entering exclusivity period.`,
        relatedEntityType: "deal",
        relatedEntityId: deal.id,
        isRead: 0,
        emailSent: 0,
      });

      // Send email notification
      await emailNotifications.sendDealStageChangeNotification({
        buyerName: ctx.user.name || "Buyer",
        sellerName: seller?.name || "Seller",
        listingName: listing?.businessName || "the listing",
        newStage: "escrow",
      });

      return { success: true };
    }),
});

export const documentRouter = router({
  upload: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      fileName: z.string(),
      fileData: z.string(),
      mimeType: z.string().optional(),
      category: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }
      // Allow admins to access all deals
      if (ctx.user.role !== 'admin' && deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // File type validation for security
      const allowedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'text/csv',
      ];
      
      if (input.mimeType && !allowedMimeTypes.includes(input.mimeType)) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "Invalid file type. Allowed: PDF, Word, Excel, images, and text files." 
        });
      }

      const buffer = Buffer.from(input.fileData, "base64");
      
      // File size validation (50MB max)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (buffer.length > maxSize) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "File size exceeds 50MB limit." 
        });
      }
      const fileKey = `deals/${input.dealId}/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer);

      const existingVersions = await db.getDocumentVersions(input.dealId, input.fileName);
      const nextVersion = existingVersions.length > 0 ? Math.max(...existingVersions.map(d => d.version)) + 1 : 1;

      await db.uploadDocument({
        dealId: input.dealId,
        uploadedBy: ctx.user.id,
        fileName: input.fileName,
        fileUrl: url,
        fileSize: buffer.length,
        version: nextVersion,
        isLatest: 1,
        category: input.category,
        description: input.description,
      });

      const otherUserId = ctx.user.id === deal.buyerId ? deal.sellerId : deal.buyerId;
      const listing = await db.getListingById(deal.listingId);

      await db.createNotification({
        userId: otherUserId,
        type: "document_uploaded",
        title: "New document uploaded",
        message: `${ctx.user.name} uploaded "${input.fileName}" for "${listing?.businessName}"`,
        relatedEntityType: "deal",
        relatedEntityId: deal.id,
        isRead: 0,
        emailSent: 0,
      });

       // Log document_uploaded activity
      await logDealActivity({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: "document_uploaded",
        description: `${ctx.user.name} uploaded "${input.fileName}"`,
        metadata: { fileName: input.fileName, category: input.category, version: nextVersion },
      });

      // Auto-advance deal stage if this is the first document
      const allDocs = await db.getDocumentsByDeal(input.dealId, false);
      if (allDocs.length === 1) {
        await autoAdvanceDealStage(input.dealId, "first_document_uploaded", ctx.user.id);
      }
      return { success: true };
    }),

  getByDeal: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      latestOnly: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }
      // Allow admins to access all deals
      if (ctx.user.role !== 'admin' && deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const documents = await db.getDocumentsByDeal(input.dealId, input.latestOnly ?? true);

      const enrichedDocs = await Promise.all(
        documents.map(async (doc) => {
          const uploader = await db.getUserById(doc.uploadedBy);
          return { ...doc, uploader };
        })
      );

      return enrichedDocs;
    }),
});

export const notificationRouter = router({
  getMy: protectedProcedure
    .input(z.object({ unreadOnly: z.boolean().optional() }))
    .query(async ({ ctx, input }) => {
      return await db.getNotificationsByUser(ctx.user.id, input.unreadOnly ?? false);
    }),

  getUnread: protectedProcedure.query(async ({ ctx }) => {
    return await db.getNotificationsByUser(ctx.user.id, true);
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await db.markNotificationAsRead(input.id);
      return { success: true };
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsAsRead(ctx.user.id);
    return { success: true };
  }),

  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await db.getNotificationsByUser(ctx.user.id, true);
    return { count: notifications.length };
  }),
});

export const messageRouter = router({
  send: verifiedProcedure
    .input(z.object({
      listingId: z.number().optional(),
      dealId: z.number().optional(),
      content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
    }))
    .mutation(async ({ ctx, input }) => {
      let dealId = input.dealId;

      if (input.listingId && !dealId) {
        const listing = await db.getListingById(input.listingId);
        if (!listing) throw new TRPCError({ code: "NOT_FOUND" });

        let deal = await db.getDealByListingAndBuyer(input.listingId, ctx.user.id);
        if (!deal) {
          await db.createDeal({
            listingId: input.listingId,
            buyerId: ctx.user.id,
            sellerId: listing.sellerId,
            stage: "initial_contact",
          });
          deal = await db.getDealByListingAndBuyer(input.listingId, ctx.user.id);
          // Log deal_created activity for inline deal creation
          if (deal?.id) {
            await logDealActivity({
              dealId: deal.id,
              userId: ctx.user.id,
              activityType: "deal_created",
              description: `Deal created for "${listing.businessName}"`,
              metadata: { listingId: input.listingId, buyerName: ctx.user.name },
            });
          }
        }
        dealId = deal?.id;
      }

      if (!dealId) throw new TRPCError({ code: "BAD_REQUEST" });

      const deal = await db.getDealById(dealId);
      if (!deal || (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const receiverId = ctx.user.id === deal.buyerId ? deal.sellerId : deal.buyerId;

      await db.createMessage({
        senderId: ctx.user.id,
        dealId,
        content: input.content,
      });

      // Log message_sent activity
      await logDealActivity({
        dealId,
        userId: ctx.user.id,
        activityType: "message_sent",
        description: `${ctx.user.name} sent a message`,
        metadata: { preview: input.content.substring(0, 80) },
      });

      const listing = await db.getListingById(deal.listingId);
      await db.createNotification({
        userId: receiverId,
        type: "new_message",
        title: "New message",
        message: `${ctx.user.name} sent you a message about "${listing?.businessName}"`,
        relatedEntityType: "deal",
        relatedEntityId: dealId,
        isRead: 0,
        emailSent: 0,
      });

      // Send email notification
      const recipient = await db.getUserById(receiverId);
      if (recipient?.email) {
        const dealUrl = `${process.env.VITE_APP_URL || 'https://msp.investments'}/deal/${dealId}`;
        const messagePreview = input.content.substring(0, 100) + (input.content.length > 100 ? '...' : '');
        await sendEmail({
          to: recipient.email,
          ...EmailTemplates.newMessage({
            recipientName: recipient.name || 'there',
            senderName: ctx.user.name || 'Someone',
            dealTitle: listing?.businessName || 'a listing',
            messagePreview,
            dealUrl,
          }),
        });
      }

      return { success: true, dealId };
    }),

  getByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }
      // Allow admins to access all deals
      if (ctx.user.role !== 'admin' && deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const messages = await db.getMessagesByDeal(input.dealId);

      // Mark unread messages as read
      for (const msg of messages) {
        if (msg.senderId !== ctx.user.id && !msg.isRead) {
          await db.markMessageAsRead(msg.id);
        }
      }

      const enrichedMessages = await Promise.all(
        messages.map(async (msg) => {
          const sender = await db.getUserById(msg.senderId);
          return { ...msg, sender, isMine: msg.senderId === ctx.user.id };
        })
      );

      return enrichedMessages;
    }),

  // NDA Lifecycle Management
  confirmNDA: protectedProcedure
    .input(z.object({
      dealId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const isBuyer = ctx.user.id === deal.buyerId;
      const now = new Date().toISOString();

      // Update the appropriate confirmation field
      if (isBuyer) {
        await db.updateDeal(input.dealId, {
          buyerNdaConfirmed: 1,
          buyerNdaSignedAt: now,
        });
      } else {
        await db.updateDeal(input.dealId, {
          sellerNdaConfirmed: 1,
          sellerNdaSignedAt: now,
        });
      }

      // Check if both parties have confirmed
      const updatedDeal = await db.getDealById(input.dealId);
      if (updatedDeal?.buyerNdaConfirmed && updatedDeal?.sellerNdaConfirmed) {
        // Both parties confirmed - advance to NDA_SIGNED stage
        const ndaExpiry = new Date();
        ndaExpiry.setDate(ndaExpiry.getDate() + 90); // 90 days expiration
        
        await db.updateDeal(input.dealId, {
          stage: 'nda_signed',
          ndaExpiresAt: ndaExpiry.toISOString(),
        });

        // Log activity
        await db.createDealActivity({
          dealId: input.dealId,
          userId: ctx.user.id,
          activityType: 'stage_changed',
          description: 'NDA fully executed - both parties confirmed',
        });

        // Notify both parties
        const listing = await db.getListingById(deal.listingId);
        const otherUserId = isBuyer ? deal.sellerId : deal.buyerId;
        await db.createNotification({
          userId: otherUserId,
          type: 'nda_signed',
          title: 'NDA Fully Executed',
          message: `Both parties have signed the NDA for ${listing?.businessName || 'the listing'}. Confidential information is now accessible.`,
          relatedEntityType: 'deal',
          relatedEntityId: deal.id,
          isRead: 0,
          emailSent: 0,
        });
      }

      return { success: true, bothConfirmed: updatedDeal?.buyerNdaConfirmed && updatedDeal?.sellerNdaConfirmed };
    }),

  revokeNDA: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      reason: z.string().min(10, "Please provide a reason for revocation"),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      // Only seller can revoke NDA
      if (deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the seller can revoke the NDA" });
      }

      await db.updateDeal(input.dealId, {
        ndaRevokedAt: new Date().toISOString(),
        ndaRevokedBy: ctx.user.id,
        ndaRevocationReason: input.reason,
      });

      // Log activity
      await db.createDealActivity({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: 'deal_cancelled',  // Using deal_cancelled for NDA revocation
        description: `NDA revoked: ${input.reason}`,
      });

      // Notify buyer
      const listing = await db.getListingById(deal.listingId);
      await db.createNotification({
        userId: deal.buyerId,
        type: 'nda_revoked',
        title: 'NDA Revoked',
        message: `The seller has revoked the NDA for ${listing?.businessName || 'the listing'}. Reason: ${input.reason}`,
        relatedEntityType: 'deal',
        relatedEntityId: deal.id,
        isRead: 0,
        emailSent: 0,
      });

      return { success: true };
    }),

  getNDAStatus: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      if (ctx.user.role !== 'admin' && deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const ndaExpired = deal.ndaExpiresAt && new Date() > new Date(deal.ndaExpiresAt);
      const ndaRevoked = deal.ndaRevokedAt !== null;
      const bothConfirmed = deal.buyerNdaConfirmed && deal.sellerNdaConfirmed;

      return {
        buyerConfirmed: Boolean(deal.buyerNdaConfirmed),
        sellerConfirmed: Boolean(deal.sellerNdaConfirmed),
        buyerSignedAt: deal.buyerNdaSignedAt,
        sellerSignedAt: deal.sellerNdaSignedAt,
        isFullySigned: bothConfirmed,
        isValid: bothConfirmed && !ndaExpired && !ndaRevoked,
        isExpired: ndaExpired,
        isRevoked: ndaRevoked,
        expiresAt: deal.ndaExpiresAt,
        revokedAt: deal.ndaRevokedAt,
        revokedBy: deal.ndaRevokedBy,
        revocationReason: deal.ndaRevocationReason,
      };
    }),
});


/**
 * Helper function to inherit listing documents to a deal
 * Copies all listing documents to the deal's document vault
 */
async function inheritListingDocuments(listingId: number, dealId: number): Promise<void> {
  const database = await getDb();
  if (!database) {
    console.warn("[inheritListingDocuments] Database unavailable");
    return;
  }

  try {
    // Get all listing documents
    const listingDocs = await database
      .select()
      .from(listingDocuments)
      .where(eq(listingDocuments.listingId, listingId));

    // Copy each document to deal documents table
    for (const doc of listingDocs) {
      await database.insert(documents).values({
        dealId,
        uploadedBy: doc.uploadedBy,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        category: doc.category,
        description: doc.description,
        sourceListingDocumentId: doc.id, // Track which listing document this came from
        version: 1,
        isLatest: 1,
        // DocuSign fields default to undefined for inherited documents
        signatureStatus: "none",
      });
    }

    console.log(`[inheritListingDocuments] Inherited ${listingDocs.length} documents from listing ${listingId} to deal ${dealId}`);
  } catch (error) {
    console.error("[inheritListingDocuments] Error:", error);
    // Don't throw - document inheritance failure shouldn't block deal creation
  }
}
