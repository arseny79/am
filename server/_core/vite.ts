import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { getDb } from "../db";
import { listings, siteSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const DEFAULT_SITE_NAME = "Acquisitions.market";
const DEFAULT_SITE_URL = "https://acquisitions.market";
const DEFAULT_DESCRIPTION =
  "Browse digital assets, online businesses, and acquisition opportunities. Protect confidential information, qualify buyers, and move deals forward.";
const DEFAULT_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

type MetaPayload = {
  title: string;
  description: string;
  canonical: string;
  image?: string;
  robots: string;
  siteName: string;
  ogTitle: string;
  ogDescription: string;
  twitterHandle?: string;
};

type SiteSeoSettings = {
  siteName?: string | null;
  siteUrl?: string | null;
  twitterHandle?: string | null;
  defaultMetaRobots?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  homeSeoTitle?: string | null;
  homeSeoDescription?: string | null;
  marketplaceSeoTitle?: string | null;
  marketplaceSeoDescription?: string | null;
  createListingSeoTitle?: string | null;
  createListingSeoDescription?: string | null;
  buyAssetSeoTitle?: string | null;
  buyAssetSeoDescription?: string | null;
  pricingSeoTitle?: string | null;
  pricingSeoDescription?: string | null;
  valuationToolSeoTitle?: string | null;
  valuationToolSeoDescription?: string | null;
  verifyStripeSeoTitle?: string | null;
  verifyStripeSeoDescription?: string | null;
  launchMode?: string | null;
};

const PAGE_FALLBACKS: Record<string, { title: string; description: string; settingKey?: keyof PageSettingsMap }> = {
  "/": {
    title: "Acquisitions.market | Digital Asset & Online Business Marketplace",
    description: DEFAULT_DESCRIPTION,
    settingKey: "home",
  },
  "/marketplace": {
    title: "Browse Acquisition Opportunities | Acquisitions.market",
    description: "Browse digital assets, online businesses, and other acquisition opportunities available on the marketplace.",
    settingKey: "marketplace",
  },
  "/browse": {
    title: "Browse Acquisition Opportunities | Acquisitions.market",
    description: "Browse digital assets, online businesses, and other acquisition opportunities available on the marketplace.",
    settingKey: "marketplace",
  },
  "/valuation-tool": {
    title: "Business Valuation Tool | Acquisitions.market",
    description: "Estimate the value of a digital asset or online business using structured financial inputs.",
    settingKey: "valuationTool",
  },
  "/valuate": {
    title: "Business Valuation Tool | Acquisitions.market",
    description: "Estimate the value of a digital asset or online business using structured financial inputs.",
    settingKey: "valuationTool",
  },
  "/pricing": {
    title: "Pricing | Acquisitions.market",
    description: "Transparent success-based pricing for listing acquisition opportunities on Acquisitions.market.",
    settingKey: "pricing",
  },
  "/create-listing": {
    title: "Create Listing | Acquisitions.market",
    description: "List a digital asset, online business, or acquisition opportunity for qualified buyers.",
    settingKey: "createListing",
  },
  "/buy-asset": {
    title: "Buyer Requests | Acquisitions.market",
    description: "Submit your acquisition criteria and connect with sellers looking for the right buyer.",
    settingKey: "buyAsset",
  },
  "/verify-stripe": {
    title: "Identity Verification | Acquisitions.market",
    description: "Complete secure identity verification to unlock marketplace actions and protected information.",
    settingKey: "verifyStripe",
  },
  "/how-it-works": {
    title: "How It Works | Acquisitions.market",
    description: "Learn how the marketplace works from listing and buyer qualification through diligence and deal execution.",
  },
  "/faq": {
    title: "FAQ | Acquisitions.market",
    description: "Frequently asked questions about buying and selling acquisition opportunities on Acquisitions.market.",
  },
  "/contact": {
    title: "Contact | Acquisitions.market",
    description: "Get in touch with the Acquisitions.market team.",
  },
  "/broker": {
    title: "Broker Program | Acquisitions.market",
    description: "Partner with Acquisitions.market as a broker and manage seller opportunities through the platform.",
  },
  "/broker/how-it-works": {
    title: "Broker Program — How It Works | Acquisitions.market",
    description: "Learn how the broker workflow operates on Acquisitions.market.",
  },
  "/broker/faq": {
    title: "Broker FAQ | Acquisitions.market",
    description: "Frequently asked questions about the Acquisitions.market broker program.",
  },
  "/professionals": {
    title: "Professional Directory | Acquisitions.market",
    description: "Find advisors and service providers that support acquisition transactions.",
  },
  "/affiliate": {
    title: "Affiliate Program | Acquisitions.market",
    description: "Refer buyers and sellers to Acquisitions.market and earn commissions on qualified outcomes.",
  },
};

type PageSettingsMap = {
  home: { title: keyof SiteSeoSettings; description: keyof SiteSeoSettings };
  marketplace: { title: keyof SiteSeoSettings; description: keyof SiteSeoSettings };
  createListing: { title: keyof SiteSeoSettings; description: keyof SiteSeoSettings };
  buyAsset: { title: keyof SiteSeoSettings; description: keyof SiteSeoSettings };
  pricing: { title: keyof SiteSeoSettings; description: keyof SiteSeoSettings };
  valuationTool: { title: keyof SiteSeoSettings; description: keyof SiteSeoSettings };
  verifyStripe: { title: keyof SiteSeoSettings; description: keyof SiteSeoSettings };
};

const PAGE_SETTINGS_MAP: PageSettingsMap = {
  home: { title: "homeSeoTitle", description: "homeSeoDescription" },
  marketplace: { title: "marketplaceSeoTitle", description: "marketplaceSeoDescription" },
  createListing: { title: "createListingSeoTitle", description: "createListingSeoDescription" },
  buyAsset: { title: "buyAssetSeoTitle", description: "buyAssetSeoDescription" },
  pricing: { title: "pricingSeoTitle", description: "pricingSeoDescription" },
  valuationTool: { title: "valuationToolSeoTitle", description: "valuationToolSeoDescription" },
  verifyStripe: { title: "verifyStripeSeoTitle", description: "verifyStripeSeoDescription" },
};

function normalizeBaseUrl(value?: string | null) {
  const base = (value || "").trim();
  if (!base) return DEFAULT_SITE_URL;
  return base.replace(/\/+$/, "");
}

function toAbsoluteUrl(baseUrl: string, value?: string | null) {
  const candidate = (value || "").trim();
  if (!candidate) return undefined;
  if (/^https?:\/\//i.test(candidate)) return candidate;
  return `${baseUrl}${candidate.startsWith("/") ? candidate : `/${candidate}`}`;
}

function normalizeTwitterHandle(value?: string | null) {
  const handle = (value || "").trim();
  if (!handle) return undefined;
  return handle.startsWith("@") ? handle : `@${handle}`;
}

function escapeAttr(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

async function getSeoSettings(): Promise<SiteSeoSettings | null> {
  const db = await getDb();
  if (!db) return null;
  const [settings] = await db
    .select({
      siteName: siteSettings.siteName,
      siteUrl: siteSettings.siteUrl,
      twitterHandle: siteSettings.twitterHandle,
      defaultMetaRobots: siteSettings.defaultMetaRobots,
      seoTitle: siteSettings.seoTitle,
      seoDescription: siteSettings.seoDescription,
      ogTitle: siteSettings.ogTitle,
      ogDescription: siteSettings.ogDescription,
      ogImage: siteSettings.ogImage,
      homeSeoTitle: siteSettings.homeSeoTitle,
      homeSeoDescription: siteSettings.homeSeoDescription,
      marketplaceSeoTitle: siteSettings.marketplaceSeoTitle,
      marketplaceSeoDescription: siteSettings.marketplaceSeoDescription,
      createListingSeoTitle: siteSettings.createListingSeoTitle,
      createListingSeoDescription: siteSettings.createListingSeoDescription,
      buyAssetSeoTitle: siteSettings.buyAssetSeoTitle,
      buyAssetSeoDescription: siteSettings.buyAssetSeoDescription,
      pricingSeoTitle: siteSettings.pricingSeoTitle,
      pricingSeoDescription: siteSettings.pricingSeoDescription,
      valuationToolSeoTitle: siteSettings.valuationToolSeoTitle,
      valuationToolSeoDescription: siteSettings.valuationToolSeoDescription,
      verifyStripeSeoTitle: siteSettings.verifyStripeSeoTitle,
      verifyStripeSeoDescription: siteSettings.verifyStripeSeoDescription,
      launchMode: siteSettings.launchMode,
    })
    .from(siteSettings)
    .limit(1);
  return settings || null;
}

function getPageOverride(settings: SiteSeoSettings | null, settingKey?: keyof PageSettingsMap) {
  if (!settings || !settingKey) return { title: undefined, description: undefined };
  const keys = PAGE_SETTINGS_MAP[settingKey];
  return {
    title: typeof settings[keys.title] === "string" ? settings[keys.title] || undefined : undefined,
    description: typeof settings[keys.description] === "string" ? settings[keys.description] || undefined : undefined,
  };
}

async function getMetaForUrl(url: string): Promise<MetaPayload> {
  const urlPath = url.split("?")[0].split("#")[0] || "/";
  const settings = await getSeoSettings();
  const siteName = (settings?.siteName || "").trim() || DEFAULT_SITE_NAME;
  const baseUrl = normalizeBaseUrl(settings?.siteUrl);
  const robots = settings?.launchMode === "pre_launch"
    ? "noindex, nofollow"
    : (settings?.defaultMetaRobots || "").trim() || DEFAULT_ROBOTS;
  const twitterHandle = normalizeTwitterHandle(settings?.twitterHandle);
  const fallback = PAGE_FALLBACKS[urlPath] || PAGE_FALLBACKS["/"];
  const override = getPageOverride(settings, fallback.settingKey);

  const baseTitle = (settings?.seoTitle || "").trim() || `${siteName} | Digital Asset & Online Business Marketplace`;
  const baseDescription = (settings?.seoDescription || "").trim() || DEFAULT_DESCRIPTION;

  if (fallback) {
    const title = override.title?.trim() || fallback.title || baseTitle;
    const description = override.description?.trim() || fallback.description || baseDescription;
    const canonical = `${baseUrl}${urlPath}`;
    const image = toAbsoluteUrl(baseUrl, settings?.ogImage);
    return {
      title,
      description,
      canonical,
      image,
      robots,
      siteName,
      ogTitle: (settings?.ogTitle || "").trim() || title,
      ogDescription: (settings?.ogDescription || "").trim() || description,
      twitterHandle,
    };
  }

  const listingMatch = urlPath.match(/^\/listing\/(\d+)/);
  if (listingMatch) {
    const listingId = parseInt(listingMatch[1]);
    try {
      const db = await getDb();
      if (db) {
        const result = await db
          .select({
            businessName: listings.businessName,
            location: listings.location,
            annualRevenue: listings.annualRevenue,
            askingPrice: listings.askingPrice,
          })
          .from(listings)
          .where(eq(listings.id, listingId))
          .limit(1);

        if (result[0]) {
          const listing = result[0];
          const price = listing.askingPrice ? `Asking $${(listing.askingPrice / 1000).toFixed(0)}K. ` : "";
          const revenue = listing.annualRevenue ? `$${(listing.annualRevenue / 1000).toFixed(0)}K annual revenue. ` : "";
          const location = listing.location ? ` in ${listing.location}` : "";
          const title = `${listing.businessName} | Acquisition Opportunity | ${siteName}`;
          const description = `${listing.businessName}${location}. ${price}${revenue}Review this acquisition opportunity on ${siteName}.`.replace(/\s+/g, " ").trim().slice(0, 160);
          const canonical = `${baseUrl}${urlPath}`;
          const image = toAbsoluteUrl(baseUrl, settings?.ogImage);
          return {
            title,
            description,
            canonical,
            image,
            robots,
            siteName,
            ogTitle: (settings?.ogTitle || "").trim() || title,
            ogDescription: (settings?.ogDescription || "").trim() || description,
            twitterHandle,
          };
        }
      }
    } catch {
      // Fall through to default meta
    }
  }

  const canonical = `${baseUrl}${urlPath}`;
  const image = toAbsoluteUrl(baseUrl, settings?.ogImage);
  return {
    title: baseTitle,
    description: baseDescription,
    canonical,
    image,
    robots,
    siteName,
    ogTitle: (settings?.ogTitle || "").trim() || baseTitle,
    ogDescription: (settings?.ogDescription || "").trim() || baseDescription,
    twitterHandle,
  };
}

function injectMetaTags(html: string, meta: MetaPayload): string {
  const cleanupPatterns = [
    /<title>[\s\S]*?<\/title>\s*/gi,
    /<meta[^>]+name=["']description["'][^>]*>\s*/gi,
    /<meta[^>]+name=["']robots["'][^>]*>\s*/gi,
    /<meta[^>]+name=["']author["'][^>]*>\s*/gi,
    /<meta[^>]+name=["']application-name["'][^>]*>\s*/gi,
    /<link[^>]+rel=["']canonical["'][^>]*>\s*/gi,
    /<meta[^>]+property=["']og:locale["'][^>]*>\s*/gi,
    /<meta[^>]+property=["']og:type["'][^>]*>\s*/gi,
    /<meta[^>]+property=["']og:site_name["'][^>]*>\s*/gi,
    /<meta[^>]+property=["']og:title["'][^>]*>\s*/gi,
    /<meta[^>]+property=["']og:description["'][^>]*>\s*/gi,
    /<meta[^>]+property=["']og:url["'][^>]*>\s*/gi,
    /<meta[^>]+property=["']og:image["'][^>]*>\s*/gi,
    /<meta[^>]+name=["']twitter:card["'][^>]*>\s*/gi,
    /<meta[^>]+name=["']twitter:title["'][^>]*>\s*/gi,
    /<meta[^>]+name=["']twitter:description["'][^>]*>\s*/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]*>\s*/gi,
    /<meta[^>]+name=["']twitter:site["'][^>]*>\s*/gi,
    /<meta[^>]+name=["']twitter:creator["'][^>]*>\s*/gi,
  ];

  let cleanedHtml = html;
  for (const pattern of cleanupPatterns) {
    cleanedHtml = cleanedHtml.replace(pattern, "");
  }

  const tags = [
    `<title>${escapeAttr(meta.title)}</title>`,
    `<meta name="description" content="${escapeAttr(meta.description)}">`,
    `<meta name="robots" content="${escapeAttr(meta.robots)}">`,
    `<meta name="author" content="${escapeAttr(meta.siteName)}">`,
    `<meta name="application-name" content="${escapeAttr(meta.siteName)}">`,
    `<link rel="canonical" href="${escapeAttr(meta.canonical)}">`,
    `<meta property="og:locale" content="en_US">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escapeAttr(meta.siteName)}">`,
    `<meta property="og:title" content="${escapeAttr(meta.ogTitle)}">`,
    `<meta property="og:description" content="${escapeAttr(meta.ogDescription)}">`,
    `<meta property="og:url" content="${escapeAttr(meta.canonical)}">`,
    meta.image ? `<meta property="og:image" content="${escapeAttr(meta.image)}">` : "",
    `<meta name="twitter:card" content="${meta.image ? "summary_large_image" : "summary"}">`,
    `<meta name="twitter:title" content="${escapeAttr(meta.ogTitle)}">`,
    `<meta name="twitter:description" content="${escapeAttr(meta.ogDescription)}">`,
    meta.twitterHandle ? `<meta name="twitter:site" content="${escapeAttr(meta.twitterHandle)}">` : "",
    meta.twitterHandle ? `<meta name="twitter:creator" content="${escapeAttr(meta.twitterHandle)}">` : "",
    meta.image ? `<meta name="twitter:image" content="${escapeAttr(meta.image)}">` : "",
  ]
    .filter(Boolean)
    .join("\n    ");

  return cleanedHtml.replace("</head>", `    ${tags}\n  </head>`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(import.meta.dirname, "../..", "client", "index.html");

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
      let page = await vite.transformIndexHtml(url, template);
      const meta = await getMetaForUrl(url);
      page = injectMetaTags(page, meta);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(`Could not find the build directory: ${distPath}, make sure to build the client first`);
  }

  app.use(express.static(distPath));

  app.use("*", async (req, res) => {
    try {
      const indexPath = path.resolve(distPath, "index.html");
      let html = await fs.promises.readFile(indexPath, "utf-8");
      const meta = await getMetaForUrl(req.originalUrl);
      html = injectMetaTags(html, meta);
      res.set("Content-Type", "text/html").send(html);
    } catch {
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
