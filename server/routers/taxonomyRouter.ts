import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const taxonomyRouter = router({
  listVerticals: publicProcedure.query(async () => {
    return db.getAllVerticals();
  }),

  listAssetTypes: publicProcedure
    .input(z.object({ verticalId: z.number().optional() }))
    .query(async ({ input }) => {
      if (input.verticalId !== undefined) {
        return db.getAssetTypesByVertical(input.verticalId);
      }
      return db.getAllAssetTypes();
    }),

  listSubcategories: publicProcedure
    .input(z.object({ assetTypeId: z.number() }))
    .query(async ({ input }) => {
      return db.getSubcategoriesByAssetType(input.assetTypeId);
    }),
});
