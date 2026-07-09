import { createConnection, type Connection } from "mysql2/promise";

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

  console.log("[Phase1] Database structure ready");
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
    console.log("[Phase1] Production database setup complete");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("[Phase1] Production database setup failed:", error);
  process.exit(1);
});
