import { Request, Response } from "express";
import { getDb } from "../db";
import { deals, dealActivities } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

interface DocuSignWebhookPayload {
  event: string;
  apiVersion: string;
  uri: string;
  retryCount: number;
  configurationId: number;
  generatedDateTime: string;
  data: {
    envelopeId: string;
    envelopeSummary: {
      status: string;
      recipients: {
        signers: Array<{
          email: string;
          name: string;
          recipientId: string;
          status: string;
          signedDateTime?: string;
          deliveredDateTime?: string;
          roleName?: string;
        }>;
      };
    };
  };
}

export async function handleDocuSignWebhook(req: Request, res: Response) {
  try {
    const payload = req.body as DocuSignWebhookPayload;
    
    console.log("[DocuSign Webhook] Received event:", payload.event);
    console.log("[DocuSign Webhook] Envelope ID:", payload.data?.envelopeId);
    
    // Validate payload
    if (!payload.data?.envelopeId) {
      console.error("[DocuSign Webhook] Missing envelope ID");
      return res.status(400).json({ error: "Missing envelope ID" });
    }
    
    const db = await getDb();
    if (!db) {
      console.error("[DocuSign Webhook] Database not available");
      return res.status(500).json({ error: "Database not available" });
    }
    
    // Find deal by envelope ID
    const [deal] = await db.select().from(deals)
      .where(eq(deals.docusignEnvelopeId, payload.data.envelopeId));
    
    if (!deal) {
      console.log("[DocuSign Webhook] No deal found for envelope:", payload.data.envelopeId);
      return res.status(200).json({ received: true, message: "No matching deal found" });
    }
    
    // Process based on event type
    const envelopeSummary = payload.data.envelopeSummary;
    const signers = envelopeSummary?.recipients?.signers || [];
    
    // Update signer statuses
    let buyerStatus = deal.docusignBuyerStatus;
    let sellerStatus = deal.docusignSellerStatus;
    
    for (const signer of signers) {
      const roleName = signer.roleName?.toLowerCase();
      const status = signer.status?.toLowerCase();
      
      if (roleName === "buyer" || signer.recipientId === "1") {
        buyerStatus = status === "completed" ? "signed" : status;
      } else if (roleName === "seller" || signer.recipientId === "2") {
        sellerStatus = status === "completed" ? "signed" : status;
      }
    }
    
    // Update deal
    const updateData: any = {
      docusignStatus: envelopeSummary.status,
      docusignBuyerStatus: buyerStatus,
      docusignSellerStatus: sellerStatus,
    };
    
    // Check if both signed
    if (buyerStatus === "signed" && sellerStatus === "signed") {
      updateData.stage = "nda_signed";
      updateData.buyerNdaConfirmed = 1;
      updateData.sellerNdaConfirmed = 1;
      
      // Log activity
      await db.insert(dealActivities).values({
        dealId: deal.id,
        userId: deal.sellerId, // Use seller as default
        activityType: "stage_changed",
        description: "NDA fully signed via DocuSign - Deal advanced to NDA Signed stage",
      });
    }
    
    await db.update(deals)
      .set(updateData)
      .where(eq(deals.id, deal.id));
    
    console.log("[DocuSign Webhook] Updated deal:", deal.id, "Status:", envelopeSummary.status);
    
    return res.status(200).json({ received: true, dealId: deal.id });
    
  } catch (error: any) {
    console.error("[DocuSign Webhook] Error:", error.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
