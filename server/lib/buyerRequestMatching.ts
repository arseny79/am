import * as db from "../db";
import { sendEmail, EmailTemplates } from './emailService';

interface BuyerRequest {
  id: number;
  buyerId: number;
  title: string;
  minRevenue: number | null;
  maxRevenue: number | null;
  minEbitda: number | null;
  maxEbitda: number | null;
  budget: number | null;
  requiredServiceMix: string | null;
  preferredLocations: string | null;
}

interface Listing {
  id: number;
  sellerId: number;
  businessName: string;
  annualRevenue: number;
  ebitda: number;
  location: string;
  serviceMix: string | null;
  askingPrice: number | null;
  isPublished: boolean;
}

/**
 * Check if a listing matches a buyer request criteria
 */
export function isListingMatch(listing: Listing, request: BuyerRequest): boolean {
  // Only match published listings
  if (!listing.isPublished) {
    return false;
  }

  // Check revenue range (fix: use != null instead of falsy check)
  if (request.minRevenue != null && listing.annualRevenue < request.minRevenue) {
    return false;
  }
  if (request.maxRevenue != null && listing.annualRevenue > request.maxRevenue) {
    return false;
  }

  // Check EBITDA range (only if listing has EBITDA data)
  if (request.minEbitda != null && listing.ebitda != null && listing.ebitda < request.minEbitda) {
    return false;
  }
  if (request.maxEbitda != null && listing.ebitda != null && listing.ebitda > request.maxEbitda) {
    return false;
  }

  // Check budget: buyer's budget must be >= listing's asking price
  if (request.budget != null && listing.askingPrice != null && request.budget < listing.askingPrice) {
    return false;
  }

  // Check location (simple contains check)
  if (request.preferredLocations) {
    const requestLocations = request.preferredLocations
      .toLowerCase()
      .split(",")
      .map((l) => l.trim());
    const listingLocation = listing.location.toLowerCase();

    const locationMatch = requestLocations.some((reqLoc) =>
      listingLocation.includes(reqLoc) || reqLoc.includes(listingLocation)
    );

    if (!locationMatch) {
      return false;
    }
  }

  // Check service mix: if buyer specifies required services, at least one must appear in listing's categories
  if (request.requiredServiceMix && listing.serviceMix) {
    const requiredServices = request.requiredServiceMix
      .toLowerCase()
      .split(",")
      .map((s) => s.trim());
    const listingServices = listing.serviceMix.toLowerCase();

    const serviceMatch = requiredServices.some((svc) => listingServices.includes(svc));

    if (!serviceMatch) {
      return false;
    }
  }

  return true;
}

/**
 * Find all listings that match a buyer request
 */
export async function findMatchingListings(
  requestId: number
): Promise<{ listing: Listing; seller: { id: number; name: string | null } }[]> {
  const request = await db.getBuyerRequestById(requestId);
  if (!request) {
    return [];
  }

  const allListings = await db.getPublishedListings();
  const matches: { listing: Listing; seller: { id: number; name: string | null } }[] = [];

  for (const listing of allListings) {
    if (isListingMatch(listing, request)) {
      const seller = await db.getUserById(listing.sellerId);
      if (seller) {
        matches.push({
          listing,
          seller: { id: seller.id, name: seller.name },
        });
      }
    }
  }

  return matches;
}

/**
 * Notify sellers when a new buyer request matches their listing
 */
export async function notifyMatchingSellers(requestId: number): Promise<void> {
  const matches = await findMatchingListings(requestId);
  const request = await db.getBuyerRequestById(requestId);

  if (!request) {
    return;
  }

  for (const { listing, seller } of matches) {
    try {
      // In-app notification
      await db.createNotification({
        userId: seller.id,
        title: "New Buyer Request Matches Your Listing",
        message: `A buyer is looking for: "${request.title}". Your listing "${listing.businessName}" matches their criteria. Click to respond with a proposal.`,
        type: "buyer_request_match",
        relatedEntityType: "buyer_request",
        relatedEntityId: requestId,
      });

      // Email notification
      const sellerUser = await db.getUserById(seller.id);
      if (sellerUser?.email) {
        const proposalUrl = `${process.env.VITE_APP_URL || 'https://acq.market'}/buy-asset`;
        await sendEmail({
          to: sellerUser.email,
          ...EmailTemplates.buyerRequestMatch({
            recipientName: sellerUser.name || 'there',
            requestTitle: request.title,
            listingName: listing.businessName,
            proposalUrl,
          }),
        });
      }
    } catch (error) {
      console.error(`Failed to notify seller ${seller.id}:`, error);
    }
  }

  console.log(`[Matching] Notified ${matches.length} sellers about request #${requestId}`);
}
