import mysql from "mysql2/promise";
import { config } from "dotenv";
config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Create listingCategories table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS listingCategories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      \`group\` VARCHAR(100) NOT NULL,
      label VARCHAR(100) NOT NULL,
      slug VARCHAR(100) NOT NULL,
      sort_order INT NOT NULL DEFAULT 0,
      is_active TINYINT NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
      UNIQUE KEY uq_slug (slug)
    )
  `);
  console.log("SUCCESS: Created listingCategories table");
} catch (e) {
  if (e.message.includes("already exists")) {
    console.log("ALREADY EXISTS: listingCategories table");
  } else {
    console.log("ERROR creating table:", e.message);
  }
}

try {
  await connection.query(
    "ALTER TABLE listings ADD COLUMN category_id INT NULL"
  );
  console.log("SUCCESS: Added category_id column to listings");
} catch (e) {
  if (e.message.includes("Duplicate column")) {
    console.log("ALREADY EXISTS: category_id column");
  } else {
    console.log("ERROR adding column:", e.message);
  }
}

// Seed iGaming categories
const categories = [
  // Operations & Businesses
  { group: "Operations & Businesses", label: "B2C Business", slug: "b2c-business", sort_order: 1 },
  { group: "Operations & Businesses", label: "B2B Provider / Aggregator", slug: "b2b-provider-aggregator", sort_order: 2 },
  { group: "Operations & Businesses", label: "RNG or Live Casino Studio", slug: "rng-live-casino-studio", sort_order: 3 },
  { group: "Operations & Businesses", label: "Affiliate Asset", slug: "affiliate-asset", sort_order: 4 },
  // Technology & Products
  { group: "Technology & Products", label: "Software", slug: "software", sort_order: 10 },
  { group: "Technology & Products", label: "Esports Platform", slug: "esports-platform", sort_order: 11 },
  { group: "Technology & Products", label: "Sweepstakes Product", slug: "sweepstakes-product", sort_order: 12 },
  { group: "Technology & Products", label: "Sportsbook Platform", slug: "sportsbook-platform", sort_order: 13 },
  { group: "Technology & Products", label: "Political Betting", slug: "political-betting", sort_order: 14 },
  { group: "Technology & Products", label: "CRM / Admin System", slug: "crm-admin-system", sort_order: 15 },
  { group: "Technology & Products", label: "Analytics Tool", slug: "analytics-tool", sort_order: 16 },
  { group: "Technology & Products", label: "Certification or License", slug: "certification-license", sort_order: 17 },
  // Media & Content
  { group: "Media & Content", label: "SEO Asset / Influencer Network", slug: "seo-asset-influencer-network", sort_order: 20 },
  { group: "Media & Content", label: "iGaming Media & News Outlet", slug: "igaming-media-news-outlet", sort_order: 21 },
  { group: "Media & Content", label: "iGaming Podcast / YouTube Channel", slug: "igaming-podcast-youtube", sort_order: 22 },
  { group: "Media & Content", label: "iGaming Event or Conference", slug: "igaming-event-conference", sort_order: 23 },
  // Other
  { group: "Other", label: "Web3 or Crypto Project", slug: "web3-crypto-project", sort_order: 30 },
  { group: "Other", label: "Other (please specify)", slug: "other", sort_order: 31 },
];

let seeded = 0;
for (const cat of categories) {
  try {
    await connection.query(
      "INSERT IGNORE INTO listingCategories (`group`, label, slug, sort_order) VALUES (?, ?, ?, ?)",
      [cat.group, cat.label, cat.slug, cat.sort_order]
    );
    seeded++;
  } catch (e) {
    console.log(`ERROR seeding ${cat.slug}:`, e.message);
  }
}
console.log(`SUCCESS: Seeded ${seeded} iGaming categories`);

await connection.end();
console.log("Done!");
