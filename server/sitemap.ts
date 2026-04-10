import { getDb } from "./db";
import { listings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

/**
 * Generate sitemap.xml content
 */
export async function generateSitemap(baseUrl: string = "https://acquisition.market"): Promise<string> {
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages: SitemapUrl[] = [
    { loc: `${baseUrl}/`, changefreq: "daily", priority: 1.0 },
    { loc: `${baseUrl}/marketplace`, changefreq: "hourly", priority: 0.9 },
    { loc: `${baseUrl}/buy-asset`, changefreq: "weekly", priority: 0.8 },
    { loc: `${baseUrl}/create-listing`, changefreq: "weekly", priority: 0.8 },
    { loc: `${baseUrl}/valuation-tool`, changefreq: "monthly", priority: 0.7 },
    { loc: `${baseUrl}/pricing`, changefreq: "monthly", priority: 0.7 },
    { loc: `${baseUrl}/how-it-works`, changefreq: "monthly", priority: 0.6 },
    { loc: `${baseUrl}/faq`, changefreq: "monthly", priority: 0.6 },
    { loc: `${baseUrl}/contact`, changefreq: "monthly", priority: 0.5 },
    { loc: `${baseUrl}/broker`, changefreq: "monthly", priority: 0.6 },
    { loc: `${baseUrl}/broker/how-it-works`, changefreq: "monthly", priority: 0.5 },
    { loc: `${baseUrl}/broker/faq`, changefreq: "monthly", priority: 0.5 },
    { loc: `${baseUrl}/professionals`, changefreq: "weekly", priority: 0.6 },
    { loc: `${baseUrl}/affiliate`, changefreq: "monthly", priority: 0.5 },
  ];

  urls.push(...staticPages);

  // Dynamic pages - active listings
  try {
    const db = await getDb();
    if (db) {
      const activeListings = await db
        .select({
          id: listings.id,
          updatedAt: listings.updatedAt,
        })
        .from(listings)
        .where(eq(listings.status, "active"));

      for (const listing of activeListings) {
        urls.push({
          loc: `${baseUrl}/listing/${listing.id}`,
          lastmod: (listing.updatedAt as string).split("T")[0],
          changefreq: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch (error) {
    console.error("[Sitemap] Failed to fetch listings:", error);
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ""}${url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : ""}${url.priority !== undefined ? `\n    <priority>${url.priority.toFixed(1)}</priority>` : ""}
  </url>`
  )
  .join("\n")}
</urlset>`;

  return xml;
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case "'": return "&apos;";
      case '"': return "&quot;";
      default: return c;
    }
  });
}
