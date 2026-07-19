import { SEOHead } from "@/components/SEOHead";

/**
 * Legacy wrapper kept for compatibility. Prefer SEOHead directly.
 */
export default function SEOMetaTags() {
  return <SEOHead pageKey="home" />;
}
