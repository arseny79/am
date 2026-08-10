import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const taxonomyRouter = router({
  listVerticals: publicProcedure
    .input(z.object({ includeInactive: z.boolean().optional() }).optional())
    .query(async ({ input }) => {
      return db.getAllVerticals(Boolean(input?.includeInactive));
    }),

  listAssetTypes: publicProcedure
    .input(z.object({ verticalId: z.number().optional(), includeInactive: z.boolean().optional() }))
    .query(async ({ input }) => {
      const includeInactive = Boolean(input.includeInactive);
      if (input.verticalId !== undefined) {
        return db.getAssetTypesByVertical(input.verticalId, includeInactive);
      }
      return db.getAllAssetTypes(includeInactive);
    }),

  listSubcategories: publicProcedure
    .input(z.object({ assetTypeId: z.number() }))
    .query(async ({ input }) => {
      return db.getSubcategoriesByAssetType(input.assetTypeId);
    }),
});
