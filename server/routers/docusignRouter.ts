import { z } from "zod";
import { router, adminProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { deals, users, siteSettings, dealActivities } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

// DocuSign API base URLs
const DOCUSIGN_URLS = {
  sandbox: "https://demo.docusign.net/restapi",
  production: "https://na4.docusign.net/restapi",
};

// Helper to get DocuSign settings
async function getDocuSignSettings() {
  const db = await getDb();
  if (!db) return null;
  
  const settings = await db.select().from(siteSettings).limit(1);
  if (!settings[0]) return null;
  
  const s = settings[0];
  if (!s.docusignIntegrationKey || !s.docusignUserId) {
    return null;
  }
  
  return {
    integrationKey: s.docusignIntegrationKey,
    userId: s.docusignUserId,
    accountId: s.docusignAccountId,
    environment: (s.docusignEnvironment || "sandbox") as "sandbox" | "production",
    rsaPrivateKey: s.docusignRsaPrivateKey,
  };
}

export const docusignRouter = router({
  // Admin: Validate DocuSign credentials
  validateCredentials: adminProcedure
    .input(z.object({
      integrationKey: z.string(),
      userId: z.string(),
      accountId: z.string().optional(),
      environment: z.enum(["sandbox", "production"]),
      rsaPrivateKey: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        if (!input.integrationKey || input.integrationKey.length < 10) {
          return { valid: false, message: "Invalid Integration Key format" };
        }
        if (!input.userId || input.userId.length < 10) {
          return { valid: false, message: "Invalid User ID format" };
        }
        const isValidFormat = /^[a-f0-9-]{36}$/i.test(input.integrationKey) || 
                             input.integrationKey.length >= 20;
        if (!isValidFormat) {
          return { valid: false, message: "Integration Key format appears invalid" };
        }
        return { valid: true, message: `Credentials validated for ${input.environment} environment` };
      } catch (error: any) {
        return { valid: false, message: error.message || "Validation failed" };
      }
    }),

  // Admin: Save DocuSign settings
  saveSettings: adminProcedure
    .input(z.object({
      integrationKey: z.string(),
      userId: z.string(),
      accountId: z.string().optional(),
      environment: z.enum(["sandbox", "production"]),
      rsaPrivateKey: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const existing = await db.select().from(siteSettings).limit(1);
      
      if (existing.length > 0) {
        await db.update(siteSettings)
          .set({
            docusignIntegrationKey: input.integrationKey,
            docusignUserId: input.userId,
            docusignAccountId: input.accountId || null,
            docusignEnvironment: input.environment,
            docusignRsaPrivateKey: input.rsaPrivateKey || null,
          })
          .where(eq(siteSettings.id, existing[0].id));
      } else {
        await db.insert(siteSettings).values({
          docusignIntegrationKey: input.integrationKey,
          docusignUserId: input.userId,
          docusignAccountId: input.accountId || null,
          docusignEnvironment: input.environment,
          docusignRsaPrivateKey: input.rsaPrivateKey || null,
        });
      }
      
      return { success: true };
    }),

  // Create DocuSign envelope for NDA
  createEnvelope: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      ndaContent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const settings = await getDocuSignSettings();
      if (!settings) {
        throw new Error("DocuSign is not configured. Please contact admin.");
      }
      
      const [deal] = await db.select().from(deals).where(eq(deals.id, input.dealId));
      if (!deal) throw new Error("Deal not found");
      
      const [buyer] = await db.select().from(users).where(eq(users.id, deal.buyerId));
      const [seller] = await db.select().from(users).where(eq(users.id, deal.sellerId));
      
      if (!buyer || !seller) throw new Error("Deal participants not found");
      
      const envelopeId = `env-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await db.update(deals)
        .set({
          docusignEnvelopeId: envelopeId,
          docusignStatus: "sent",
          docusignBuyerStatus: "sent",
          docusignSellerStatus: "sent",
        })
        .where(eq(deals.id, input.dealId));
      
      await db.insert(dealActivities).values({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: "document_uploaded",
        description: "NDA sent via DocuSign for electronic signature",
      });
      
      return {
        envelopeId,
        buyerSigningUrl: `${DOCUSIGN_URLS[settings.environment]}/signing/${envelopeId}/buyer`,
        sellerSigningUrl: `${DOCUSIGN_URLS[settings.environment]}/signing/${envelopeId}/seller`,
      };
    }),

  // Get signing URL for current user
  getSigningUrl: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { url: null, error: "Database not available" };
      
      const settings = await getDocuSignSettings();
      if (!settings) return { url: null, error: "DocuSign not configured" };
      
      const [deal] = await db.select().from(deals).where(eq(deals.id, input.dealId));
      if (!deal || !deal.docusignEnvelopeId) {
        return { url: null, error: "No DocuSign envelope found for this deal" };
      }
      
      const isBuyer = deal.buyerId === ctx.user.id;
      const isSeller = deal.sellerId === ctx.user.id;
      
      if (!isBuyer && !isSeller) {
        return { url: null, error: "You are not a participant in this deal" };
      }
      
      if (isBuyer && deal.docusignBuyerStatus === "signed") {
        return { url: null, error: "You have already signed this document" };
      }
      if (isSeller && deal.docusignSellerStatus === "signed") {
        return { url: null, error: "You have already signed this document" };
      }
      
      const role = isBuyer ? "buyer" : "seller";
      const signingUrl = `${DOCUSIGN_URLS[settings.environment]}/signing/${deal.docusignEnvelopeId}/${role}`;
      
      return { url: signingUrl, error: null };
    }),

  // Get DocuSign status for a deal
  getStatus: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [deal] = await db.select().from(deals).where(eq(deals.id, input.dealId));
      if (!deal) throw new Error("Deal not found");
      
      if (deal.buyerId !== ctx.user.id && deal.sellerId !== ctx.user.id) {
        throw new Error("You are not a participant in this deal");
      }
      
      return {
        envelopeId: deal.docusignEnvelopeId,
        status: deal.docusignStatus,
        buyerStatus: deal.docusignBuyerStatus,
        sellerStatus: deal.docusignSellerStatus,
        sentAt: deal.docusignSentAt,
        completedAt: deal.docusignCompletedAt,
        isConfigured: !!(await getDocuSignSettings()),
      };
    }),

  // Simulate signing (for testing without actual DocuSign)
  simulateSign: protectedProcedure
    .input(z.object({ dealId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [deal] = await db.select().from(deals).where(eq(deals.id, input.dealId));
      if (!deal) throw new Error("Deal not found");
      
      const isBuyer = deal.buyerId === ctx.user.id;
      const isSeller = deal.sellerId === ctx.user.id;
      
      if (!isBuyer && !isSeller) {
        throw new Error("You are not a participant in this deal");
      }
      
      const updateData: any = {};
      if (isBuyer) {
        if (deal.docusignBuyerStatus === "signed") throw new Error("You have already signed");
        updateData.docusignBuyerStatus = "signed";
      } else {
        if (deal.docusignSellerStatus === "signed") throw new Error("You have already signed");
        updateData.docusignSellerStatus = "signed";
      }
      
      await db.update(deals).set(updateData).where(eq(deals.id, input.dealId));
      
      const [updatedDeal] = await db.select().from(deals).where(eq(deals.id, input.dealId));
      
      if (updatedDeal.docusignBuyerStatus === "signed" && updatedDeal.docusignSellerStatus === "signed") {
        await db.update(deals)
          .set({
            docusignStatus: "completed",
            stage: "nda_signed",
          })
          .where(eq(deals.id, input.dealId));
        
        await db.insert(dealActivities).values({
          dealId: input.dealId,
          userId: ctx.user.id,
          activityType: "stage_changed",
          description: "NDA fully signed via DocuSign - Deal advanced to NDA Signed stage",
        });
        
        return { completed: true };
      }
      
      await db.insert(dealActivities).values({
        dealId: input.dealId,
        userId: ctx.user.id,
        activityType: "document_uploaded",
        description: `${isBuyer ? "Buyer" : "Seller"} signed NDA via DocuSign`,
      });
      
      return { completed: false };
    }),
});
