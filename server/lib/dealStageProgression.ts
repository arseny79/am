import * as db from "../db";

/**
 * Automatically advance deal stage when certain milestones are reached
 * Logs activity and sends notifications to both parties
 */

type DealStage = "initial_contact" | "nda_signed" | "due_diligence" | "negotiation" | "escrow" | "closing" | "closed" | "cancelled";

interface AutoProgressionResult {
  stageChanged: boolean;
  newStage?: DealStage;
  activityId?: number;
}

/**
 * Auto-advance deal stage with activity logging and notifications
 */
export async function autoAdvanceDealStage(
  dealId: number,
  trigger: "nda_signed" | "first_document_uploaded",
  triggeredByUserId: number
): Promise<AutoProgressionResult> {
  const deal = await db.getDealById(dealId);
  if (!deal) {
    return { stageChanged: false };
  }

  let newStage: DealStage | null = null;
  let activityDescription = "";

  // Determine if stage should advance based on trigger
  switch (trigger) {
    case "nda_signed":
      if (deal.stage === "initial_contact") {
        newStage = "nda_signed";
        activityDescription = "Deal automatically advanced to NDA Signed stage after buyer signed NDA";
      }
      break;

    case "first_document_uploaded":
      if (deal.stage === "nda_signed") {
        newStage = "due_diligence";
        activityDescription = "Deal automatically advanced to Due Diligence stage after first document was uploaded";
      }
      break;
  }

  // If no stage change needed, return early
  if (!newStage) {
    return { stageChanged: false };
  }

  // Update deal stage
  await db.updateDealStage(dealId, newStage);

  // Log activity
  await db.createDealActivity({
    dealId,
    userId: triggeredByUserId,
    activityType: "stage_changed",
    description: activityDescription,
  });

  // Get listing info for notifications
  const listing = await db.getListingById(deal.listingId);
  const listingName = listing?.businessName || "the listing";

  // Notify buyer
  await db.createNotification({
    userId: deal.buyerId,
    type: "deal_stage_change",
    title: "Deal Stage Updated",
    message: `Your deal for "${listingName}" has automatically advanced to ${formatStageName(newStage)}`,
    relatedEntityType: "deal",
    relatedEntityId: dealId,
    isRead: 0,
    emailSent: 0,
  });

  // Notify seller
  await db.createNotification({
    userId: deal.sellerId,
    type: "deal_stage_change",
    title: "Deal Stage Updated",
    message: `The deal for "${listingName}" has automatically advanced to ${formatStageName(newStage)}`,
    relatedEntityType: "deal",
    relatedEntityId: dealId,
    isRead: 0,
    emailSent: 0,
  });

  return {
    stageChanged: true,
    newStage,
  };
}

/**
 * Format stage name for display
 */
function formatStageName(stage: DealStage): string {
  const stageNames: Record<DealStage, string> = {
    initial_contact: "Initial Contact",
    nda_signed: "NDA Signed",
    due_diligence: "Due Diligence",
    negotiation: "Negotiation",
    escrow: "Escrow",
    closing: "Closing",
    closed: "Closed",
    cancelled: "Cancelled",
  };
  return stageNames[stage] || stage;
}
