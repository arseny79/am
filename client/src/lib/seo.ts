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
    author: config.author || 'AM iGaming Marketplace',
    'og:title': config.title,
    'og:description': config.description,
    'og:type': config.type || 'website',
    'og:url': config.url || window.location.href,
    'og:image': config.image || 'https://acq.market/og-image.png',
    'og:site_name': 'AM iGaming Marketplace',
    'twitter:card': 'summary_large_image',
    'twitter:title': config.title,
    'twitter:description': config.description,
    'twitter:image': config.image || 'https://acq.market/og-image.png',
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
        name: 'AM iGaming Marketplace',
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
    name: 'AM iGaming Marketplace',
    url: 'https://acq.market',
    logo: 'https://acq.market/logo.png',
    description: 'The premier marketplace for buying and selling iGaming Business businesses',
    sameAs: [
      // Add social media links when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@acq.market',
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
    title: 'AM iGaming Marketplace | Buy & Sell iGaming Business Businesses',
    description: 'The premier marketplace for iGaming M&As. Connect buyers and sellers of iGaming business businesses with data-driven valuations, secure due diligence, and streamlined transactions.',
    keywords: 'iGaming marketplace, iGaming business acquisition, buy iGaming business, sell iGaming business, IT services M&A, iGaming business valuation',
    type: 'website' as const,
  },
  marketplace: {
    title: 'Browse iGaming Businesses for Sale | AM iGaming Marketplace',
    description: 'Discover iGaming business businesses for sale. Filter by revenue, EBITDA, location, and service mix. Secure NDA-protected confidential information.',
    keywords: 'iGaming business for sale, buy iGaming business, iGaming acquisition, iGaming listings',
    type: 'website' as const,
  },
  valuation: {
    title: 'Free iGaming Business Valuation Calculator | Estimate Your Business Value',
    description: 'Calculate your iGaming business valuation instantly. Our EBITDA-based calculator uses industry-specific multiples and metrics to provide accurate estimates.',
    keywords: 'iGaming valuation, business valuation calculator, EBITDA multiple, iGaming business worth',
    type: 'website' as const,
  },
  howItWorks: {
    title: 'How It Works | AM iGaming Marketplace',
    description: 'Learn how to buy or sell an iGaming business on our platform. Step-by-step guide for sellers and buyers with secure transactions and expert support.',
    keywords: 'how to sell iGaming business, how to buy iGaming company, iGaming M&A process',
    type: 'website' as const,
  },
};
