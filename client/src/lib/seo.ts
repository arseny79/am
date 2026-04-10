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
    author: config.author || 'acquisitions.market',
    'og:title': config.title,
    'og:description': config.description,
    'og:type': config.type || 'website',
    'og:url': config.url || window.location.href,
    'og:image': config.image || 'https://acquisitions.market/og-image.png',
    'og:site_name': 'acquisitions.market',
    'twitter:card': 'summary_large_image',
    'twitter:title': config.title,
    'twitter:description': config.description,
    'twitter:image': config.image || 'https://acquisitions.market/og-image.png',
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
        name: 'acquisitions.market',
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
    name: 'acquisitions.market',
    url: 'https://acquisitions.market',
    logo: 'https://acquisitions.market/logo.png',
    description: 'The premier multi-asset acquisition marketplace for buying and selling businesses and digital assets',
    sameAs: [
      // Add social media links when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@acquisitions.market',
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
    title: 'acquisitions.market | Buy & Sell Businesses and Digital Assets',
    description: 'The premier multi-asset acquisition marketplace. Buy and sell businesses, SaaS, crypto, and digital assets with data-driven valuations, secure due diligence, and streamlined transactions.',
    keywords: 'acquisition marketplace, buy business, sell business, crypto assets, digital assets, M&A, business valuation, acquisitions.market',
    type: 'website' as const,
  },
  marketplace: {
    title: 'Browse Businesses & Assets for Sale | acquisitions.market',
    description: 'Discover businesses and digital assets for sale. Filter by revenue, type, location, and price. Secure NDA-protected confidential information.',
    keywords: 'business for sale, buy business, digital asset acquisition, acquisition listings, crypto business for sale',
    type: 'website' as const,
  },
  valuation: {
    title: 'Free Business Valuation Calculator | acquisitions.market',
    description: 'Calculate your business valuation instantly. Our EBITDA-based calculator uses industry-specific multiples and metrics to provide accurate estimates.',
    keywords: 'business valuation, valuation calculator, EBITDA multiple, business worth, acquisition price',
    type: 'website' as const,
  },
  howItWorks: {
    title: 'How It Works | acquisitions.market',
    description: 'Learn how to buy or sell a business or digital asset on our platform. Step-by-step guide for sellers and buyers with secure transactions and expert support.',
    keywords: 'how to sell business, how to buy business, acquisition process, M&A marketplace',
    type: 'website' as const,
  },
};
