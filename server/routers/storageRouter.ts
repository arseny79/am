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
      // Convert base64 back to buffer
      const buffer = Buffer.from(input.data, "base64");

      // Upload to S3
      const result = await storagePut(input.key, buffer, input.contentType);

      return result;
    }),
});
