import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { storagePut } from "../storage";
import { TRPCError } from "@trpc/server";

export const logoUploadRouter = router({
  /**
   * Upload a logo image and return the S3 URL
   */
  uploadLogo: protectedProcedure
    .input(z.object({
      fileName: z.string(),
      fileData: z.string(), // base64 encoded image data
      mimeType: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Validate mime type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];
        if (!allowedTypes.includes(input.mimeType)) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "Invalid file type. Only JPG, PNG, WebP, and SVG are allowed." 
          });
        }

        // Decode base64 data
        const buffer = Buffer.from(input.fileData, "base64");

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (buffer.length > maxSize) {
          throw new TRPCError({ 
            code: "BAD_REQUEST", 
            message: "File too large. Maximum size is 5MB." 
          });
        }

        // Generate unique file key
        const ext = input.fileName.split(".").pop() || "png";
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(7);
        const fileKey = `logos/${ctx.user.id}/${timestamp}-${random}.${ext}`;

        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        return { url };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Logo upload error:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Failed to upload logo" 
        });
      }
    }),
});
