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
    author: config.author || 'MSP.Investments',
    'og:title': config.title,
    'og:description': config.description,
    'og:type': config.type || 'website',
    'og:url': config.url || window.location.href,
    'og:image': config.image || 'https://msp.investments/og-image.png',
    'og:site_name': 'MSP M&A Marketplace',
    'twitter:card': 'summary_large_image',
    'twitter:title': config.title,
    'twitter:description': config.description,
    'twitter:image': config.image || 'https://msp.investments/og-image.png',
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
        name: 'MSP M&A Marketplace',
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
    name: 'MSP M&A Marketplace',
    url: 'https://msp.investments',
    logo: 'https://msp.investments/logo.png',
    description: 'The premier marketplace for buying and selling Managed Service Provider businesses',
    sameAs: [
      // Add social media links when available
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@msp.investments',
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
    title: 'MSP M&A Marketplace | Buy & Sell Managed Service Provider Businesses',
    description: 'The premier marketplace for MSP acquisitions. Connect buyers and sellers of managed service provider businesses with data-driven valuations, secure due diligence, and streamlined transactions.',
    keywords: 'MSP marketplace, managed service provider acquisition, buy MSP business, sell MSP business, IT services M&A, MSP valuation',
    type: 'website' as const,
  },
  marketplace: {
    title: 'Browse MSP Businesses for Sale | MSP M&A Marketplace',
    description: 'Discover managed service provider businesses for sale. Filter by revenue, EBITDA, location, and service mix. Secure NDA-protected confidential information.',
    keywords: 'MSP for sale, buy managed service provider, IT business acquisition, MSP listings',
    type: 'website' as const,
  },
  valuation: {
    title: 'Free MSP Valuation Calculator | Estimate Your Business Value',
    description: 'Calculate your MSP business valuation instantly. Our EBITDA-based calculator uses industry-specific multiples and metrics to provide accurate estimates.',
    keywords: 'MSP valuation, business valuation calculator, EBITDA multiple, MSP worth',
    type: 'website' as const,
  },
  howItWorks: {
    title: 'How It Works | MSP M&A Marketplace',
    description: 'Learn how to buy or sell an MSP business on our platform. Step-by-step guide for sellers and buyers with secure transactions and expert support.',
    keywords: 'how to sell MSP, how to buy MSP, MSP transaction process',
    type: 'website' as const,
  },
};
