import { notifyOwner } from "./_core/notification";

/**
 * Email notification helper for marketplace events
 * Uses the built-in Manus notification system
 */

export async function sendNewDealNotification(params: {
  sellerName: string;
  buyerName: string;
  listingName: string;
}) {
  await notifyOwner({
    title: "New Deal Created",
    content: `${params.buyerName} is interested in "${params.listingName}" (Seller: ${params.sellerName})`,
  });
}

export async function sendNDASignedNotification(params: {
  buyerName: string;
  listingName: string;
  sellerName: string;
}) {
  await notifyOwner({
    title: "NDA Signed",
    content: `${params.buyerName} signed an NDA for "${params.listingName}" (Seller: ${params.sellerName})`,
  });
}

export async function sendDealStageChangeNotification(params: {
  listingName: string;
  newStage: string;
  buyerName: string;
  sellerName: string;
}) {
  await notifyOwner({
    title: "Deal Stage Updated",
    content: `Deal for "${params.listingName}" moved to ${params.newStage} (Buyer: ${params.buyerName}, Seller: ${params.sellerName})`,
  });
}

export async function sendDocumentUploadedNotification(params: {
  uploaderName: string;
  fileName: string;
  listingName: string;
}) {
  await notifyOwner({
    title: "Document Uploaded",
    content: `${params.uploaderName} uploaded "${params.fileName}" for "${params.listingName}"`,
  });
}

export async function sendNewMessageNotification(params: {
  senderName: string;
  recipientName: string;
  listingName: string;
}) {
  await notifyOwner({
    title: "New Message",
    content: `${params.senderName} sent a message to ${params.recipientName} about "${params.listingName}"`,
  });
}

export async function sendNewListingNotification(params: {
  sellerName: string;
  listingName: string;
  annualRevenue: number;
  ebitda: number;
}) {
  await notifyOwner({
    title: "New Listing Published",
    content: `${params.sellerName} published "${params.listingName}" - Revenue: $${params.annualRevenue.toLocaleString()}, EBITDA: $${params.ebitda.toLocaleString()}`,
  });
}

export async function sendNegotiationUpdateEmail(
  recipientEmail: string,
  recipientName: string,
  businessName: string,
  offerAmount: number,
  reason: string,
  dealId: number
) {
  await notifyOwner({
    title: "Negotiation Update",
    content: `Counter-offer of $${offerAmount.toLocaleString()} received for "${businessName}". Reason: ${reason}. Deal ID: ${dealId}`,
  });
}
