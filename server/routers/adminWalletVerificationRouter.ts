import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const adminWalletVerificationRouter = router({
  listVerifications: adminProcedure.query(async () => {
    return db.getAllWalletVerifications();
  }),

  revokeVerification: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await db.revokeVerification(input.id);
      return { success: true };
    }),
});
