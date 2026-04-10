import { Helmet } from "react-helmet-async";
import { trpc } from "@/lib/trpc";
import { APP_TITLE } from "@/const";

/**
 * SEOMetaTags component
 * Fetches SEO metadata from the database and injects meta tags into the document head
 * Supports basic SEO (title, description) and Open Graph tags for social media
 */
export default function SEOMetaTags() {
  const { data: siteSettings } = trpc.admin.getSiteSettings.useQuery(undefined, {
    // Cache for 1 hour to reduce unnecessary calls
    staleTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  // Use configured values or fallback to defaults
  const title = siteSettings?.seoTitle || APP_TITLE;
  const description = siteSettings?.seoDescription || "Buy or sell businesses and digital assets with confidence. Get instant valuations, browse opportunities, and close deals securely.";
  const ogTitle = siteSettings?.ogTitle || title;
  const ogDescription = siteSettings?.ogDescription || description;
  const ogImage = siteSettings?.ogImage || undefined;

  return (
    <Helmet>
      {/* Basic SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter Card */}
      <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  );
}
