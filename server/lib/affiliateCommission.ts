import { eq, sql } from "drizzle-orm";
import { getDb } from "../db";
import { affiliates, affiliateTiers, referrals, affiliateCommissions } from "../../drizzle/schema";

interface CreateCommissionParams {
  dealId: number;
  buyerId: number;
  dealAmount: number; // in cents
  platformFee: number; // in cents
}

/**
 * Create an affiliate commission when a deal is closed
 * This checks if the buyer was referred by an affiliate and creates a commission record
 */
export async function createAffiliateCommission(params: CreateCommissionParams): Promise<{
  success: boolean;
  commissionId?: number;
  commissionAmount?: number;
  message: string;
}> {
  const { dealId, buyerId, dealAmount, platformFee } = params;
  
  const db = await getDb();
  if (!db) {
    return { success: false, message: "Database not available" };
  }
  
  // Check if buyer was referred
  const [referral] = await db
    .select({
      id: referrals.id,
      affiliateId: referrals.affiliateId,
      status: referrals.status,
    })
    .from(referrals)
    .where(eq(referrals.referredUserId, buyerId))
    .limit(1);
  
  if (!referral) {
    return { success: false, message: "Buyer was not referred" };
  }
  
  // Check if referral has already been converted
  if (referral.status === "converted") {
    return { success: false, message: "Referral already converted" };
  }
  
  // Check if referral has expired
  if (referral.status === "expired") {
    return { success: false, message: "Referral has expired" };
  }
  
  // Get affiliate and verify they're active
  const [affiliate] = await db
    .select({
      id: affiliates.id,
      tierId: affiliates.tierId,
      status: affiliates.status,
    })
    .from(affiliates)
    .where(eq(affiliates.id, referral.affiliateId))
    .limit(1);
  
  if (!affiliate) {
    return { success: false, message: "Affiliate not found" };
  }
  
  if (affiliate.status !== "active") {
    return { success: false, message: "Affiliate is not active" };
  }
  
  // Get affiliate's tier for commission rate
  const [tier] = await db
    .select()
    .from(affiliateTiers)
    .where(eq(affiliateTiers.id, affiliate.tierId))
    .limit(1);
  
  if (!tier) {
    return { success: false, message: "Affiliate tier not found" };
  }
  
  // Calculate commission (percentage of platform fee)
  const commissionPercent = parseFloat(tier.commissionPercent);
  const commissionAmount = Math.floor(platformFee * (commissionPercent / 100));
  
  if (commissionAmount <= 0) {
    return { success: false, message: "Commission amount is zero" };
  }
  
  // Create commission record
  const [result] = await db.insert(affiliateCommissions).values({
    affiliateId: affiliate.id,
    referralId: referral.id,
    dealId,
    dealAmount,
    platformFee,
    commissionPercent: tier.commissionPercent,
    commissionAmount,
    status: "pending",
  });
  
  // Update referral status to converted
  await db
    .update(referrals)
    .set({
      status: "converted",
      convertedAt: new Date(),
      convertedDealId: dealId,
    })
    .where(eq(referrals.id, referral.id));
  
  // Update affiliate stats
  await db
    .update(affiliates)
    .set({
      successfulReferrals: sql`${affiliates.successfulReferrals} + 1`,
      totalEarnings: sql`${affiliates.totalEarnings} + ${commissionAmount}`,
      pendingEarnings: sql`${affiliates.pendingEarnings} + ${commissionAmount}`,
    })
    .where(eq(affiliates.id, affiliate.id));
  
  console.log(`[Affiliate] Commission created: $${(commissionAmount / 100).toFixed(2)} for affiliate ${affiliate.id} on deal ${dealId}`);
  
  return {
    success: true,
    commissionId: result.insertId,
    commissionAmount,
    message: `Commission of $${(commissionAmount / 100).toFixed(2)} created`,
  };
}

/**
 * Mark a referral as qualified (e.g., when user completes KYC or creates a listing)
 */
export async function markReferralQualified(userId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const [referral] = await db
    .select()
    .from(referrals)
    .where(eq(referrals.referredUserId, userId))
    .limit(1);
  
  if (!referral || referral.status !== "registered") {
    return false;
  }
  
  await db
    .update(referrals)
    .set({
      status: "qualified",
      qualifiedAt: new Date(),
    })
    .where(eq(referrals.id, referral.id));
  
  return true;
}

/**
 * Check and expire old referrals that haven't converted
 */
export async function expireOldReferrals(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  const now = new Date();
  
  // Find referrals that have expired
  const expiredReferrals = await db
    .select()
    .from(referrals)
    .where(sql`${referrals.status} IN ('registered', 'qualified') AND ${referrals.expiresAt} < ${now}`);
  
  if (expiredReferrals.length === 0) {
    return 0;
  }
  
  // Update their status to expired
  for (const referral of expiredReferrals) {
    await db
      .update(referrals)
      .set({ status: "expired" })
      .where(eq(referrals.id, referral.id));
  }
  
  console.log(`[Affiliate] Expired ${expiredReferrals.length} referrals`);
  
  return expiredReferrals.length;
}
