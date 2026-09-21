import { createConnection, type Connection } from "mysql2/promise";
import { pathToFileURL } from "node:url";

const DATABASE_URL = process.env.DATABASE_URL;

const verticalData = [
  { name: "Crypto / Web3", slug: "crypto-web3", description: "Blockchain protocols, DeFi, GameFi, and Web3 infrastructure", sortOrder: 1 },
  { name: "iGaming", slug: "igaming", description: "Online gambling platforms, casino software, and betting operations", sortOrder: 2 },
  { name: "AI", slug: "ai", description: "AI tools, ML models, and AI-powered applications", sortOrder: 3 },
  { name: "SaaS", slug: "saas", description: "Software-as-a-Service businesses and platforms", sortOrder: 4 },
  { name: "Creator Economy", slug: "creator-economy", description: "Content platforms, creator tools, and media businesses", sortOrder: 5 },
  { name: "Domains", slug: "domains", description: "Premium domain names and digital real estate", sortOrder: 6 },
];

const cryptoAssetTypes = [
  { name: "Protocol", slug: "protocol", description: "Layer 1/Layer 2 blockchain protocols", sortOrder: 1 },
  { name: "Token Project", slug: "token-project", description: "Token-based projects and ecosystems", sortOrder: 2 },
  { name: "Telegram Mini App", slug: "telegram-mini-app", description: "Mini applications built on Telegram", sortOrder: 3 },
  { name: "DeFi App", slug: "defi-app", description: "Decentralized finance applications", sortOrder: 4 },
  { name: "GameFi / GambleFi", slug: "gamefi-gamblefi", description: "Blockchain gaming and gambling applications", sortOrder: 5 },
  { name: "Trading Bot", slug: "trading-bot", description: "Automated trading bots and algorithms", sortOrder: 6 },
  { name: "Wallet / Infrastructure", slug: "wallet-infrastructure", description: "Wallets, node services, and Web3 infrastructure", sortOrder: 7 },
  { name: "NFT Collection", slug: "nft-collection", description: "NFT collections and marketplaces", sortOrder: 8 },
  { name: "DAO", slug: "dao", description: "Decentralized autonomous organizations", sortOrder: 9 },
  { name: "Community", slug: "community", description: "Online communities and social tokens", sortOrder: 10 },
  { name: "Source Code / Smart Contract", slug: "source-code-smart-contract", description: "Source code, smart contracts, and codebases for sale", sortOrder: 11 },
  { name: "Analytics Tool", slug: "analytics-tool", description: "Blockchain analytics and data tools", sortOrder: 12 },
];

const subcategoryData: Record<string, Array<{ name: string; slug: string; description: string; sortOrder: number }>> = {
  "token-project": [
    { name: "Utility Token", slug: "utility-token", description: "Projects with utility or access tokens", sortOrder: 1 },
    { name: "Meme / Community Token", slug: "meme-community-token", description: "Community-led token projects", sortOrder: 2 },
  ],
  "telegram-mini-app": [
    { name: "Tap-to-Earn", slug: "tap-to-earn", description: "Telegram tap-to-earn and reward apps", sortOrder: 1 },
    { name: "Trading / Utility Bot", slug: "trading-utility-bot", description: "Telegram utility bots with Web3 flows", sortOrder: 2 },
  ],
  "defi-app": [
    { name: "DEX / Swap", slug: "dex-swap", description: "Decentralized exchange and swap products", sortOrder: 1 },
    { name: "Lending / Yield", slug: "lending-yield", description: "Lending, staking, and yield protocols", sortOrder: 2 },
  ],
  "gamefi-gamblefi": [
    { name: "Casino / Betting", slug: "casino-betting", description: "On-chain casino, betting, and wager products", sortOrder: 1 },
    { name: "Game Economy", slug: "game-economy", description: "Tokenized games and game economies", sortOrder: 2 },
  ],
  "source-code-smart-contract": [
    { name: "Audited Contract", slug: "audited-contract", description: "Audited smart contract assets", sortOrder: 1 },
    { name: "Full App Codebase", slug: "full-app-codebase", description: "Complete source-code packages", sortOrder: 2 },
  ],
};

const chainData = [
  { name: "Ethereum", slug: "ethereum", chainId: 1, rpcUrl: "https://eth.llamarpc.com", logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
  { name: "Polygon", slug: "polygon", chainId: 137, rpcUrl: "https://polygon-rpc.com", logoUrl: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png" },
  { name: "BNB Smart Chain", slug: "bsc", chainId: 56, rpcUrl: "https://bsc-dataseed.binance.org", logoUrl: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
  { name: "Arbitrum", slug: "arbitrum", chainId: 42161, rpcUrl: "https://arb1.arbitrum.io/rpc", logoUrl: "https://assets.coingecko.com/coins/images/16547/small/arb.jpg" },
  { name: "Base", slug: "base", chainId: 8453, rpcUrl: "https://mainnet.base.org", logoUrl: "https://assets.coingecko.com/coins/images/29650/small/base.png" },
  { name: "Solana", slug: "solana", chainId: 0, rpcUrl: "https://api.mainnet-beta.solana.com", logoUrl: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
];

async function tableExists(connection: Connection, tableName: string): Promise<boolean> {
  const [rows] = await connection.execute(
    "SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
    [tableName],
  );
  return Number((rows as Array<{ count: number }>)[0]?.count ?? 0) > 0;
}

async function columnExists(connection: Connection, tableName: string, columnName: string): Promise<boolean> {
  const [rows] = await connection.execute(
    "SELECT COUNT(*) AS count FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [tableName, columnName],
  );
  return Number((rows as Array<{ count: number }>)[0]?.count ?? 0) > 0;
}

async function ensureColumn(connection: Connection, tableName: string, columnName: string, definition: string) {
  if (!(await columnExists(connection, tableName, columnName))) {
    await connection.execute(`ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${definition}`);
    console.log(`[Phase1] Added ${tableName}.${columnName}`);
  }
}

export async function ensureLongtextColumn(connection: Connection, tableName: string, columnName: string) {
  const [rows] = await connection.execute(
    "SELECT DATA_TYPE AS dataType FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
    [tableName, columnName],
  );
  const currentType = (rows as Array<{ dataType: string }>)[0]?.dataType;
  if (currentType && currentType.toLowerCase() !== "longtext") {
    await connection.execute(`ALTER TABLE \`${tableName}\` MODIFY COLUMN \`${columnName}\` LONGTEXT NULL`);
    console.log(`[Phase1] Widened ${tableName}.${columnName} to LONGTEXT (was ${currentType})`);
  }
}

async function ensureSchema(connection: Connection) {
  await ensureColumn(connection, "listings", "verticalId", "int");
  await ensureColumn(connection, "listings", "assetTypeId", "int");
  await ensureColumn(connection, "listings", "subcategoryId", "int");

  await connection.execute(`CREATE TABLE IF NOT EXISTS \`verticals\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`slug\` varchar(255) NOT NULL,
    \`description\` text,
    \`icon\` varchar(255),
    \`sortOrder\` int NOT NULL DEFAULT 0,
    \`isActive\` tinyint NOT NULL DEFAULT 1,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`verticals_slug_unique\` (\`slug\`)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS \`asset_types\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`slug\` varchar(255) NOT NULL,
    \`description\` text,
    \`icon\` varchar(255),
    \`sortOrder\` int NOT NULL DEFAULT 0,
    \`isActive\` tinyint NOT NULL DEFAULT 1,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`asset_types_slug_unique\` (\`slug\`)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS \`subcategories\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`assetTypeId\` int NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`slug\` varchar(255) NOT NULL,
    \`description\` text,
    \`sortOrder\` int NOT NULL DEFAULT 0,
    \`isActive\` tinyint NOT NULL DEFAULT 1,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`subcategories_asset_slug_unique\` (\`assetTypeId\`, \`slug\`)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS \`vertical_asset_types\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`verticalId\` int NOT NULL,
    \`assetTypeId\` int NOT NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`vertical_asset_types_unique\` (\`verticalId\`, \`assetTypeId\`)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS \`supported_chains\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`name\` varchar(255) NOT NULL,
    \`slug\` varchar(255) NOT NULL,
    \`chainId\` int,
    \`rpcUrl\` text,
    \`logoUrl\` text,
    \`isActive\` tinyint NOT NULL DEFAULT 1,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`supported_chains_slug_unique\` (\`slug\`)
  )`);

  await connection.execute(`CREATE TABLE IF NOT EXISTS \`wallet_verifications\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`listingId\` int NOT NULL,
    \`walletAddress\` varchar(255) NOT NULL,
    \`chainId\` int NOT NULL,
    \`signature\` text NOT NULL,
    \`message\` text NOT NULL,
    \`verifiedAt\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    UNIQUE KEY \`wallet_verifications_listing_unique\` (\`listingId\`)
  )`);

  // Phase 2: Dynamic listing forms
  await connection.execute(`CREATE TABLE IF NOT EXISTS \`field_definitions\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`verticalId\` int,
    \`assetTypeId\` int,
    \`subcategoryId\` int,
    \`fieldKey\` varchar(100) NOT NULL,
    \`label\` varchar(255) NOT NULL,
    \`description\` text,
    \`helpText\` text,
    \`fieldType\` enum('text','textarea','number','currency','percentage','url','dropdown','multi_select','boolean','date','wallet_address','contract_address') NOT NULL,
    \`required\` tinyint NOT NULL DEFAULT 0,
    \`options\` text,
    \`sortOrder\` int NOT NULL DEFAULT 0,
    \`isPublic\` tinyint NOT NULL DEFAULT 1,
    \`visibilityLevel\` enum('public','public_preview','registered_users','nda_required','seller_approval_required','specific_buyer_only','admin_only') NOT NULL DEFAULT 'public',
    \`showOnCard\` tinyint NOT NULL DEFAULT 0,
    \`filterable\` tinyint NOT NULL DEFAULT 0,
    \`sortable\` tinyint NOT NULL DEFAULT 0,
    \`isActive\` tinyint NOT NULL DEFAULT 1,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    INDEX \`field_definitions_assetTypeId_idx\` (\`assetTypeId\`),
    INDEX \`field_definitions_verticalId_idx\` (\`verticalId\`)
  )`);

  await ensureColumn(
    connection,
    "field_definitions",
    "visibilityLevel",
    "enum('public','public_preview','registered_users','nda_required','seller_approval_required','specific_buyer_only','admin_only') NOT NULL DEFAULT 'public'",
  );

  await connection.execute(`CREATE TABLE IF NOT EXISTS \`listing_field_values\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`listingId\` int NOT NULL,
    \`fieldDefinitionId\` int NOT NULL,
    \`value\` text,
    \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`),
    INDEX \`listing_field_values_listingId_idx\` (\`listingId\`),
    INDEX \`listing_field_values_fieldDefinitionId_idx\` (\`fieldDefinitionId\`)
  )`);

  await ensureHomepageContentSchema(connection);

  console.log("[Phase1] Database structure ready");
}

async function ensureHomepageContentSchema(connection: Connection) {
  // Migration 0079: homepage content phase 1
  await ensureColumn(connection, "siteSettings", "statConfidential", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "statConfidentialLabel", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "featuresEyebrow", "varchar(200) NULL");
  await ensureColumn(connection, "siteSettings", "featuresHeadline", "varchar(200) NULL");
  await ensureColumn(connection, "siteSettings", "featuresSubheadline", "text NULL");
  await ensureColumn(connection, "siteSettings", "featureCardsJson", "text NULL");
  await ensureColumn(connection, "siteSettings", "howItWorksEyebrow", "varchar(200) NULL");
  await ensureColumn(connection, "siteSettings", "howItWorksHeadline", "varchar(200) NULL");
  await ensureColumn(connection, "siteSettings", "howItWorksSubheadline", "text NULL");
  await ensureColumn(connection, "siteSettings", "howItWorksSellersJson", "text NULL");
  await ensureColumn(connection, "siteSettings", "howItWorksBuyersJson", "text NULL");
  await ensureColumn(connection, "siteSettings", "ctaEyebrow", "varchar(200) NULL");
  await ensureColumn(connection, "siteSettings", "ctaHeadline", "varchar(200) NULL");
  await ensureColumn(connection, "siteSettings", "ctaDescription", "text NULL");
  await ensureColumn(connection, "siteSettings", "activeOpportunitiesHeadline", "varchar(200) NULL");
  await ensureColumn(connection, "siteSettings", "activeOpportunitiesSubheadline", "text NULL");

  // Migration 0080: homepage content follow-up
  await ensureColumn(connection, "siteSettings", "statusBarLiveLabel", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "statusBarActiveListingsLabel", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "statusBarAccessLabel", "varchar(50) NULL");
  await ensureColumn(connection, "siteSettings", "statusBarAccessValue", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "statusBarConfidentialTagline", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "heroBadge1Text", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "heroBadge2Text", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "heroTrust1Text", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "heroTrust2Text", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "heroTrust3Text", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "ctaBrowseListingsText", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "ctaBrowseListingsUrl", "varchar(500) NULL");
  await ensureColumn(connection, "siteSettings", "ctaListBusinessText", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "ctaListBusinessUrl", "varchar(500) NULL");
  await ensureColumn(connection, "siteSettings", "ctaSignUpText", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "activeOpportunitiesEyebrow", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "activeOpportunitiesEyebrowBadge", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "activeOpportunitiesSubmitBtn", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "activeOpportunitiesMandateBtn", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "activeOpportunitiesGhostCardsJson", "text NULL");
  await ensureColumn(connection, "siteSettings", "heroDealCardEmptyJson", "text NULL");
  await ensureColumn(connection, "siteSettings", "heroDealCardCuratedLabel", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "heroDealCardManuallyReviewedLabel", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "navMarketplaceLabel", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "navBuyerMandatesLabel", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "navSellBusinessLabel", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "navHowItWorksLabel", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "navLoginLabel", "varchar(50) NULL");
  await ensureColumn(connection, "siteSettings", "footerTagline", "text NULL");
  await ensureColumn(connection, "siteSettings", "footerDisclaimer", "text NULL");
  await ensureColumn(connection, "siteSettings", "footerLinksJson", "text NULL");

  // Migration 0081: remaining homepage copy
  await ensureColumn(connection, "siteSettings", "activeOpportunitiesViewListingBtn", "varchar(100) NULL");
  await ensureColumn(connection, "siteSettings", "activeOpportunitiesViewAllBtnText", "varchar(200) NULL");
  await ensureColumn(connection, "siteSettings", "activeOpportunitiesFilterAllLabel", "varchar(50) NULL");
  await ensureColumn(connection, "siteSettings", "footerCopyrightText", "varchar(200) NULL");

  // Migration 0082: widen logoUrl to LONGTEXT for base64 data URL logo uploads
  await ensureLongtextColumn(connection, "siteSettings", "logoUrl");

  console.log("[Phase1] Homepage content columns ensured");
}

async function getIdBySlug(connection: Connection, tableName: string, slug: string): Promise<number> {
  const [rows] = await connection.execute(`SELECT id FROM \`${tableName}\` WHERE slug = ? LIMIT 1`, [slug]);
  const id = (rows as Array<{ id: number }>)[0]?.id;
  if (!id) throw new Error(`Missing ${tableName} row for slug: ${slug}`);
  return id;
}

async function seedData(connection: Connection) {
  for (const item of verticalData) {
    await connection.execute(
      `INSERT INTO verticals (name, slug, description, sortOrder)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sortOrder = VALUES(sortOrder), isActive = 1`,
      [item.name, item.slug, item.description, item.sortOrder],
    );
  }

  for (const item of cryptoAssetTypes) {
    await connection.execute(
      `INSERT INTO asset_types (name, slug, description, sortOrder)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sortOrder = VALUES(sortOrder), isActive = 1`,
      [item.name, item.slug, item.description, item.sortOrder],
    );
  }

  const cryptoVerticalId = await getIdBySlug(connection, "verticals", "crypto-web3");
  for (const item of cryptoAssetTypes) {
    const assetTypeId = await getIdBySlug(connection, "asset_types", item.slug);
    await connection.execute(
      `INSERT INTO vertical_asset_types (verticalId, assetTypeId)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE verticalId = VALUES(verticalId), assetTypeId = VALUES(assetTypeId)`,
      [cryptoVerticalId, assetTypeId],
    );

    for (const subcategory of subcategoryData[item.slug] ?? []) {
      await connection.execute(
        `INSERT INTO subcategories (assetTypeId, name, slug, description, sortOrder)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sortOrder = VALUES(sortOrder), isActive = 1`,
        [assetTypeId, subcategory.name, subcategory.slug, subcategory.description, subcategory.sortOrder],
      );
    }
  }

  for (const item of chainData) {
    await connection.execute(
      `INSERT INTO supported_chains (name, slug, chainId, rpcUrl, logoUrl)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), chainId = VALUES(chainId), rpcUrl = VALUES(rpcUrl), logoUrl = VALUES(logoUrl), isActive = 1`,
      [item.name, item.slug, item.chainId, item.rpcUrl, item.logoUrl],
    );
  }

  const tablesToVerify = ["verticals", "asset_types", "subcategories", "vertical_asset_types", "supported_chains", "wallet_verifications", "field_definitions", "listing_field_values"];
  for (const tableName of tablesToVerify) {
    if (!(await tableExists(connection, tableName))) throw new Error(`Table not created: ${tableName}`);
  }

  console.log(`[Phase1] Seed data ready: ${verticalData.length} verticals, ${cryptoAssetTypes.length} crypto asset types, ${chainData.length} chains`);
}

// ============= MVP Launch Taxonomy (Slice 2A) =============

const mvpVertical = {
  name: "Crypto-Friendly iGaming",
  slug: "crypto-friendly-igaming",
  description: "Acquisitions and investments in iGaming businesses and assets that accept or are optimised for crypto payments and players",
  sortOrder: 1,
};

const mvpAssetTypes = [
  { name: "Operating iGaming Business", slug: "operating-igaming-business", description: "Live, revenue-generating iGaming operations — casinos, sportsbooks, poker rooms and white-label platforms", sortOrder: 1 },
  { name: "B2B iGaming Technology", slug: "b2b-igaming-technology", description: "Software, platforms and tools sold to iGaming operators — game studios, sportsbook engines, payment processors, compliance and back-office", sortOrder: 2 },
  { name: "Affiliate / Media / Traffic Asset", slug: "affiliate-media-traffic-asset", description: "iGaming affiliate sites, review portals, email lists, social channels and SEO content assets that generate player traffic", sortOrder: 3 },
];

const mvpSubcategories: Record<string, Array<{ name: string; slug: string; description: string; sortOrder: number }>> = {
  "operating-igaming-business": [
    { name: "Online Casino", slug: "online-casino", description: "Web-based casino operations with slots, table games and live dealer", sortOrder: 1 },
    { name: "Crypto Casino", slug: "crypto-casino", description: "Crypto-native casino accepting Bitcoin, stablecoins and other digital assets", sortOrder: 2 },
    { name: "Sportsbook / Betting Platform", slug: "sportsbook-betting-platform", description: "Sports betting and fixed-odds wagering operations", sortOrder: 3 },
    { name: "Poker Room", slug: "poker-room", description: "Online poker network or standalone poker room", sortOrder: 4 },
    { name: "White-Label iGaming Platform", slug: "white-label-igaming-platform", description: "Turnkey white-label casino or sportsbook business", sortOrder: 5 },
  ],
  "b2b-igaming-technology": [
    { name: "Casino Game Studio", slug: "casino-game-studio", description: "Game content studio producing slots, table games or live dealer", sortOrder: 1 },
    { name: "Sportsbook Platform / Odds Feed", slug: "sportsbook-platform-odds-feed", description: "Sportsbook engine, trading platform or odds data provider", sortOrder: 2 },
    { name: "Payment Processing / PSP", slug: "payment-processing-psp", description: "iGaming-focused payment processor, PSP or crypto payment gateway", sortOrder: 3 },
    { name: "KYC / Compliance / AML Tool", slug: "kyc-compliance-aml-tool", description: "Player verification, AML screening and regulatory compliance software", sortOrder: 4 },
    { name: "Back Office / CRM / Platform", slug: "back-office-crm-platform", description: "Operator back-office systems, CRM, player management or affiliate management platform", sortOrder: 5 },
  ],
  "affiliate-media-traffic-asset": [
    { name: "Casino Review / Comparison Site", slug: "casino-review-comparison-site", description: "SEO-driven casino review or casino-comparison affiliate site", sortOrder: 1 },
    { name: "Sports Betting Affiliate", slug: "sports-betting-affiliate", description: "Affiliate site or content property focused on sports betting", sortOrder: 2 },
    { name: "iGaming SEO / Content Site", slug: "igaming-seo-content-site", description: "Niche iGaming content site with organic search traffic and affiliate revenue", sortOrder: 3 },
    { name: "iGaming Email / Player List", slug: "igaming-email-player-list", description: "Opted-in email list or registered player database from iGaming properties", sortOrder: 4 },
    { name: "Telegram / Social iGaming Channel", slug: "telegram-social-igaming-channel", description: "Telegram group, channel or social media account with iGaming audience", sortOrder: 5 },
  ],
};

async function seedMvpTaxonomy(connection: Connection) {
  // 1. Deactivate all legacy verticals and asset types — preserves rows, hides from public selectors
  await connection.execute("UPDATE verticals SET isActive = 0");
  await connection.execute("UPDATE asset_types SET isActive = 0");
  await connection.execute("UPDATE subcategories SET isActive = 0");

  // 2. Upsert MVP launch vertical (reactivates on reruns)
  await connection.execute(
    `INSERT INTO verticals (name, slug, description, sortOrder, isActive)
     VALUES (?, ?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sortOrder = VALUES(sortOrder), isActive = 1`,
    [mvpVertical.name, mvpVertical.slug, mvpVertical.description, mvpVertical.sortOrder],
  );

  const mvpVerticalId = await getIdBySlug(connection, "verticals", mvpVertical.slug);

  // 3. Upsert three MVP launch asset types and link to MVP vertical
  for (const at of mvpAssetTypes) {
    await connection.execute(
      `INSERT INTO asset_types (name, slug, description, sortOrder, isActive)
       VALUES (?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sortOrder = VALUES(sortOrder), isActive = 1`,
      [at.name, at.slug, at.description, at.sortOrder],
    );

    const atId = await getIdBySlug(connection, "asset_types", at.slug);

    await connection.execute(
      `INSERT INTO vertical_asset_types (verticalId, assetTypeId)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE verticalId = VALUES(verticalId), assetTypeId = VALUES(assetTypeId)`,
      [mvpVerticalId, atId],
    );

    // 4. Upsert subcategories for this asset type
    for (const sub of mvpSubcategories[at.slug] ?? []) {
      await connection.execute(
        `INSERT INTO subcategories (assetTypeId, name, slug, description, sortOrder, isActive)
         VALUES (?, ?, ?, ?, ?, 1)
         ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), sortOrder = VALUES(sortOrder), isActive = 1`,
        [atId, sub.name, sub.slug, sub.description, sub.sortOrder],
      );
    }
  }

  console.log(`[Phase1] MVP taxonomy ready: 1 launch vertical, ${mvpAssetTypes.length} launch asset types, ${Object.values(mvpSubcategories).flat().length} subcategories`);
}

// ============= MVP Diligence Fields (Slice 2C) =============

type FieldSeed = {
  fieldKey: string;
  label: string;
  description: string;
  helpText: string;
  fieldType: "text" | "textarea" | "number" | "currency" | "percentage" | "url" | "dropdown" | "multi_select" | "boolean";
  required: boolean;
  options: string | null;
  sortOrder: number;
  isPublic: boolean;
  showOnCard: boolean;
  filterable: boolean;
  sortable: boolean;
};

type SeedVisibilityLevel = "public" | "nda_required" | "seller_approval_required";

const NDA_REQUIRED_FIELD_KEYS = new Set([
  "jurisdiction_and_incorporation",
  "gaming_licenses",
  "accepted_markets",
  "restricted_markets",
]);

function getSeedVisibilityLevel(field: FieldSeed): SeedVisibilityLevel {
  if (field.isPublic) return "public";
  if (NDA_REQUIRED_FIELD_KEYS.has(field.fieldKey)) return "nda_required";
  return "seller_approval_required";
}

// Common seller-facing diligence fields for all three launch asset types
const commonDiligenceFields: FieldSeed[] = [
  {
    fieldKey: "teaser_summary",
    label: "Public Teaser Summary",
    description: "A brief, non-identifying summary of the asset shown publicly to buyers",
    helpText: "Do not include business name, domain or identifying details. 2–4 sentences.",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 5,
    isPublic: true,
    showOnCard: true,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "transaction_structure",
    label: "Transaction Structure",
    description: "Preferred deal type",
    helpText: "Select the deal structure you are open to",
    fieldType: "dropdown",
    required: false,
    options: JSON.stringify(["Asset Sale", "Share Sale / Equity Transfer", "Revenue Share / Earnout", "Joint Venture / Partnership", "License Agreement"]),
    sortOrder: 10,
    isPublic: true,
    showOnCard: true,
    filterable: true,
    sortable: false,
  },
  {
    fieldKey: "asking_price_range",
    label: "Asking Price Range (USD)",
    description: "Broad price band shown on the public listing card",
    helpText: "Select the nearest band. Exact price is negotiated in private.",
    fieldType: "dropdown",
    required: false,
    options: JSON.stringify(["Under $100K", "$100K – $500K", "$500K – $1M", "$1M – $5M", "$5M – $20M", "Over $20M"]),
    sortOrder: 20,
    isPublic: true,
    showOnCard: true,
    filterable: true,
    sortable: false,
  },
  {
    fieldKey: "jurisdiction_and_incorporation",
    label: "Jurisdiction & Incorporation",
    description: "Country or territory where the business is registered or incorporated",
    helpText: "e.g. Malta, Curaçao, Isle of Man, Anjouan",
    fieldType: "text",
    required: false,
    options: null,
    sortOrder: 30,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "gaming_licenses",
    label: "Gaming Licences",
    description: "Active gaming licences held by the business",
    helpText: "Include regulator name, licence number and jurisdiction",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 40,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "accepted_markets",
    label: "Accepted Markets / GEOs",
    description: "Markets where the business actively accepts players or clients",
    helpText: "List primary GEOs, e.g. Tier-1 EU, LATAM, APAC, ROW",
    fieldType: "text",
    required: false,
    options: null,
    sortOrder: 50,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "restricted_markets",
    label: "Restricted / Excluded Markets",
    description: "Markets blocked at checkout or by licence condition",
    helpText: "List GEOs you do not and cannot accept",
    fieldType: "text",
    required: false,
    options: null,
    sortOrder: 60,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "annual_revenue_usd",
    label: "Annual Revenue (USD)",
    description: "Total revenue for the most recent 12-month period",
    helpText: "Enter in USD. Trailing-twelve-month figure preferred.",
    fieldType: "currency",
    required: false,
    options: null,
    sortOrder: 70,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: true,
  },
  {
    fieldKey: "ebitda_usd",
    label: "EBITDA (USD, Annual)",
    description: "Earnings before interest, taxes, depreciation and amortisation — trailing 12 months",
    helpText: "Enter adjusted EBITDA if applicable; note any non-recurring items",
    fieldType: "currency",
    required: false,
    options: null,
    sortOrder: 80,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: true,
  },
  {
    fieldKey: "fiat_crypto_revenue_split",
    label: "Fiat vs Crypto Revenue Split",
    description: "Approximate percentage of revenue from fiat versus crypto sources",
    helpText: "e.g. 70% fiat, 30% crypto",
    fieldType: "text",
    required: false,
    options: null,
    sortOrder: 90,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "fiat_crypto_deposit_split",
    label: "Fiat vs Crypto Deposit Split",
    description: "Approximate percentage of deposit volume from fiat versus crypto payment rails",
    helpText: "e.g. 60% fiat, 40% crypto",
    fieldType: "text",
    required: false,
    options: null,
    sortOrder: 100,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "ownership_confirmation",
    label: "Ownership / Authority Confirmation",
    description: "Seller confirms they are authorised to sell or transfer this asset",
    helpText: "Check this box to confirm you own or are authorised to sell this asset",
    fieldType: "boolean",
    required: true,
    options: null,
    sortOrder: 110,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "known_disputes_or_incidents",
    label: "Known Disputes, Regulatory Issues or Security Incidents",
    description: "Any outstanding or historical legal, regulatory or security matters",
    helpText: "Disclose any active litigation, regulatory actions, data breaches or unresolved disputes",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 120,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
];

// Operating iGaming Business specific fields
const operatingIGamingFields: FieldSeed[] = [
  {
    fieldKey: "ggr_monthly_usd",
    label: "Monthly GGR (USD)",
    description: "Gross gaming revenue — total bets minus total winnings paid out, last full month",
    helpText: "Enter last full calendar month GGR in USD",
    fieldType: "currency",
    required: false,
    options: null,
    sortOrder: 200,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: true,
  },
  {
    fieldKey: "ngr_monthly_usd",
    label: "Monthly NGR (USD)",
    description: "Net gaming revenue — GGR minus bonuses and promotional costs, last full month",
    helpText: "Enter last full calendar month NGR in USD",
    fieldType: "currency",
    required: false,
    options: null,
    sortOrder: 210,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: true,
  },
  {
    fieldKey: "monthly_active_players",
    label: "Monthly Active Players (MAPs)",
    description: "Unique players with at least one deposit or wager in the last 30 days",
    helpText: "Enter the verified MAP count for the most recent full month",
    fieldType: "number",
    required: false,
    options: null,
    sortOrder: 220,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: true,
  },
  {
    fieldKey: "monthly_ftds",
    label: "Monthly First-Time Depositors (FTDs)",
    description: "New players making their first deposit in the last 30 days",
    helpText: "Enter verified FTD count for the most recent full month",
    fieldType: "number",
    required: false,
    options: null,
    sortOrder: 230,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "monthly_deposit_volume_usd",
    label: "Monthly Deposit Volume (USD)",
    description: "Total player deposits processed in the last full calendar month",
    helpText: "Include all payment methods — fiat and crypto combined",
    fieldType: "currency",
    required: false,
    options: null,
    sortOrder: 240,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: true,
  },
  {
    fieldKey: "monthly_withdrawal_volume_usd",
    label: "Monthly Withdrawal Volume (USD)",
    description: "Total player withdrawals processed in the last full calendar month",
    helpText: "Include all payment methods — fiat and crypto combined",
    fieldType: "currency",
    required: false,
    options: null,
    sortOrder: 250,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "traffic_source_breakdown",
    label: "Traffic Source Breakdown",
    description: "Summary of where player traffic originates",
    helpText: "e.g. 40% SEO, 35% affiliate, 15% PPC, 10% direct",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 260,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "affiliate_revenue_concentration",
    label: "Affiliate Revenue Concentration",
    description: "Percentage of revenue attributable to the top affiliate partner",
    helpText: "Enter the percentage (0–100) that your largest affiliate drives",
    fieldType: "percentage",
    required: false,
    options: null,
    sortOrder: 270,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "platform_provider",
    label: "Platform Provider",
    description: "Underlying iGaming platform or software provider powering the operation",
    helpText: "e.g. SoftSwiss, EveryMatrix, BetConstruct, proprietary",
    fieldType: "text",
    required: false,
    options: null,
    sortOrder: 280,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "game_providers",
    label: "Game Content Providers",
    description: "Key game studios and aggregators integrated",
    helpText: "e.g. Pragmatic Play, Evolution, NetEnt, Hacksaw",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 290,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "payment_providers",
    label: "Payment Providers",
    description: "PSPs, crypto gateways and payment methods supported",
    helpText: "List PSPs, crypto processors and available deposit methods",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 300,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "kyc_aml_process",
    label: "KYC / AML Process",
    description: "Overview of the player identity verification and anti-money-laundering procedures",
    helpText: "Describe your KYC provider, AML monitoring approach and verification thresholds",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 310,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "source_code_ip_ownership",
    label: "Source Code / IP Ownership",
    description: "Nature of the platform source code and intellectual property ownership",
    helpText: "Select the option that best describes your IP situation",
    fieldType: "dropdown",
    required: false,
    options: JSON.stringify(["Full ownership — no third-party dependencies", "White-label / licensed platform", "Open-source core with proprietary layer", "Shared IP / joint ownership agreement"]),
    sortOrder: 320,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
];

// B2B iGaming Technology specific fields
const b2bIGamingTechFields: FieldSeed[] = [
  {
    fieldKey: "live_client_count",
    label: "Number of Live Clients",
    description: "Active paying operator clients currently using the technology",
    helpText: "Count only clients currently live and paying — not trials or pipeline",
    fieldType: "number",
    required: false,
    options: null,
    sortOrder: 200,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: true,
  },
  {
    fieldKey: "monthly_recurring_revenue_usd",
    label: "Monthly Recurring Revenue (MRR, USD)",
    description: "Contracted or reliably recurring revenue per month",
    helpText: "Include licence fees, SaaS subscriptions and rev-share minimums",
    fieldType: "currency",
    required: false,
    options: null,
    sortOrder: 210,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: true,
  },
  {
    fieldKey: "largest_client_revenue_concentration",
    label: "Largest Client Revenue Concentration",
    description: "Percentage of total revenue from the single largest client",
    helpText: "Enter the percentage (0–100). High concentration is a diligence risk.",
    fieldType: "percentage",
    required: false,
    options: null,
    sortOrder: 220,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "integrations_and_certifications",
    label: "Integrations & Certifications",
    description: "Key platform integrations, API partnerships and regulatory certifications",
    helpText: "List major aggregator integrations, compliance certs (GLI, BMM, iTech) and API connections",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 230,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "code_ownership",
    label: "Code / IP Ownership",
    description: "Nature of code ownership and IP rights",
    helpText: "Select the option that best describes your IP situation",
    fieldType: "dropdown",
    required: false,
    options: JSON.stringify(["Full ownership — no third-party dependencies", "White-label / licensed platform", "Open-source core with proprietary layer", "Shared IP / joint ownership agreement"]),
    sortOrder: 240,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "infrastructure_obligations",
    label: "Infrastructure / Hosting Obligations",
    description: "Current hosting, cloud or co-location obligations included with the sale",
    helpText: "Describe servers, cloud contracts, SLAs and any third-party infrastructure that transfers",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 250,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "support_obligations",
    label: "Ongoing Support Obligations",
    description: "Client support, maintenance and SLA commitments that transfer with the sale",
    helpText: "Describe existing client SLAs, support tier commitments and staff or contractor headcount",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 260,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
];

// Affiliate / Media / Traffic Asset specific fields
const affiliateMediaFields: FieldSeed[] = [
  {
    fieldKey: "monthly_visitors_verified",
    label: "Monthly Visitors (Verified)",
    description: "Verified monthly unique visitor count from analytics",
    helpText: "Provide the GA4 or equivalent figure. Be prepared to share analytics access.",
    fieldType: "number",
    required: false,
    options: null,
    sortOrder: 200,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: true,
  },
  {
    fieldKey: "geo_traffic_mix",
    label: "Top GEO Traffic Mix",
    description: "Top 3–5 countries by traffic share",
    helpText: "e.g. UK 35%, Germany 20%, Canada 15%, Australia 10%",
    fieldType: "text",
    required: false,
    options: null,
    sortOrder: 210,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "monthly_ftds_generated",
    label: "Monthly FTDs Generated",
    description: "First-time depositors sent to operator partners per month",
    helpText: "Report average monthly FTDs for the last 3 months if available",
    fieldType: "number",
    required: false,
    options: null,
    sortOrder: 220,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: true,
  },
  {
    fieldKey: "cpa_rev_share_contracts",
    label: "Active CPA / Revenue-Share Contracts",
    description: "Overview of active affiliate agreements and deal terms with operators",
    helpText: "Describe your deal mix — number of operators, CPA rates, rev-share %, exclusivity clauses",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 230,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "largest_operator_revenue_concentration",
    label: "Largest Operator Revenue Concentration",
    description: "Percentage of total affiliate income from the single largest operator partner",
    helpText: "Enter the percentage (0–100). High concentration is a diligence risk.",
    fieldType: "percentage",
    required: false,
    options: null,
    sortOrder: 240,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
  {
    fieldKey: "seo_dependency",
    label: "SEO Dependency",
    description: "Primary traffic acquisition channel and SEO reliance",
    helpText: "Select the option that best describes your traffic sources",
    fieldType: "dropdown",
    required: false,
    options: JSON.stringify(["Primarily organic SEO", "Paid traffic dominant", "Mixed SEO + paid", "Social / newsletter primary", "Direct / brand traffic primary"]),
    sortOrder: 250,
    isPublic: false,
    showOnCard: false,
    filterable: true,
    sortable: false,
  },
  {
    fieldKey: "compliance_history",
    label: "Compliance History",
    description: "Any past or present regulatory, advertising standards or operator compliance issues",
    helpText: "Disclose any affiliate programme suspensions, ASA/FTC violations or operator disputes",
    fieldType: "textarea",
    required: false,
    options: null,
    sortOrder: 260,
    isPublic: false,
    showOnCard: false,
    filterable: false,
    sortable: false,
  },
];

const FORBIDDEN_FIELD_TYPES_FOR_IGAMING = new Set(["wallet_address", "contract_address"]);

function assertSeedIntegrity(fields: FieldSeed[], assetTypeSlug: string): void {
  const seen = new Set<string>();
  for (const f of fields) {
    if (seen.has(f.fieldKey)) {
      throw new Error(`[Phase1] Seed integrity: duplicate fieldKey '${f.fieldKey}' for assetType '${assetTypeSlug}'`);
    }
    seen.add(f.fieldKey);

    if (f.fieldType === "dropdown" || f.fieldType === "multi_select") {
      if (!f.options) {
        throw new Error(`[Phase1] Seed integrity: '${f.fieldKey}' is ${f.fieldType} but has no options`);
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(f.options);
      } catch {
        throw new Error(`[Phase1] Seed integrity: '${f.fieldKey}' options is not valid JSON`);
      }
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error(`[Phase1] Seed integrity: '${f.fieldKey}' options must be a non-empty JSON array`);
      }
    }

    if (FORBIDDEN_FIELD_TYPES_FOR_IGAMING.has(f.fieldType as string)) {
      throw new Error(`[Phase1] Seed integrity: '${f.fieldKey}' uses forbidden field type '${f.fieldType}' for iGaming asset type '${assetTypeSlug}'`);
    }

    const visibilityLevel = getSeedVisibilityLevel(f);
    if (!["public", "nda_required", "seller_approval_required"].includes(visibilityLevel)) {
      throw new Error(`[Phase1] Seed integrity: '${f.fieldKey}' resolved invalid visibility level '${visibilityLevel}'`);
    }
  }
}

async function upsertFieldDefinition(
  connection: Connection,
  verticalId: number,
  assetTypeId: number,
  field: FieldSeed,
): Promise<void> {
  const [rows] = await connection.execute(
    `SELECT id FROM field_definitions
     WHERE fieldKey = ? AND verticalId = ? AND assetTypeId = ? AND subcategoryId IS NULL
     LIMIT 1`,
    [field.fieldKey, verticalId, assetTypeId],
  );
  const existingId = (rows as Array<{ id: number }>)[0]?.id;
  const visibilityLevel = getSeedVisibilityLevel(field);

  const colValues = [
    field.label,
    field.description,
    field.helpText,
    field.fieldType,
    field.required ? 1 : 0,
    field.options ?? null,
    field.sortOrder,
    field.isPublic ? 1 : 0,
    visibilityLevel,
    field.showOnCard ? 1 : 0,
    field.filterable ? 1 : 0,
    field.sortable ? 1 : 0,
  ];

  if (existingId) {
    await connection.execute(
      `UPDATE field_definitions
       SET label = ?, description = ?, helpText = ?, fieldType = ?, required = ?, options = ?,
           sortOrder = ?, isPublic = ?, visibilityLevel = ?, showOnCard = ?, filterable = ?, sortable = ?, isActive = 1
       WHERE id = ?`,
      [...colValues, existingId],
    );
  } else {
    await connection.execute(
      `INSERT INTO field_definitions
         (verticalId, assetTypeId, subcategoryId, fieldKey,
          label, description, helpText, fieldType, required, options,
          sortOrder, isPublic, visibilityLevel, showOnCard, filterable, sortable, isActive)
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [verticalId, assetTypeId, field.fieldKey, ...colValues],
    );
  }
}

async function seedMvpDiligenceFields(connection: Connection) {
  const mvpVerticalId = await getIdBySlug(connection, "verticals", mvpVertical.slug);

  const assetTypeFieldMap: Array<{ slug: string; specificFields: FieldSeed[] }> = [
    { slug: "operating-igaming-business", specificFields: operatingIGamingFields },
    { slug: "b2b-igaming-technology", specificFields: b2bIGamingTechFields },
    { slug: "affiliate-media-traffic-asset", specificFields: affiliateMediaFields },
  ];

  let totalUpserted = 0;

  for (const { slug, specificFields } of assetTypeFieldMap) {
    const allFields = [...commonDiligenceFields, ...specificFields];

    // Integrity check before any DB writes for this asset type
    assertSeedIntegrity(allFields, slug);

    const assetTypeId = await getIdBySlug(connection, "asset_types", slug);

    for (const field of allFields) {
      await upsertFieldDefinition(connection, mvpVerticalId, assetTypeId, field);
      totalUpserted++;
    }
  }

  console.log(
    `[Phase1] MVP diligence fields ready: ${commonDiligenceFields.length} common + ${operatingIGamingFields.length} operating + ${b2bIGamingTechFields.length} B2B + ${affiliateMediaFields.length} affiliate fields (${totalUpserted} upserts across 3 asset types)`,
  );
}

async function main() {
  if (!DATABASE_URL) {
    console.warn("[Phase1] DATABASE_URL missing; skipping production database setup");
    return;
  }

  const connection = await createConnection(DATABASE_URL);
  try {
    console.log("[Phase1] Ensuring production database is ready...");
    await ensureSchema(connection);
    await seedData(connection);
    await seedMvpTaxonomy(connection);
    await seedMvpDiligenceFields(connection);
    console.log("[Phase1] Production database setup complete");
  } finally {
    await connection.end();
  }
}

// Only run as a side effect when this file is executed directly (e.g. `pnpm start`),
// not when it is imported (e.g. by tests importing `ensureLongtextColumn`). Without this
// guard, importing this module for any reason would execute the full production
// seed/migration script against DATABASE_URL if it happens to be set in that environment.
const isMainModule = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]!).href;

if (isMainModule) {
  main().catch((error) => {
    console.error("[Phase1] Production database setup failed:", error);
    process.exit(1);
  });
}
