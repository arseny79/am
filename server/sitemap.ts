import { getDb } from "./db";
import { listings, siteSettings } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}

function normalizeBaseUrl(value?: string | null) {
  const base = (value || "").trim();
  if (!base) return process.env.VITE_APP_URL || "https://acquisitions.market";
  return base.replace(/\/+$/, "");
}

async function getSeoSettings() {
  const db = await getDb();
  if (!db) return null;
  const [settings] = await db
    .select({
      siteUrl: siteSettings.siteUrl,
      launchMode: siteSettings.launchMode,
    })
    .from(siteSettings)
    .limit(1);
  return settings || null;
}

async function resolveBaseUrl(baseUrl?: string) {
  if (baseUrl) return normalizeBaseUrl(baseUrl);
  const settings = await getSeoSettings();
  return normalizeBaseUrl(settings?.siteUrl);
}

export async function generateSitemap(baseUrl?: string): Promise<string> {
  const resolvedBaseUrl = await resolveBaseUrl(baseUrl);
  const urls: SitemapUrl[] = [];

  const staticPages: SitemapUrl[] = [
    { loc: `${resolvedBaseUrl}/`, changefreq: "daily", priority: 1.0 },
    { loc: `${resolvedBaseUrl}/marketplace`, changefreq: "hourly", priority: 0.9 },
    { loc: `${resolvedBaseUrl}/buy-asset`, changefreq: "weekly", priority: 0.8 },
    { loc: `${resolvedBaseUrl}/create-listing`, changefreq: "weekly", priority: 0.8 },
    { loc: `${resolvedBaseUrl}/valuation-tool`, changefreq: "monthly", priority: 0.7 },
    { loc: `${resolvedBaseUrl}/pricing`, changefreq: "monthly", priority: 0.7 },
    { loc: `${resolvedBaseUrl}/how-it-works`, changefreq: "monthly", priority: 0.6 },
    { loc: `${resolvedBaseUrl}/faq`, changefreq: "monthly", priority: 0.6 },
    { loc: `${resolvedBaseUrl}/contact`, changefreq: "monthly", priority: 0.5 },
    { loc: `${resolvedBaseUrl}/broker`, changefreq: "monthly", priority: 0.6 },
    { loc: `${resolvedBaseUrl}/broker/how-it-works`, changefreq: "monthly", priority: 0.5 },
    { loc: `${resolvedBaseUrl}/broker/faq`, changefreq: "monthly", priority: 0.5 },
    { loc: `${resolvedBaseUrl}/professionals`, changefreq: "weekly", priority: 0.6 },
    { loc: `${resolvedBaseUrl}/affiliate`, changefreq: "monthly", priority: 0.5 },
  ];

  urls.push(...staticPages);

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
          loc: `${resolvedBaseUrl}/listing/${listing.id}`,
          lastmod: (listing.updatedAt as string | undefined)?.split("T")[0],
          changefreq: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch (error) {
    console.error("[Sitemap] Failed to fetch listings:", error);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map(
      (url) => `  <url>\n    <loc>${escapeXml(url.loc)}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ""}${url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : ""}${url.priority !== undefined ? `\n    <priority>${url.priority.toFixed(1)}</priority>` : ""}\n  </url>`
    )
    .join("\n")}\n</urlset>`;
}

export async function generateRobotsTxt(baseUrl?: string): Promise<string> {
  const resolvedBaseUrl = await resolveBaseUrl(baseUrl);
  const settings = await getSeoSettings();
  const isPreLaunch = settings?.launchMode === "pre_launch";

  if (isPreLaunch) {
    return [
      "User-agent: *",
      "Disallow: /",
      `Sitemap: ${resolvedBaseUrl}/sitemap.xml`,
    ].join("\n");
  }

  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /admin",
    `Sitemap: ${resolvedBaseUrl}/sitemap.xml`,
  ].join("\n");
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'\"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
