import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router, seniorAdminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import {
  aiAgents,
  aiAgentSubscriptions,
  aiAgentDealUsages,
  aiAgentConversations,
} from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import OpenAI from "openai";

// ─── Public/user-facing ───────────────────────────────────────────────────────

export const aiAgentsRouter = router({
  /** Public: list all active AI agents */
  listActive: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
      .select()
      .from(aiAgents)
      .where(eq(aiAgents.isActive, 1))
      .orderBy(asc(aiAgents.displayOrder), asc(aiAgents.name));
  }),

  /** Authenticated: get agents the user has access to (subscribed or per-deal) */
  getMyAgents: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const subs = await db
      .select()
      .from(aiAgentSubscriptions)
      .where(
        and(
          eq(aiAgentSubscriptions.userId, ctx.user.id),
          eq(aiAgentSubscriptions.status, 'active'),
        ),
      );

    return subs;
  }),

  /** Authenticated: check if user has access to a specific agent */
  checkAccess: protectedProcedure
    .input(z.object({ agentId: z.number(), dealId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check subscription
      const sub = await db
        .select()
        .from(aiAgentSubscriptions)
        .where(
          and(
            eq(aiAgentSubscriptions.userId, ctx.user.id),
            eq(aiAgentSubscriptions.agentId, input.agentId),
            eq(aiAgentSubscriptions.status, 'active'),
          ),
        )
        .limit(1);

      if (sub.length > 0) return { hasAccess: true, via: 'subscription' as const };

      // Check per-deal usage
      if (input.dealId) {
        const usage = await db
          .select()
          .from(aiAgentDealUsages)
          .where(
            and(
              eq(aiAgentDealUsages.userId, ctx.user.id),
              eq(aiAgentDealUsages.agentId, input.agentId),
              eq(aiAgentDealUsages.dealId, input.dealId),
              eq(aiAgentDealUsages.status, 'active'),
            ),
          )
          .limit(1);

        if (usage.length > 0) return { hasAccess: true, via: 'per_deal' as const };
      }

      return { hasAccess: false, via: null };
    }),

  /** Authenticated: send a message to an AI agent (requires access) */
  chat: protectedProcedure
    .input(
      z.object({
        agentId: z.number(),
        conversationId: z.number().nullable().optional(),
        dealId: z.number().nullable().optional(),
        listingId: z.number().nullable().optional(),
        message: z.string().min(1).max(8000),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify access
      const hasSub = await db
        .select({ id: aiAgentSubscriptions.id })
        .from(aiAgentSubscriptions)
        .where(
          and(
            eq(aiAgentSubscriptions.userId, ctx.user.id),
            eq(aiAgentSubscriptions.agentId, input.agentId),
            eq(aiAgentSubscriptions.status, 'active'),
          ),
        )
        .limit(1);

      let hasPerDeal = false;
      if (!hasSub.length && input.dealId) {
        const usage = await db
          .select({ id: aiAgentDealUsages.id })
          .from(aiAgentDealUsages)
          .where(
            and(
              eq(aiAgentDealUsages.userId, ctx.user.id),
              eq(aiAgentDealUsages.agentId, input.agentId),
              eq(aiAgentDealUsages.dealId, input.dealId),
              eq(aiAgentDealUsages.status, 'active'),
            ),
          )
          .limit(1);
        hasPerDeal = usage.length > 0;
      }

      if (!hasSub.length && !hasPerDeal) {
        throw new Error("Access denied: no active subscription or per-deal access for this agent.");
      }

      // Fetch agent definition
      const agentRow = await db
        .select()
        .from(aiAgents)
        .where(eq(aiAgents.id, input.agentId))
        .limit(1);

      if (!agentRow.length || !agentRow[0].isActive) {
        throw new Error("AI agent not found or inactive.");
      }

      const agent = agentRow[0];

      // Load or create conversation
      let conversation = null;
      let existingMessages: Array<{ role: string; content: string }> = [];

      if (input.conversationId) {
        const convRow = await db
          .select()
          .from(aiAgentConversations)
          .where(
            and(
              eq(aiAgentConversations.id, input.conversationId),
              eq(aiAgentConversations.userId, ctx.user.id),
            ),
          )
          .limit(1);

        if (convRow.length) {
          conversation = convRow[0];
          existingMessages = (conversation.messages as Array<{ role: string; content: string }>) ?? [];
        }
      }

      const userMessage = { role: 'user', content: input.message };
      const messages = [...existingMessages, userMessage];

      // Call OpenAI-compatible API (works with any provider)
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY ?? process.env.ANTHROPIC_API_KEY ?? '',
        baseURL: process.env.AI_BASE_URL ?? undefined,
      });

      const systemPrompt = agent.systemPrompt ?? `You are ${agent.name}, an AI advisor on Acquisitions.market, the iGaming M&A marketplace. ${agent.description}`;

      const completion = await openai.chat.completions.create({
        model: agent.modelId ?? 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
        ],
        max_tokens: 2048,
      });

      const assistantMessage = {
        role: 'assistant',
        content: completion.choices[0]?.message?.content ?? '',
      };

      const updatedMessages = [...messages, assistantMessage];

      // Persist conversation
      if (conversation) {
        await db
          .update(aiAgentConversations)
          .set({ messages: updatedMessages })
          .where(eq(aiAgentConversations.id, conversation.id));
      } else {
        await db.insert(aiAgentConversations).values({
          userId: ctx.user.id,
          agentId: input.agentId,
          dealId: input.dealId ?? null,
          listingId: input.listingId ?? null,
          title: input.message.slice(0, 80),
          messages: updatedMessages,
        });
      }

      return { reply: assistantMessage.content };
    }),

  /** Authenticated: get conversation history */
  getConversations: protectedProcedure
    .input(z.object({ agentId: z.number(), dealId: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [
        eq(aiAgentConversations.userId, ctx.user.id),
        eq(aiAgentConversations.agentId, input.agentId),
      ];

      if (input.dealId) {
        conditions.push(eq(aiAgentConversations.dealId, input.dealId));
      }

      return db
        .select()
        .from(aiAgentConversations)
        .where(and(...conditions))
        .orderBy(desc(aiAgentConversations.updatedAt));
    }),

  // ─── Admin endpoints ────────────────────────────────────────────────────────

  /** Admin: list all agents (including inactive) */
  adminList: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    return db
      .select()
      .from(aiAgents)
      .orderBy(asc(aiAgents.displayOrder), asc(aiAgents.name));
  }),

  /** Admin: create an AI agent */
  adminCreate: seniorAdminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        slug: z.string().min(1).max(100),
        description: z.string().min(1),
        longDescription: z.string().optional(),
        agentType: z.enum(['legal_advisor', 'success_manager', 'due_diligence', 'valuation', 'compliance', 'custom']),
        pricingModel: z.enum(['subscription', 'per_deal', 'both']).default('subscription'),
        monthlyPriceCents: z.number().int().nonnegative().nullable().optional(),
        perDealPriceCents: z.number().int().nonnegative().nullable().optional(),
        systemPrompt: z.string().optional(),
        capabilities: z.array(z.string()).optional(),
        modelId: z.string().optional(),
        displayOrder: z.number().optional().default(0),
        isActive: z.boolean().optional().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { isActive, capabilities, ...rest } = input;

      await db.insert(aiAgents).values({
        ...rest,
        capabilities: capabilities ?? null,
        isActive: isActive ? 1 : 0,
      });

      return { success: true };
    }),

  /** Admin: update an AI agent */
  adminUpdate: seniorAdminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        longDescription: z.string().nullable().optional(),
        pricingModel: z.enum(['subscription', 'per_deal', 'both']).optional(),
        monthlyPriceCents: z.number().int().nonnegative().nullable().optional(),
        perDealPriceCents: z.number().int().nonnegative().nullable().optional(),
        systemPrompt: z.string().nullable().optional(),
        capabilities: z.array(z.string()).nullable().optional(),
        modelId: z.string().optional(),
        displayOrder: z.number().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { id, isActive, ...rest } = input;

      await db
        .update(aiAgents)
        .set({
          ...rest,
          ...(isActive !== undefined ? { isActive: isActive ? 1 : 0 } : {}),
        })
        .where(eq(aiAgents.id, id));

      return { success: true };
    }),

  /** Admin: list all subscriptions */
  adminListSubscriptions: adminProcedure
    .input(z.object({ agentId: z.number().optional(), status: z.string().optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions = [];
      if (input.agentId) conditions.push(eq(aiAgentSubscriptions.agentId, input.agentId));
      if (input.status) conditions.push(eq(aiAgentSubscriptions.status, input.status as 'active' | 'paused' | 'cancelled' | 'past_due'));

      return db
        .select()
        .from(aiAgentSubscriptions)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(aiAgentSubscriptions.createdAt));
    }),
});
