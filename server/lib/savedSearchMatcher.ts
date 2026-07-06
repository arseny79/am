import * as db from "../db";
import { sendNewListingMatchEmail } from "../emailNotifications";

/**
 * Match a newly published listing against all saved searches and notify
 * buyers whose criteria are satisfied. Never throws — errors are logged
 * per-buyer so one failure does not block others.
 */
export async function notifyMatchingSavedSearches(listingId: number): Promise<void> {
  try {
    const listing = await db.getListingById(listingId);
    if (!listing || listing.status !== "active" || !listing.isPublished) return;

    const searches = await db.getAllSavedSearches();
    if (searches.length === 0) return;

    for (const search of searches) {
      try {
        if (!matchesSearch(listing, search)) continue;

        const result = await db.createNotification({
          userId: search.buyerId,
          type: "new_listing_match",
          title: "New listing matches your search",
          message: `"${listing.businessName}" matches your saved search "${search.name}"`,
          relatedEntityType: "listing",
          relatedEntityId: listingId,
          isRead: 0,
          emailSent: 0,
        });

        const notificationId = Number(result[0].insertId);

        if (search.emailAlerts === 1) {
          const buyer = await db.getUserById(search.buyerId);
          if (buyer?.email) {
            const sent = await sendNewListingMatchEmail({
              buyerEmail: buyer.email,
              buyerName: buyer.name || buyer.email,
              listingName: listing.businessName,
              listingId,
              searchName: search.name,
              annualRevenue: listing.annualRevenue,
              ebitda: listing.ebitda,
            });
            if (sent) {
              await db.markNotificationEmailSent(notificationId);
            }
          }
        }
      } catch (err) {
        console.error(`[SavedSearch] Failed to notify buyer ${search.buyerId} for listing ${listingId}:`, err);
      }
    }
  } catch (err) {
    console.error(`[SavedSearch] notifyMatchingSavedSearches failed for listing ${listingId}:`, err);
  }
}

function matchesSearch(
  listing: { annualRevenue: number; ebitda: number; location: string },
  search: { minRevenue: number | null; maxRevenue: number | null; minEbitda: number | null; maxEbitda: number | null; locations: string | null }
): boolean {
  if (search.minRevenue != null && listing.annualRevenue < search.minRevenue) return false;
  if (search.maxRevenue != null && listing.annualRevenue > search.maxRevenue) return false;
  if (search.minEbitda != null && listing.ebitda < search.minEbitda) return false;
  if (search.maxEbitda != null && listing.ebitda > search.maxEbitda) return false;

  if (search.locations) {
    let locationList: string[] = [];
    try {
      locationList = JSON.parse(search.locations);
      if (!Array.isArray(locationList)) {
        locationList = [];
      }
    } catch {
      // treat as a single comma-separated string if JSON parse fails
      locationList = search.locations.split(",").map(s => s.trim()).filter(Boolean);
    }
    if (locationList.length > 0) {
      const listingLocation = listing.location.toLowerCase();
      const matched = locationList.some(loc => listingLocation.includes(loc.toLowerCase()));
      if (!matched) return false;
    }
  }

  return true;
}
