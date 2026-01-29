import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { storagePut } from "../storage";

export const storageRouter = router({
  /**
   * Upload file to S3 from client
   */
  upload: protectedProcedure
    .input(
      z.object({
        key: z.string(),
        data: z.string(), // base64 encoded
        contentType: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      console.log(`[Storage] Upload request: key=${input.key}, contentType=${input.contentType}, dataLength=${input.data.length}`);
      
      try {
        // Convert base64 back to buffer
        const buffer = Buffer.from(input.data, "base64");
        console.log(`[Storage] Buffer created: ${buffer.length} bytes`);

        // Upload to S3
        const result = await storagePut(input.key, buffer, input.contentType);
        console.log(`[Storage] Upload success: url=${result.url}`);

        return result;
      } catch (error) {
        console.error(`[Storage] Upload failed:`, error);
        throw error;
      }
    }),
});
