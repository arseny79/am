import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as escrowService from "../lib/escrowService";
import * as db from "../db";
import { getDb } from "../db";
import { deals } from "../../drizzle/schema";
import { eq, isNotNull } from "drizzle-orm";

export const adminEscrowRouter = router({
  // List all escrow transactions from Escrow.com
  listAll: adminProcedure.query(async () => {
    const transactions = await escrowService.listEscrowTransactions();
    return { transactions };
  }),

  // Get escrow transaction details
  getTransaction: adminProcedure
    .input(z.object({ transactionId: z.string() }))
    .query(async ({ input }) => {
      const transaction = await escrowService.getEscrowTransaction(input.transactionId);
      
      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Escrow transaction not found" });
      }

      return { transaction };
    }),

  // Get all deals with escrow transactions
  getDealsWithEscrow: adminProcedure.query(async () => {
    const database = await getDb();
    if (!database) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    }

    const dealsWithEscrow = await database
      .select()
      .from(deals)
      .where(isNotNull(deals.escrowTransactionId))
      .orderBy(deals.createdAt);

    // Enrich with buyer, seller, and listing info
    const enrichedDeals = await Promise.all(
      dealsWithEscrow.map(async (deal) => {
        const buyer = await db.getUserById(deal.buyerId);
        const seller = await db.getUserById(deal.sellerId);
        const listing = await db.getListingById(deal.listingId);

        return {
          ...deal,
          buyer: {
            id: buyer?.id,
            name: buyer?.name,
            email: buyer?.email,
          },
          seller: {
            id: seller?.id,
            name: seller?.name,
            email: seller?.email,
          },
          listing: {
            id: listing?.id,
            businessName: listing?.businessName,
          },
        };
      })
    );

    return { deals: enrichedDeals };
  }),

  // Sync escrow status from Escrow.com
  syncEscrowStatus: adminProcedure
    .input(z.object({ dealId: z.number() }))
    .mutation(async ({ input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      if (!deal.escrowTransactionId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Deal has no escrow transaction" });
      }

      const transaction = await escrowService.getEscrowTransaction(deal.escrowTransactionId);
      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Escrow transaction not found" });
      }

      // Map Escrow.com status to our enum
      const statusMap: Record<string, string> = {
        "not_started": "not_started",
        "created": "created",
        "agreed": "agreed",
        "funded": "funded",
        "shipped": "shipped",
        "received": "received",
        "accepted": "accepted",
        "completed": "completed",
        "cancelled": "cancelled",
      };

      const mappedStatus = statusMap[transaction.status] || "created";

      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      await database
        .update(deals)
        .set({
          escrowStatus: mappedStatus as any,
          updatedAt: new Date(),
        })
        .where(eq(deals.id, input.dealId));

      return { 
        success: true, 
        status: mappedStatus,
        escrowTransaction: transaction,
      };
    }),

  // Cancel escrow transaction
  cancelEscrow: adminProcedure
    .input(z.object({ 
      dealId: z.number(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const deal = await db.getDealById(input.dealId);
      if (!deal) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      }

      if (!deal.escrowTransactionId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Deal has no escrow transaction" });
      }

      const success = await escrowService.cancelEscrowTransaction(deal.escrowTransactionId);
      
      if (!success) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to cancel escrow transaction" });
      }

      const database = await getDb();
      if (!database) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      await database
        .update(deals)
        .set({
          escrowStatus: "cancelled",
          updatedAt: new Date(),
        })
        .where(eq(deals.id, input.dealId));

      // Log activity
      await db.createDealActivity({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: "deal_cancelled",
        description: `Escrow transaction cancelled by admin. Reason: ${input.reason || "Not specified"}`,
        metadata: JSON.stringify({
          escrowTransactionId: deal.escrowTransactionId,
          reason: input.reason,
        }),
      });

      return { success: true };
    }),
});
