import { getDb } from "../db";
import { eq, and } from "drizzle-orm";
import { brokerCommissions, brokers, brokerListings } from "../../drizzle/brokerSchema";
import { listings } from "../../drizzle/schema";

/**
 * Broker Commission Service
 * 
 * Handles the 50/50 fee split between brokers and the platform.
 * When a deal closes, this service calculates and records the commission.
 */

export interface CreateCommissionParams {
  dealId: number;
  listingId: number;
  dealAmount: number; // Total deal value in cents
  platformFeePercentage?: number; // Default 3%
}

/**
 * Create a broker commission when a deal closes
 * 
 * @param params - Deal and listing information
 * @returns Commission record or null if listing is not broker-managed
 */
export async function createBrokerCommission(params: CreateCommissionParams) {
  const db = await getDb();
  if (!db) return null;
  
  const { dealId, listingId, dealAmount, platformFeePercentage = 3 } = params;
  
  // Check if this listing is managed by a broker
  const listing = await db
    .select()
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  
  if (!listing[0] || !listing[0].brokerId) {
    // Not a broker-managed listing
    return null;
  }
  
  // Get the broker listing record
  const brokerListing = await db
    .select()
    .from(brokerListings)
    .where(and(
      eq(brokerListings.listingId, listingId),
      eq(brokerListings.brokerId, listing[0].brokerId)
    ))
    .limit(1);
  
  if (!brokerListing[0]) {
    return null;
  }
  
  // Calculate fees (all in cents)
  const platformFee = Math.round(dealAmount * (platformFeePercentage / 100));
  const brokerShare = Math.round(platformFee * 0.5); // 50% to broker
  const platformShare = platformFee - brokerShare; // 50% to platform
  
  // Create commission record
  const result = await db.insert(brokerCommissions).values({
    brokerId: listing[0].brokerId,
    listingId,
    dealId,
    dealAmount,
    platformFee,
    brokerShare,
    platformShare,
    status: 'pending',
  });
  
  return {
    commissionId: Number(result.insertId),
    brokerId: listing[0].brokerId,
    dealAmount,
    platformFee,
    brokerShare,
    platformShare,
  };
}

/**
 * Get commission details for a deal
 */
export async function getCommissionByDealId(dealId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db
    .select({
      commission: brokerCommissions,
      broker: brokers,
    })
    .from(brokerCommissions)
    .leftJoin(brokers, eq(brokerCommissions.brokerId, brokers.id))
    .where(eq(brokerCommissions.dealId, dealId))
    .limit(1);
  
  return result[0] || null;
}

/**
 * Check if a listing is broker-managed
 */
export async function isListingBrokerManaged(listingId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  
  const listing = await db
    .select({ brokerId: listings.brokerId })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  
  return !!listing[0]?.brokerId;
}

/**
 * Get broker info for a listing
 */
export async function getBrokerForListing(listingId: number) {
  const db = await getDb();
  if (!db) return null;
  
  const listing = await db
    .select({ brokerId: listings.brokerId })
    .from(listings)
    .where(eq(listings.id, listingId))
    .limit(1);
  
  if (!listing[0]?.brokerId) return null;
  
  const broker = await db
    .select()
    .from(brokers)
    .where(eq(brokers.id, listing[0].brokerId))
    .limit(1);
  
  return broker[0] || null;
}
