import { publicProcedure, router } from "../_core/trpc";
import * as db from "../db";

export const chainsRouter = router({
  list: publicProcedure.query(async () => {
    return db.getAllChains();
  }),
});
