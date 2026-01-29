import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import * as db from "../db";
import { eq, desc } from "drizzle-orm";
import { listings } from "../../drizzle/schema";

/**
 * Feed Router
 * 
 * Provides RSS and JSON feeds for marketplace listings
 * Designed for integration with Make.com and N8N automation
 * for social media distribution to X.com and LinkedIn
 */

export const feedRouter = router({
  /**
   * Get RSS feed of latest listings
   * Returns XML in RSS 2.0 format
   */
  getRSSFeed: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      baseUrl: z.string().default("https://msp.investments"),
    }).optional())
    .query(async ({ input }) => {
      const { limit: itemLimit = 20, baseUrl = "https://msp.investments" } = input || {};

      try {
        const db_instance = await db.getDb();
        if (!db_instance) {
          throw new Error("Database not available");
        }

        // Fetch latest active listings
        const activeListings = await db_instance
          .select({
            id: listings.id,
            title: listings.businessName,
            description: listings.description,
            mrrRange: listings.monthlyRecurringRevenue,
            ebitdaMultiple: listings.valuationMultiple,
            location: listings.location,
            createdAt: listings.createdAt,
            updatedAt: listings.updatedAt,
            userId: listings.sellerId,
            status: listings.status,
          })
          .from(listings)
          .where(eq(listings.status, "active"))
          .orderBy(desc(listings.createdAt))
          .limit(itemLimit);

        // Build RSS items
        const items = activeListings.map(listing => {
          const listingUrl = `${baseUrl}/listing/${listing.id}`;
          const createdDate = new Date(listing.createdAt as string).toUTCString();
          
          return `
    <item>
      <title>${escapeXml(listing.title || "Untitled Listing")}</title>
      <link>${listingUrl}</link>
      <guid isPermaLink="true">${listingUrl}</guid>
      <pubDate>${createdDate}</pubDate>
      <description>${escapeXml(listing.description || "No description available")}</description>
      <category>MSP Acquisition</category>
      <content:encoded><![CDATA[
        <p><strong>MRR Range:</strong> ${listing.mrrRange || "Not specified"}</p>
        <p><strong>EBITDA Multiple:</strong> ${listing.ebitdaMultiple || "Not specified"}x</p>
        <p><strong>Location:</strong> ${listing.location || "Not specified"}</p>
        <p><a href="${listingUrl}">View Full Listing</a></p>
      ]]></content:encoded>
    </item>`;
        }).join("\n");

        const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>MSP M&A Marketplace - Latest Listings</title>
    <link>${baseUrl}</link>
    <description>Latest MSP listings available for acquisition on MSP M&A Marketplace</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>3600</ttl>
    ${items}
  </channel>
</rss>`;

        return {
          contentType: "application/rss+xml",
          content: rssXml,
        };
      } catch (error) {
        console.error("[Feed] Failed to generate RSS feed:", error);
        throw error;
      }
    }),

  /**
   * Get JSON feed of latest listings
   * Compatible with JSON Feed format (jsonfeed.org)
   */
  getJSONFeed: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(20),
      baseUrl: z.string().default("https://msp.investments"),
    }).optional())
    .query(async ({ input }) => {
      const { limit: itemLimit = 20, baseUrl = "https://msp.investments" } = input || {};

      try {
        const db_instance = await db.getDb();
        if (!db_instance) {
          throw new Error("Database not available");
        }

        // Fetch latest active listings
        const activeListings = await db_instance
          .select({
            id: listings.id,
            title: listings.businessName,
            description: listings.description,
            mrrRange: listings.monthlyRecurringRevenue,
            ebitdaMultiple: listings.valuationMultiple,
            location: listings.location,
            createdAt: listings.createdAt,
            updatedAt: listings.updatedAt,
            status: listings.status,
          })
          .from(listings)
          .where(eq(listings.status, "active"))
          .orderBy(desc(listings.createdAt))
          .limit(itemLimit);

        // Build JSON feed items
        const items = activeListings.map(listing => ({
          id: `${baseUrl}/listing/${listing.id}`,
          url: `${baseUrl}/listing/${listing.id}`,
          title: listing.title || "Untitled Listing",
          summary: listing.description || "No description available",
          content_html: `
            <p><strong>MRR Range:</strong> ${listing.mrrRange || "Not specified"}</p>
            <p><strong>EBITDA Multiple:</strong> ${listing.ebitdaMultiple || "Not specified"}x</p>
            <p><strong>Location:</strong> ${listing.location || "Not specified"}</p>
            <p><a href="${baseUrl}/listing/${listing.id}">View Full Listing</a></p>
          `,
          date_published: new Date(listing.createdAt as string).toISOString(),
          date_modified: new Date(listing.updatedAt as string).toISOString(),
          tags: ["msp", "acquisition", "marketplace"],
        }));

        return {
          version: "https://jsonfeed.org/version/1.1",
          title: "MSP M&A Marketplace - Latest Listings",
          home_page_url: baseUrl,
          feed_url: `${baseUrl}/api/feed/json`,
          description: "Latest MSP listings available for acquisition",
          language: "en-US",
          items,
        };
      } catch (error) {
        console.error("[Feed] Failed to generate JSON feed:", error);
        throw error;
      }
    }),

  /**
   * Get latest listings in simple JSON format
   * Optimized for Make.com and N8N webhook consumption
   */
  getLatestListings: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      sinceMinutesAgo: z.number().min(0).default(0),
    }).optional())
    .query(async ({ input }) => {
      const { limit: itemLimit = 10, sinceMinutesAgo = 0 } = input || {};

      try {
        const db_instance = await db.getDb();
        if (!db_instance) {
          throw new Error("Database not available");
        }

        // Calculate time threshold
        const sinceDate = new Date();
        sinceDate.setMinutes(sinceDate.getMinutes() - sinceMinutesAgo);

        // Fetch latest active listings
        const activeListings = await db_instance
          .select({
            id: listings.id,
            title: listings.businessName,
            description: listings.description,
            mrrRange: listings.monthlyRecurringRevenue,
            ebitdaMultiple: listings.valuationMultiple,
            location: listings.location,
            createdAt: listings.createdAt,
            updatedAt: listings.updatedAt,
            status: listings.status,
          })
          .from(listings)
          .where(eq(listings.status, "active"))
          .orderBy(desc(listings.createdAt))
          .limit(itemLimit);

        // Filter by time if needed
        let filtered = activeListings;
        if (sinceMinutesAgo > 0) {
          filtered = activeListings.filter(listing => {
            const listingDate = new Date(listing.createdAt as string);
            return listingDate >= sinceDate;
          });
        }

        return {
          success: true,
          count: filtered.length,
          timestamp: new Date().toISOString(),
          listings: filtered.map(listing => ({
            id: listing.id,
            title: listing.title,
            description: listing.description,
            mrrRange: listing.mrrRange,
            ebitdaMultiple: listing.ebitdaMultiple,
            location: listing.location,
            url: `https://msp.investments/listing/${listing.id}`,
            createdAt: listing.createdAt,
            updatedAt: listing.updatedAt,
          })),
        };
      } catch (error) {
        console.error("[Feed] Failed to fetch latest listings:", error);
        throw error;
      }
    }),
});

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
