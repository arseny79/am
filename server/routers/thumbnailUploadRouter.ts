import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";

/**
 * Thumbnail Upload Router
 * Handles uploading custom thumbnails for Premium listings
 */
export const thumbnailUploadRouter = router({
  upload: protectedProcedure
    .input(
      z.object({
        listingId: z.number(),
        imageData: z.string(), // Base64 encoded image
        mimeType: z.string(), // e.g., "image/jpeg", "image/png"
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate mime type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid image type. Allowed: JPEG, PNG, WebP",
        });
      }

      // Decode base64 image
      const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (buffer.length > maxSize) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Image too large. Maximum size is 5MB",
        });
      }

      // Generate unique filename with random suffix to prevent enumeration
      const extension = input.mimeType.split("/")[1];
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      const fileName = `listing-${input.listingId}-thumbnail-${randomSuffix}.${extension}`;
      const fileKey = `${ctx.user.id}-thumbnails/${fileName}`;

      // Upload to S3
      const { url } = await storagePut(fileKey, buffer, input.mimeType);

      return {
        success: true,
        url,
      };
    }),
});
