import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";
import { autoAdvanceDealStage } from "../lib/dealStageProgression";
import * as emailNotifications from "../emailNotifications";

export const dealRouter = router({
  // Create a new deal (automatically when buyer contacts seller)
  create: protectedProcedure
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

      if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
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
      if (!deal || (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id)) {
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

      return { success: true };
    }),
});

export const documentRouter = router({
  upload: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      fileName: z.string(),
      fileData: z.string(),
      category: z.string().optional(),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal || (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const buffer = Buffer.from(input.fileData, "base64");
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
      if (!deal || (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id)) {
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
  send: protectedProcedure
    .input(z.object({
      listingId: z.number().optional(),
      dealId: z.number().optional(),
      content: z.string(),
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

      return { success: true, dealId };
    }),

  getByDeal: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal || (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id)) {
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
