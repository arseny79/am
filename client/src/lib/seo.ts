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
    'og:image': config.image || 'https://acquisitions.market/og-image.png',
    'og:site_name': 'Acquisitions.market',
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
    logo: 'https://acquisitions.market/logo.svg',
    description: 'The premier marketplace for buying and selling iGaming businesses and assets',
    sameAs: [],
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
    title: 'Acquisitions.market | Buy & Sell iGaming Businesses and Assets',
    description: 'The M&A marketplace for iGaming. Connect buyers and sellers of online casinos, sportsbooks, affiliate sites, gaming licenses and more. Secure, AI-enabled deal flow.',
    keywords: 'igaming marketplace, buy igaming business, sell online casino, sportsbook acquisition, gaming license, igaming M&A, iGaming assets',
    type: 'website' as const,
  },
  marketplace: {
    title: 'Browse iGaming Businesses for Sale | Acquisitions.market',
    description: 'Discover iGaming businesses and assets for sale. Filter by type, jurisdiction, revenue, and EBITDA. NDA-protected confidential listings.',
    keywords: 'igaming for sale, buy online casino, sportsbook for sale, igaming listings, gaming license',
    type: 'website' as const,
  },
  valuation: {
    title: 'iGaming Business Valuation Tool | Acquisitions.market',
    description: 'Estimate the value of your iGaming business. Revenue multiples and EBITDA-based calculations tailored to online casinos, affiliate sites, sportsbooks, and B2B providers.',
    keywords: 'igaming valuation, online casino value, sportsbook worth, igaming business calculator',
    type: 'website' as const,
  },
  howItWorks: {
    title: 'How It Works | MSP M&A Marketplace',
    description: 'Learn how to buy or sell an MSP business on our platform. Step-by-step guide for sellers and buyers with secure transactions and expert support.',
    keywords: 'how to sell MSP, how to buy MSP, MSP transaction process',
    type: 'website' as const,
  },
};
