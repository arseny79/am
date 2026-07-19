/**
 * Generate sitemap.xml for SEO
 */

import { generateSitemap } from './sitemap';

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

export { generateSitemap };
