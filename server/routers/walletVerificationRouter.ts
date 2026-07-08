import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { recoverAddress, hashMessage } from "viem";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";
import { nowTimestamp } from "../lib/dbHelpers";

export const walletVerificationRouter = router({
  getPublicVerification: publicProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ input }) => {
      const verification = await db.getVerificationByListing(input.listingId);
      if (!verification) return null;
      return { verified: true, chainId: verification.chainId };
    }),

  getVerification: protectedProcedure
    .input(z.object({ listingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing || listing.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this listing" });
      }
      return db.getVerificationByListing(input.listingId);
    }),

  startVerification: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      walletAddress: z.string().min(1),
      chainId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing || listing.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this listing" });
      }

      const nonce = Date.now();
      const message = `Verify wallet ownership for listing #${input.listingId}\nAddress: ${input.walletAddress}\nChain: ${input.chainId}\nNonce: ${nonce}`;
      return { message };
    }),

  submitSignature: protectedProcedure
    .input(z.object({
      listingId: z.number(),
      walletAddress: z.string().min(1),
      chainId: z.number(),
      signature: z.string().min(1),
      message: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const listing = await db.getListingById(input.listingId);
      if (!listing || listing.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this listing" });
      }

      let recoveredAddress: string;
      try {
        recoveredAddress = await recoverAddress({
          hash: hashMessage(input.message),
          signature: input.signature as `0x${string}`,
        });
      } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid signature format" });
      }

      if (recoveredAddress.toLowerCase() !== input.walletAddress.toLowerCase()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Signature does not match wallet address" });
      }

      const id = await db.createVerification({
        listingId: input.listingId,
        walletAddress: input.walletAddress,
        chainId: input.chainId,
        signature: input.signature,
        message: input.message,
        verifiedAt: nowTimestamp(),
      });

      return { success: true, id };
    }),
});
