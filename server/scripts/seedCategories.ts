/**
 * Seed script: inserts default listing categories into the DB.
 * Run with: pnpm tsx server/scripts/seedCategories.ts
 *
 * Safe to re-run — skips categories whose slug already exists.
 */

import { drizzle } from "drizzle-orm/mysql2";
import { listingCategories } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("Error: DATABASE_URL environment variable is not set.");
  process.exit(1);
}

const url = new URL(DATABASE_URL);
url.searchParams.set("charset", "utf8mb4");
const db = drizzle(url.toString());

const defaultCategories: Array<{
  name: string;
  slug: string;
  group: "business" | "asset";
  description: string;
  displayOrder: number;
  relevantMetrics: string[];
}> = [
  // ── Business group ──────────────────────────────────────────────
  {
    name: "MSP / IT Services",
    slug: "msp",
    group: "business",
    description: "Managed service providers and IT services businesses",
    displayOrder: 10,
    relevantMetrics: ["mrr", "annualRevenue", "ebitda", "clientCount", "employeeCount", "churnRate"],
  },
  {
    name: "SaaS",
    slug: "saas",
    group: "business",
    description: "Software-as-a-service businesses with recurring revenue",
    displayOrder: 20,
    relevantMetrics: ["mrr", "arr", "annualRevenue", "ebitda", "clientCount", "employeeCount", "churnRate"],
  },
  {
    name: "eCommerce",
    slug: "ecommerce",
    group: "business",
    description: "Online retail and eCommerce stores",
    displayOrder: 30,
    relevantMetrics: ["annualRevenue", "ebitda", "clientCount", "employeeCount"],
  },
  {
    name: "Agency / Services",
    slug: "agency",
    group: "business",
    description: "Digital agencies, consulting firms, and professional services",
    displayOrder: 40,
    relevantMetrics: ["annualRevenue", "ebitda", "clientCount", "employeeCount"],
  },
  {
    name: "iGaming Business",
    slug: "igaming-business",
    group: "business",
    description: "Licensed casino, sportsbook, poker room, or gaming platform",
    displayOrder: 50,
    relevantMetrics: ["ggr", "mau", "annualRevenue", "ebitda", "licenseJurisdiction", "platformType", "employeeCount"],
  },
  {
    name: "Media & Content",
    slug: "media",
    group: "business",
    description: "Newsletters, blogs, content sites, YouTube channels, podcasts",
    displayOrder: 60,
    relevantMetrics: ["annualRevenue", "ebitda", "monthlyTraffic", "monetizationMethod"],
  },
  {
    name: "Other Business",
    slug: "other-business",
    group: "business",
    description: "Operating businesses not covered by other categories",
    displayOrder: 99,
    relevantMetrics: ["annualRevenue", "ebitda", "clientCount", "employeeCount"],
  },

  // ── Asset group ─────────────────────────────────────────────────
  {
    name: "Web3 / Crypto Protocol",
    slug: "web3-protocol",
    group: "asset",
    description: "Layer-1/2 protocols, web3 applications, and crypto projects",
    displayOrder: 10,
    relevantMetrics: ["tvl", "tokenHolders", "dailyActiveWallets", "protocolRevenue", "treasurySize", "chain"],
  },
  {
    name: "NFT Project / Collection",
    slug: "nft-project",
    group: "asset",
    description: "NFT collections, generative art projects, and digital collectibles",
    displayOrder: 20,
    relevantMetrics: ["floorPrice", "totalVolume", "holderCount", "chain"],
  },
  {
    name: "DeFi Platform",
    slug: "defi",
    group: "asset",
    description: "Decentralized finance protocols, DEXes, lending platforms",
    displayOrder: 30,
    relevantMetrics: ["tvl", "protocolRevenue", "dailyActiveWallets", "chain"],
  },
  {
    name: "DAO / Community",
    slug: "dao",
    group: "asset",
    description: "Decentralized autonomous organizations and web3 communities",
    displayOrder: 40,
    relevantMetrics: ["tokenHolders", "treasurySize", "chain"],
  },
  {
    name: "iGaming License",
    slug: "igaming-license",
    group: "asset",
    description: "Transferable gaming or gambling licenses",
    displayOrder: 50,
    relevantMetrics: ["licenseType", "licenseJurisdiction", "licenseExpiry", "licenseStatus"],
  },
  {
    name: "Crypto Exchange",
    slug: "crypto-exchange",
    group: "asset",
    description: "Centralized or decentralized cryptocurrency exchanges",
    displayOrder: 60,
    relevantMetrics: ["annualRevenue", "mau", "dailyActiveWallets", "chain"],
  },
  {
    name: "Domain / Digital Property",
    slug: "domain-digital",
    group: "asset",
    description: "Premium domains, websites, apps, and other digital properties",
    displayOrder: 70,
    relevantMetrics: ["monthlyTraffic", "domainAuthority", "annualRevenue", "monetizationMethod"],
  },
  {
    name: "Other Asset",
    slug: "other-asset",
    group: "asset",
    description: "Digital or physical assets not covered by other categories",
    displayOrder: 99,
    relevantMetrics: [],
  },
];

async function seed() {
  console.log("Seeding listing categories...\n");
  let created = 0;
  let skipped = 0;

  for (const cat of defaultCategories) {
    const existing = await db
      .select({ id: listingCategories.id })
      .from(listingCategories)
      .where(eq(listingCategories.slug, cat.slug))
      .limit(1);

    if (existing.length > 0) {
      console.log(`  SKIP  ${cat.slug} (already exists)`);
      skipped++;
      continue;
    }

    await db.insert(listingCategories).values({
      name: cat.name,
      slug: cat.slug,
      group: cat.group,
      description: cat.description,
      displayOrder: cat.displayOrder,
      isActive: 1,
      relevantMetrics: cat.relevantMetrics,
    });
    console.log(`  CREATE ${cat.slug}`);
    created++;
  }

  console.log(`\nDone. Created: ${created}, Skipped: ${skipped}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
