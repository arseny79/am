import { z } from "zod";
import { protectedProcedure, verifiedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";
import { autoAdvanceDealStage } from "../lib/dealStageProgression";
import { autoCreateNDAForDeal } from "../lib/autoCreateNDA";
import * as emailNotifications from "../emailNotifications";
import { sendEmail, EmailTemplates } from "../lib/emailService";
import { getDb } from "../db";
import { listingDocuments, documents } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const dealRouter = router({
  // Create a new deal (automatically when buyer contacts seller)
  create: verifiedProcedure
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
        
        return {
          ...deal,
          listing,
          buyer,
          seller,
          isOwner: ctx.user.id === deal.sellerId,
          isBuyer: ctx.user.id === deal.buyerId,
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

      return {
        ...deal,
        listing,
        buyer,
        seller,
        isOwner: ctx.user.id === deal.sellerId,
        isBuyer: ctx.user.id === deal.buyerId,
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
          dueDate: calculateDueDate(template.dueInDays),
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
        const dealUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL?.replace('/api', '') || 'https://mspmarketplace.com'}/deal/${deal.id}`;
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
          acceptedAskingPrice: true,
          skipNegotiation: true,
          stageSkipReason: input.reason || "Buyer accepted asking price",
          stage: "escrow", // Skip negotiation, go directly to escrow
          updatedAt: new Date(),
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
          counterOfferRequested: true,
          counterOfferAmount: input.counterOfferAmount,
          counterOfferReason: input.reason,
          stage: "negotiation", // Advance to negotiation stage
          updatedAt: new Date(),
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
        expiresAt,
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
          loiAccepted: true,
          loiAcceptedAt: new Date(),
          stage: "escrow", // Advance to escrow stage
          updatedAt: new Date(),
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
        const dealUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL?.replace('/api', '') || 'https://mspmarketplace.com'}/deal/${dealId}`;
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
