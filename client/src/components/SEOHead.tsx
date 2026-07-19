import { Helmet } from "react-helmet-async";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

type SEOPageKey =
  | "home"
  | "marketplace"
  | "createListing"
  | "buyAsset"
  | "pricing"
  | "valuationTool"
  | "verifyStripe";

interface SEOHeadProps {
  pageKey?: SEOPageKey;
  title?: string;
  description?: string;
  canonical?: string;
  structuredData?: Record<string, unknown> | Array<Record<string, unknown>>;
  robots?: string;
  type?: "website" | "article" | "product";
  image?: string;
}

const DEFAULT_SITE_NAME = "Acquisitions.market";
const DEFAULT_SITE_DESCRIPTION =
  "Browse digital assets, online businesses, and acquisition opportunities. Protect confidential information, qualify buyers, and move deals forward.";
const DEFAULT_META_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";

function normalizeBaseUrl(value?: string | null) {
  const base = (value || "").trim();
  if (!base) return "https://acquisitions.market";
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

function getPageSeo(siteSettings: Record<string, unknown> | undefined, pageKey?: SEOPageKey) {
  if (!siteSettings || !pageKey) return { title: undefined, description: undefined };

  const mapping: Record<SEOPageKey, { title: string; description: string }> = {
    home: { title: "homeSeoTitle", description: "homeSeoDescription" },
    marketplace: { title: "marketplaceSeoTitle", description: "marketplaceSeoDescription" },
    createListing: { title: "createListingSeoTitle", description: "createListingSeoDescription" },
    buyAsset: { title: "buyAssetSeoTitle", description: "buyAssetSeoDescription" },
    pricing: { title: "pricingSeoTitle", description: "pricingSeoDescription" },
    valuationTool: { title: "valuationToolSeoTitle", description: "valuationToolSeoDescription" },
    verifyStripe: { title: "verifyStripeSeoTitle", description: "verifyStripeSeoDescription" },
  };

  const keys = mapping[pageKey];
  return {
    title: typeof siteSettings[keys.title] === "string" ? (siteSettings[keys.title] as string) : undefined,
    description:
      typeof siteSettings[keys.description] === "string"
        ? (siteSettings[keys.description] as string)
        : undefined,
  };
}

/**
 * Shared SEO component backed by admin-configurable site settings.
 */
export function SEOHead({
  pageKey,
  title,
  description,
  canonical,
  structuredData,
  robots,
  type = "website",
  image,
}: SEOHeadProps) {
  const { data: siteSettings } = trpc.admin.getSiteSettings.useQuery(undefined, {
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const currentPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const siteName = (siteSettings?.siteName || "").trim() || APP_TITLE || DEFAULT_SITE_NAME;
  const siteUrl = normalizeBaseUrl(siteSettings?.siteUrl || (typeof window !== "undefined" ? window.location.origin : ""));
  const pageSeo = getPageSeo(siteSettings as Record<string, unknown> | undefined, pageKey);

  const resolvedTitle =
    (pageSeo.title || "").trim() ||
    (title || "").trim() ||
    (siteSettings?.seoTitle || "").trim() ||
    `${siteName} | Digital Asset & Online Business Marketplace`;

  const resolvedDescription =
    (pageSeo.description || "").trim() ||
    (description || "").trim() ||
    (siteSettings?.seoDescription || "").trim() ||
    DEFAULT_SITE_DESCRIPTION;

  const resolvedCanonical = toAbsoluteUrl(siteUrl, canonical || currentPath) || `${siteUrl}${currentPath}`;
  const resolvedImage = toAbsoluteUrl(siteUrl, image || siteSettings?.ogImage);
  const resolvedRobots =
    (siteSettings?.launchMode === "pre_launch" ? "noindex, nofollow" : undefined) ||
    (robots || "").trim() ||
    (siteSettings?.defaultMetaRobots || "").trim() ||
    DEFAULT_META_ROBOTS;

  const ogTitle = (siteSettings?.ogTitle || "").trim() || resolvedTitle;
  const ogDescription = (siteSettings?.ogDescription || "").trim() || resolvedDescription;
  const twitterHandle = normalizeTwitterHandle(siteSettings?.twitterHandle);
  const structuredPayload = structuredData
    ? Array.isArray(structuredData)
      ? structuredData
      : [structuredData]
    : [];

  return (
    <Helmet>
      <title>{resolvedTitle}</title>
      <meta name="description" content={resolvedDescription} />
      <meta name="robots" content={resolvedRobots} />
      <meta name="author" content={siteName} />
      <meta name="application-name" content={siteName} />
      <link rel="canonical" href={resolvedCanonical} />

      <meta property="og:locale" content="en_US" />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:url" content={resolvedCanonical} />
      {resolvedImage && <meta property="og:image" content={resolvedImage} />}

      <meta name="twitter:card" content={resolvedImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      {twitterHandle && <meta name="twitter:site" content={twitterHandle} />}
      {twitterHandle && <meta name="twitter:creator" content={twitterHandle} />}
      {resolvedImage && <meta name="twitter:image" content={resolvedImage} />}

      {structuredPayload.map((item, index) => (
        <script key={`structured-data-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
