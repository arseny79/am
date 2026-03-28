import { z } from "zod";
import { adminProcedure, protectedProcedure, router, seniorAdminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { cryptoPayments } from "../../drizzle/schema";
import { eq, desc, and, or } from "drizzle-orm";

export const cryptoPaymentsRouter = router({
  // ─── User endpoints ──────────────────────────────────────────────────────────

  /** Authenticated: get the user's crypto payment history */
  myPayments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
      .select()
      .from(cryptoPayments)
      .where(eq(cryptoPayments.userId, ctx.user.id))
      .orderBy(desc(cryptoPayments.createdAt));
  }),

  /** Authenticated: get a specific crypto payment (must belong to the user) */
  getPayment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const rows = await db
        .select()
        .from(cryptoPayments)
        .where(
          and(
            eq(cryptoPayments.id, input.id),
            eq(cryptoPayments.userId, ctx.user.id),
          ),
        )
        .limit(1);

      return rows[0] ?? null;
    }),

  /**
   * Authenticated: initiate a crypto payment.
   * In production this would call Coinbase Commerce / BTCPay to create a charge.
   * For now it creates a pending record and returns a placeholder checkout URL.
   */
  initiate: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(['listing_fee', 'ai_agent_subscription', 'ai_agent_deal', 'success_fee', 'custom']),
        entityId: z.number().optional(),
        dealId: z.number().optional(),
        listingId: z.number().optional(),
        fiatAmountCents: z.number().int().positive(),
        fiatCurrency: z.string().default('USD'),
        cryptoCurrency: z.string().optional(), // e.g. 'BTC', 'ETH', 'USDT'
        provider: z.enum(['coinbase_commerce', 'btcpay', 'manual']).default('coinbase_commerce'),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // TODO: Integrate with Coinbase Commerce or BTCPay to create a real charge
      // const charge = await coinbaseCommerce.createCharge({ ... });

      const [result] = await db.insert(cryptoPayments).values({
        userId: ctx.user.id,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        dealId: input.dealId ?? null,
        listingId: input.listingId ?? null,
        fiatAmountCents: input.fiatAmountCents,
        fiatCurrency: input.fiatCurrency,
        cryptoCurrency: input.cryptoCurrency ?? null,
        provider: input.provider,
        status: 'pending',
      }).$returningId();

      return {
        paymentId: result.id,
        status: 'pending',
        // checkoutUrl will be populated once provider integration is active
        checkoutUrl: null,
      };
    }),

  // ─── Admin endpoints ──────────────────────────────────────────────────────────

  /** Admin: list all crypto payments with filters */
  adminList: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        provider: z.string().optional(),
        limit: z.number().int().positive().max(200).default(50),
        offset: z.number().int().nonneg().default(0),
      }),
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];
      if (input.status) {
        conditions.push(
          eq(
            cryptoPayments.status,
            input.status as (typeof cryptoPayments.status)['_']['data'],
          ),
        );
      }
      if (input.provider) {
        conditions.push(
          eq(
            cryptoPayments.provider,
            input.provider as (typeof cryptoPayments.provider)['_']['data'],
          ),
        );
      }

      return db
        .select()
        .from(cryptoPayments)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(cryptoPayments.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  /** Admin: manually update a payment status (for manual crypto or dispute resolution) */
  adminUpdateStatus: seniorAdminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(['pending', 'awaiting_payment', 'underpaid', 'overpaid', 'confirmed', 'completed', 'expired', 'failed', 'refunded']),
        txHash: z.string().optional(),
        adminNotes: z.string().optional(),
        confirmations: z.number().int().nonneg().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, ...updates } = input;

      const setValues: Record<string, unknown> = { status: updates.status };
      if (updates.txHash !== undefined) setValues.txHash = updates.txHash;
      if (updates.adminNotes !== undefined) setValues.adminNotes = updates.adminNotes;
      if (updates.confirmations !== undefined) setValues.confirmations = updates.confirmations;
      if (updates.status === 'confirmed' || updates.status === 'completed') {
        setValues.confirmedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
      if (updates.status === 'completed') {
        setValues.completedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }

      await db
        .update(cryptoPayments)
        .set(setValues)
        .where(eq(cryptoPayments.id, id));

      return { success: true };
    }),

  /** Admin: get payment stats */
  adminStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const all = await db.select().from(cryptoPayments);

    const stats = {
      total: all.length,
      pending: all.filter(p => p.status === 'pending').length,
      awaitingPayment: all.filter(p => p.status === 'awaiting_payment').length,
      confirmed: all.filter(p => p.status === 'confirmed').length,
      completed: all.filter(p => p.status === 'completed').length,
      failed: all.filter(p => ['failed', 'expired'].includes(p.status)).length,
      totalCompletedFiatCents: all
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.fiatAmountCents, 0),
    };

    return stats;
  }),
});
