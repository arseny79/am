import { z } from "zod";
import { protectedProcedure, verifiedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";
import { sendEmail, EmailTemplates } from "../lib/emailService";

export const accessRequestRouter = router({
  // Create access request for private listing
  create: verifiedProcedure
    .input(z.object({
      listingId: z.number(),
      companyName: z.string().optional(),
      contactEmail: z.string().email(),
      contactPhone: z.string().optional(),
      message: z.string().min(50),
    }))
    .mutation(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      }

      if (listing.confidentialityLevel !== "private") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This listing does not require access request" });
      }

      const request = await db.createAccessRequest({
        listingId: input.listingId,
        buyerId: ctx.user.id,
        companyName: input.companyName,
        contactEmail: input.contactEmail,
        contactPhone: input.contactPhone,
        message: input.message,
        status: "pending",
      });

      // Notify seller
      const seller = await db.getUserById(listing.sellerId);
      if (seller?.email) {
        await notifyOwner({
          title: "New Access Request",
          content: `${ctx.user.name || ctx.user.email} requested access to your listing "${listing.businessName}"`,
        });
      }

      return request;
    }),

  // Get access requests for a listing (seller only)
  getByListing: protectedProcedure
    .input(z.object({
      listingId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing || listing.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return db.getAccessRequestsByListing(input.listingId);
    }),

  // Get my access requests (buyer)
  getMy: protectedProcedure
    .query(async ({ ctx }) => {
      return db.getAccessRequestsByBuyer(ctx.user.id);
    }),

  // Respond to access request (seller only)
  respond: protectedProcedure
    .input(z.object({
      requestId: z.number(),
      status: z.enum(["approved", "declined", "more_info_requested"]),
      sellerResponse: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const request = await db.getAccessRequestById(input.requestId);
      if (!request) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const listing = await db.getListingById(request.listingId);
      if (!listing || listing.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.updateAccessRequest(input.requestId, {
        status: input.status,
        sellerResponse: input.sellerResponse,
        respondedAt: new Date(),
      });

      // Send email notification to buyer
      const buyer = await db.getUserById(request.buyerId);
      if (buyer?.email) {
        const listingUrl = `${process.env.VITE_FRONTEND_FORGE_API_URL?.replace('/api', '') || 'https://mspmarketplace.com'}/listing/${listing.id}`;
        
        if (input.status === "approved") {
          // Send approval email
          await sendEmail({
            to: buyer.email,
            ...EmailTemplates.ndaApproved({
              recipientName: buyer.name || 'User',
              listingTitle: listing.businessName,
              listingUrl,
            }),
          });
        } else if (input.status === "declined") {
          // Send decline email (using generic template)
          await sendEmail({
            to: buyer.email,
            subject: `Access request update for "${listing.businessName}"`,
            text: `Hi ${buyer.name || 'User'},\n\nYour access request for "${listing.businessName}" has been declined.${input.sellerResponse ? `\n\nSeller's response: ${input.sellerResponse}` : ''}\n\nYou can browse other opportunities on the marketplace.\n\nBest regards,\nMSP M&A Marketplace`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Access Request Update</h2>
                <p>Hi ${buyer.name || 'User'},</p>
                <p>Your access request for "<strong>${listing.businessName}</strong>" has been declined.</p>
                ${input.sellerResponse ? `<div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;"><p style="margin: 0; color: #991b1b;"><strong>Seller's response:</strong> ${input.sellerResponse}</p></div>` : ''}
                <p>You can browse other opportunities on the marketplace.</p>
                <p style="margin: 30px 0;">
                  <a href="${process.env.VITE_FRONTEND_FORGE_API_URL?.replace('/api', '') || 'https://mspmarketplace.com'}/browse" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Browse Listings</a>
                </p>
                <p style="color: #666; font-size: 14px;">Best regards,<br>MSP M&A Marketplace</p>
              </div>
            `,
          });
        }
      }

      return { success: true };
    }),

  // Check if user has approved access
  checkAccess: protectedProcedure
    .input(z.object({
      listingId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      return db.hasApprovedAccessRequest(input.listingId, ctx.user.id);
    }),
});
