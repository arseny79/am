import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  structuredData?: object;
}

/**
 * SEO Head component for managing page metadata, canonical URLs, and structured data
 * Usage: <SEOHead canonical="https://msp.investments/pricing" structuredData={{...}} />
 */
export function SEOHead({ title, description, canonical, structuredData }: SEOHeadProps) {
  useEffect(() => {
    // Set page title
    if (title) {
      document.title = title;
    }

    // Set meta description
    if (description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", description);
    }

    // Set canonical URL
    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkCanonical) {
        linkCanonical = document.createElement("link");
        linkCanonical.setAttribute("rel", "canonical");
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.href = canonical;
    }

    // Add structured data (JSON-LD)
    if (structuredData) {
      const scriptId = "structured-data";
      let script = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!script) {
        script = document.createElement("script") as HTMLScriptElement;
        script.id = scriptId;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      
      script.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function
    return () => {
      // Remove structured data script when component unmounts
      if (structuredData) {
        const script = document.getElementById("structured-data");
        if (script) {
          script.remove();
        }
      }
    };
  }, [title, description, canonical, structuredData]);

  return null; // This component doesn't render anything
}
