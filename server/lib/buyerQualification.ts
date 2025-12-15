/**
 * Buyer Qualification Helpers
 * Manages buyer verification levels and proof of funds
 */

import { eq } from 'drizzle-orm';
import { getDb } from '../db';
import { buyerQualifications, type InsertBuyerQualification } from '../../drizzle/schema';

/**
 * Get buyer qualification by user ID
 */
export async function getBuyerQualification(userId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select()
    .from(buyerQualifications)
    .where(eq(buyerQualifications.userId, userId))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Create or update buyer qualification
 */
export async function upsertBuyerQualification(data: InsertBuyerQualification) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const existing = await getBuyerQualification(data.userId);
  
  if (existing) {
    // Update existing
    await db
      .update(buyerQualifications)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(buyerQualifications.userId, data.userId));
    
    return await getBuyerQualification(data.userId);
  } else {
    // Insert new
    await db.insert(buyerQualifications).values(data);
    return await getBuyerQualification(data.userId);
  }
}

/**
 * Submit proof of funds for verification
 */
export async function submitProofOfFunds(
  userId: number,
  proofOfFundsUrl: string,
  proofOfFundsAmount: number,
  proofOfFundsType: 'bank_statement' | 'credit_line' | 'investor_letter' | 'other'
) {
  return await upsertBuyerQualification({
    userId,
    proofOfFundsUrl,
    proofOfFundsAmount,
    proofOfFundsType,
    status: 'pending',
    verificationLevel: 'basic', // Stays basic until admin approves
  });
}

/**
 * Approve buyer qualification (admin only)
 */
export async function approveBuyerQualification(
  userId: number,
  verifiedBy: number,
  verificationLevel: 'verified' | 'premium',
  verificationNotes?: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90); // 90 days from now
  
  await db
    .update(buyerQualifications)
    .set({
      status: 'approved',
      verificationLevel,
      verifiedAt: new Date(),
      verifiedBy,
      verificationNotes,
      expiresAt,
      updatedAt: new Date(),
    })
    .where(eq(buyerQualifications.userId, userId));
  
  return await getBuyerQualification(userId);
}

/**
 * Reject buyer qualification (admin only)
 */
export async function rejectBuyerQualification(
  userId: number,
  verifiedBy: number,
  verificationNotes: string
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .update(buyerQualifications)
    .set({
      status: 'rejected',
      verifiedAt: new Date(),
      verifiedBy,
      verificationNotes,
      updatedAt: new Date(),
    })
    .where(eq(buyerQualifications.userId, userId));
  
  return await getBuyerQualification(userId);
}

/**
 * Check if buyer qualification is expired
 */
export function isQualificationExpired(qualification: typeof buyerQualifications.$inferSelect | null): boolean {
  if (!qualification || !qualification.expiresAt) return false;
  return new Date() > qualification.expiresAt;
}

/**
 * Get all pending qualifications (admin only)
 */
export async function getPendingQualifications() {
  const db = await getDb();
  if (!db) return [];
  
  const result = await db
    .select()
    .from(buyerQualifications)
    .where(eq(buyerQualifications.status, 'pending'));
  
  return result;
}

/**
 * Check if buyer has access to listing based on verification level
 */
export function hasListingAccess(
  qualification: typeof buyerQualifications.$inferSelect | null,
  listingPrice: number
): { hasAccess: boolean; reason?: string } {
  // Basic users - limited access
  if (!qualification || qualification.verificationLevel === 'basic') {
    return {
      hasAccess: false,
      reason: 'Please verify your proof of funds to access full listing details',
    };
  }
  
  // Check if expired
  if (isQualificationExpired(qualification)) {
    return {
      hasAccess: false,
      reason: 'Your verification has expired. Please submit updated proof of funds',
    };
  }
  
  // Check if approved
  if (qualification.status !== 'approved') {
    return {
      hasAccess: false,
      reason: 'Your proof of funds is pending verification',
    };
  }
  
  // Check if funds are sufficient
  if (qualification.proofOfFundsAmount && qualification.proofOfFundsAmount < listingPrice) {
    return {
      hasAccess: false,
      reason: `Verified funds ($${qualification.proofOfFundsAmount.toLocaleString()}) are below listing price ($${listingPrice.toLocaleString()})`,
    };
  }
  
  // Verified or Premium users with sufficient funds
  return { hasAccess: true };
}
