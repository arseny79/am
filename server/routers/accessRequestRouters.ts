import { z } from "zod";
import { protectedProcedure, verifiedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { TRPCError } from "@trpc/server";
import { notifyOwner } from "../_core/notification";

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

      // Notify buyer
      const buyer = await db.getUserById(request.buyerId);
      if (buyer?.email) {
        const statusText = input.status === "approved" ? "approved" : 
                          input.status === "declined" ? "declined" :
                          "requested more information for";
        await notifyOwner({
          title: "Access Request Update",
          content: `Your access request for "${listing.businessName}" has been ${statusText}`,
        });
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
