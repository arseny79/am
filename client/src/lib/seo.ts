/**
 * SEO utility functions for managing meta tags, Open Graph, and structured data
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

/**
 * Update document meta tags for SEO
 */
export function updateMetaTags(config: SEOConfig) {
  // Update title
  document.title = config.title;

  // Update or create meta tags
  const metaTags: Record<string, string> = {
    description: config.description,
    keywords: config.keywords || '',
    author: config.author || 'Acquisitions.market',
    'og:title': config.title,
    'og:description': config.description,
    'og:type': config.type || 'website',
    'og:url': config.url || window.location.href,
    'og:image': config.image || `${window.location.origin}/og-image.png`,
    'og:site_name': 'Acquisitions.market',
    'twitter:card': 'summary_large_image',
    'twitter:title': config.title,
    'twitter:description': config.description,
    'twitter:image': config.image || `${window.location.origin}/og-image.png`,
  };

  // Add published/modified times for articles
  if (config.publishedTime) {
    metaTags['article:published_time'] = config.publishedTime;
  }
  if (config.modifiedTime) {
    metaTags['article:modified_time'] = config.modifiedTime;
  }

  // Update or create each meta tag
  Object.entries(metaTags).forEach(([name, content]) => {
    if (!content) return;

    const property = name.startsWith('og:') || name.startsWith('article:') ? 'property' : 'name';
    let tag = document.querySelector(`meta[${property}="${name}"]`);

    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(property, name);
      document.head.appendChild(tag);
    }

    tag.setAttribute('content', content);
  });

  // Update canonical URL
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = config.url || window.location.href;
}

/**
 * Generate JSON-LD structured data for a listing
 */
export function generateListingStructuredData(listing: {
  id: number;
  title: string;
  description: string;
  askingPrice: number;
  location: string;
  mrr: number;
  ebitda: number;
  createdAt: Date;
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: listing.title,
    description: listing.description,
    offers: {
      '@type': 'Offer',
      price: listing.askingPrice,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'Acquisitions.market',
      },
    },
    location: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: listing.location,
      },
    },
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Monthly Recurring Revenue',
        value: listing.mrr,
        unitCode: 'USD',
      },
      {
        '@type': 'PropertyValue',
        name: 'EBITDA',
        value: listing.ebitda,
        unitCode: 'USD',
      },
    ],
    datePublished: listing.createdAt.toISOString(),
  };

  return structuredData;
}

/**
 * Generate JSON-LD structured data for the organization
 */
export function generateOrganizationStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Acquisitions.market',
    url: 'https://acquisitions.market',
    logo: 'https://acquisitions.market/logo.png',
    description: 'A marketplace for digital-asset, online-business, and internet-native acquisitions',
    sameAs: [
      // Add social media links when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
    },
  };
}

/**
 * Inject structured data script into document head
 */
export function injectStructuredData(data: object) {
  const scriptId = 'structured-data';
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;

  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }

  script.textContent = JSON.stringify(data);
}

/**
 * Default SEO config for different page types
 */
export const defaultSEO = {
  home: {
    title: 'Acquisitions.market | Digital Asset & Online Business Marketplace',
    description: 'A marketplace for digital assets, online businesses, and internet-native acquisitions. Browse opportunities, manage confidentiality, and move deals forward.',
    keywords: 'digital asset marketplace, online business acquisition, acquire startup, internet business for sale, acquisitions marketplace',
    type: 'website' as const,
  },
  marketplace: {
    title: 'Browse Acquisition Opportunities | Acquisitions.market',
    description: 'Discover digital assets, online businesses, and internet-native opportunities for acquisition.',
    keywords: 'browse acquisition opportunities, digital assets for sale, online business marketplace, internet business acquisition',
    type: 'website' as const,
  },
  valuation: {
    title: 'Business Valuation Calculator | Acquisitions.market',
    description: 'Estimate the value of a digital asset or online business using structured financial inputs.',
    keywords: 'business valuation calculator, digital asset valuation, online business valuation',
    type: 'website' as const,
  },
  howItWorks: {
    title: 'How It Works | Acquisitions.market',
    description: 'Learn how buyers and sellers use Acquisitions.market to source opportunities, manage confidentiality, and progress deals.',
    keywords: 'how acquisitions.market works, digital asset acquisition process, online business deal flow',
    type: 'website' as const,
  },
};
