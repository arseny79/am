/**
 * Generate sitemap.xml for SEO
 * Run this script periodically or after content changes
 */

import { getDb } from './db';
import { listings } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

interface SitemapURL {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

async function generateSitemap() {
  const baseUrl = 'https://acquisition.market';
  const urls: SitemapURL[] = [];

  // Static pages
  urls.push(
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${baseUrl}/marketplace`, changefreq: 'hourly', priority: 0.9 },
    { loc: `${baseUrl}/valuation-calculator`, changefreq: 'monthly', priority: 0.8 },
    { loc: `${baseUrl}/how-it-works`, changefreq: 'monthly', priority: 0.7 },
    { loc: `${baseUrl}/buy-asset`, changefreq: 'weekly', priority: 0.7 },
    { loc: `${baseUrl}/terms-of-service`, changefreq: 'yearly', priority: 0.3 },
    { loc: `${baseUrl}/privacy-policy`, changefreq: 'yearly', priority: 0.3 },
    { loc: `${baseUrl}/disclaimer`, changefreq: 'yearly', priority: 0.3 },
  );

  // Dynamic pages - listings
  const db = await getDb();
  if (db) {
    const publishedListings = await db
      .select({ id: listings.id, updatedAt: listings.updatedAt })
      .from(listings)
      .where(eq(listings.status, 'active'));

    publishedListings.forEach((listing) => {
      urls.push({
        loc: `${baseUrl}/listing/${listing.id}`,
        lastmod: listing.updatedAt ? listing.updatedAt.split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8,
      });
    });
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>${url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : ''}${url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : ''}${url.priority !== undefined ? `\n    <priority>${url.priority}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return xml;
}

// Export for use in server routes
export { generateSitemap };

// CLI usage
if (require.main === module) {
  generateSitemap()
    .then((xml) => {
      console.log(xml);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error generating sitemap:', error);
      process.exit(1);
    });
}
