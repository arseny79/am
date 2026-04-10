import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as proposalDb from "../db/buyerRequestProposals";
import * as db from "../db";
import { sendEmail, EmailTemplates } from "../lib/emailService";

export const buyerRequestProposalRouter = router({
  /**
   * Submit a proposal to a buyer request
   * Requires: User must be authenticated and have at least one published listing
   * Creates a deal automatically
   */
  submit: protectedProcedure
    .input(
      z.object({
        requestId: z.number(),
        listingId: z.number(),
        proposalMessage: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Check if seller has the listing and it's published
      const listing = await db.getListingById(input.listingId);
      if (!listing || listing.sellerId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't own this listing",
        });
      }

      if (!listing.isPublished) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Listing must be published to submit proposals",
        });
      }

      // 2. Check if buyer request exists and is published
      const request = await db.getBuyerRequestById(input.requestId);
      if (!request) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Buyer request not found",
        });
      }

      if (request.status !== "published") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "This buyer request is not published or no longer available",
        });
      }

      // 3. Check if seller already submitted a proposal
      const existing = await proposalDb.checkExistingProposal(
        input.requestId,
        ctx.user.id
      );
      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already submitted a proposal for this request",
        });
      }

      // 4. Create a deal automatically
      await db.createDeal({
        listingId: input.listingId,
        buyerId: request.buyerId,
        sellerId: ctx.user.id,
        stage: "initial_contact",
        buyerRequestId: input.requestId,
      });

      // Get the created deal
      const deal = await db.getDealByListingAndBuyer(input.listingId, request.buyerId);
      if (!deal) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create deal",
        });
      }
      const dealId = deal.id;

      // 5. Create the proposal
      const proposalId = await proposalDb.createProposal({
        requestId: input.requestId,
        sellerId: ctx.user.id,
        listingId: input.listingId,
        proposalMessage: input.proposalMessage,
        dealId,
        status: "pending",
      });

      // 6. Create deal activity with proposal message
      const activityDescription = input.proposalMessage 
        ? `Seller proposed their listing in response to buyer request: "${request.title}"\n\nMessage: ${input.proposalMessage}`
        : `Seller proposed their listing in response to buyer request: "${request.title}"`;
      
      await db.createDealActivity({
        dealId,
        userId: ctx.user.id,
        activityType: "proposal_submitted",
        description: activityDescription,
      });

      // 7. Notify buyer (in-app + email)
      await db.createNotification({
        userId: request.buyerId,
        type: "deal_activity",
        title: "New proposal for your request",
        message: `${ctx.user.name} proposed their listing "${listing.businessName}" for your request "${request.title}"`,
        relatedEntityType: "deal",
        relatedEntityId: dealId,
        isRead: 0,
        emailSent: 0,
      });

      // Send email notification to buyer
      const buyer = await db.getUserById(request.buyerId);
      if (buyer?.email) {
        const proposalUrl = `${process.env.VITE_APP_URL || 'https://acquisitions.market'}/my-proposals`;
        await sendEmail({
          to: buyer.email,
          ...EmailTemplates.proposalReceived({
            recipientName: buyer.name || 'there',
            requestTitle: request.title,
            sellerName: ctx.user.name || 'A seller',
            listingName: listing.businessName,
            proposalUrl,
          }),
        });
      }

      return {
        proposalId,
        dealId,
      };
    }),

  /**
   * Get proposals for a specific buyer request (buyer only)
   */
  getForRequest: protectedProcedure
    .input(z.object({ requestId: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check if user owns the request
      const request = await db.getBuyerRequestById(input.requestId);
      if (!request || request.buyerId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have access to this request",
        });
      }

      const proposals = await proposalDb.getProposalsByRequest(input.requestId);

      // Enrich with listing and seller details
      const enriched = await Promise.all(
        proposals.map(async (proposal) => {
          const listing = await db.getListingById(proposal.listingId);
          const seller = await db.getUserById(proposal.sellerId);
          return {
            ...proposal,
            listing,
            seller: seller ? { id: seller.id, name: seller.name, email: seller.email } : null,
          };
        })
      );

      return enriched;
    }),

  /**
   * Get seller's own proposals
   */
  getMy: protectedProcedure.query(async ({ ctx }) => {
    const proposals = await proposalDb.getProposalsBySeller(ctx.user.id);

    // Enrich with request and listing details
    const enriched = await Promise.all(
      proposals.map(async (proposal) => {
        const request = await db.getBuyerRequestById(proposal.requestId);
        const listing = await db.getListingById(proposal.listingId);
        return {
          ...proposal,
          request,
          listing,
        };
      })
    );

    return enriched;
  }),

  /**
   * Accept a proposal (buyer only)
   * Deal is already created, just update status
   */
  accept: protectedProcedure
    .input(z.object({ proposalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await proposalDb.getProposalById(input.proposalId);
      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      const request = await db.getBuyerRequestById(proposal.requestId);
      if (!request || request.buyerId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't own this request",
        });
      }

      await proposalDb.updateProposalStatus(input.proposalId, "accepted");

      // Add activity to deal
      if (proposal.dealId) {
        await db.createDealActivity({
          dealId: proposal.dealId,
          userId: ctx.user.id,
          activityType: "proposal_accepted",
          description: "Buyer accepted the proposal",
        });

        // Notify seller (in-app + email)
        await db.createNotification({
          userId: proposal.sellerId,
          type: "deal_activity",
          title: "Your proposal was accepted!",
          message: `The buyer accepted your proposal for "${request.title}"`,
          relatedEntityType: "deal",
          relatedEntityId: proposal.dealId,
          isRead: 0,
          emailSent: 0,
        });

        // Send email notification to seller
        const seller = await db.getUserById(proposal.sellerId);
        if (seller?.email) {
          const dealUrl = `${process.env.VITE_APP_URL || 'https://acquisitions.market'}/deal/${proposal.dealId}`;
          await sendEmail({
            to: seller.email,
            ...EmailTemplates.proposalAccepted({
              recipientName: seller.name || 'there',
              requestTitle: request.title,
              buyerName: ctx.user.name || 'The buyer',
              dealUrl,
            }),
          });
        }
      }

      return { success: true };
    }),

  /**
   * Decline a proposal (buyer only)
   */
  decline: protectedProcedure
    .input(z.object({ proposalId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const proposal = await proposalDb.getProposalById(input.proposalId);
      if (!proposal) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Proposal not found",
        });
      }

      const request = await db.getBuyerRequestById(proposal.requestId);
      if (!request || request.buyerId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't own this request",
        });
      }

      await proposalDb.updateProposalStatus(input.proposalId, "declined");

      // Add activity to deal
      if (proposal.dealId) {
        await db.createDealActivity({
          dealId: proposal.dealId,
          userId: ctx.user.id,
          activityType: "proposal_declined",
          description: "Buyer declined the proposal",
        });

        // Notify seller (in-app + email)
        await db.createNotification({
          userId: proposal.sellerId,
          type: "deal_activity",
          title: "Proposal declined",
          message: `The buyer declined your proposal for "${request.title}"`,
          relatedEntityType: "deal",
          relatedEntityId: proposal.dealId,
          isRead: 0,
          emailSent: 0,
        });

        // Send email notification to seller
        const seller = await db.getUserById(proposal.sellerId);
        if (seller?.email) {
          await sendEmail({
            to: seller.email,
            ...EmailTemplates.proposalDeclined({
              recipientName: seller.name || 'there',
              requestTitle: request.title,
              buyerName: ctx.user.name || 'The buyer',
            }),
          });
        }
      }

      return { success: true };
    }),
});
