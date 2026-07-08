// Seed taxonomy data: verticals, asset types, vertical-asset-type links, and supported chains
// Run: node --import tsx scripts/seed-taxonomy.ts

import { drizzle } from "drizzle-orm/mysql2";
import { createConnection } from "mysql2/promise";
import { eq } from "drizzle-orm";
import { verticals, assetTypes, verticalAssetTypes, supportedChains, subcategories } from "../drizzle/schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function seed() {
  const connection = await createConnection(DATABASE_URL);
  const db = drizzle(connection);

  console.log("Seeding taxonomy data...\n");

  // 1. Verticals
  const verticalData = [
    { name: "Crypto / Web3", slug: "crypto-web3", description: "Blockchain protocols, DeFi, GameFi, and Web3 infrastructure", sortOrder: 1 },
    { name: "iGaming", slug: "igaming", description: "Online gambling platforms, casino software, and betting operations", sortOrder: 2 },
    { name: "AI", slug: "ai", description: "AI tools, ML models, and AI-powered applications", sortOrder: 3 },
    { name: "SaaS", slug: "saas", description: "Software-as-a-Service businesses and platforms", sortOrder: 4 },
    { name: "Creator Economy", slug: "creator-economy", description: "Content platforms, creator tools, and media businesses", sortOrder: 5 },
    { name: "Domains", slug: "domains", description: "Premium domain names and digital real estate", sortOrder: 6 },
  ];

  const verticalIds: Record<string, number> = {};
  for (const v of verticalData) {
    await db.insert(verticals).values(v).onDuplicateKeyUpdate({
      set: { name: v.name, description: v.description, sortOrder: v.sortOrder },
    });
    const [existing] = await db.select().from(verticals).where(eq(verticals.slug, v.slug));
    if (existing) {
      verticalIds[v.slug] = existing.id;
      console.log(`  Vertical: ${v.name} (id: ${existing.id})`);
    }
  }

  // 2. Asset Types for Crypto / Web3
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

  const assetTypeIds: Record<string, number> = {};
  for (const a of cryptoAssetTypes) {
    await db.insert(assetTypes).values(a).onDuplicateKeyUpdate({
      set: { name: a.name, description: a.description, sortOrder: a.sortOrder },
    });
    const [existing] = await db.select().from(assetTypes).where(eq(assetTypes.slug, a.slug));
    if (existing) {
      assetTypeIds[a.slug] = existing.id;
      console.log(`  Asset Type: ${a.name} (id: ${existing.id})`);
    }
  }

  // 3. Crypto/Web3 subcategories
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

  let subcategoryCount = 0;
  for (const [assetSlug, items] of Object.entries(subcategoryData)) {
    const assetTypeId = assetTypeIds[assetSlug];
    if (!assetTypeId) continue;
    for (const item of items) {
      await db.insert(subcategories).values({ assetTypeId, ...item }).onDuplicateKeyUpdate({
        set: { name: item.name, description: item.description, sortOrder: item.sortOrder },
      });
      subcategoryCount += 1;
    }
  }

  // 4. Link all crypto asset types to the Crypto / Web3 vertical
  const cryptoVerticalId = verticalIds["crypto-web3"];
  if (cryptoVerticalId) {
    for (const slug of Object.keys(assetTypeIds)) {
      await db.insert(verticalAssetTypes).values({
        verticalId: cryptoVerticalId,
        assetTypeId: assetTypeIds[slug],
      }).onDuplicateKeyUpdate({
        set: { verticalId: cryptoVerticalId, assetTypeId: assetTypeIds[slug] },
      });
    }
    console.log(`  Linked ${Object.keys(assetTypeIds).length} asset types to Crypto / Web3`);
  }

  // 5. Supported Chains
  const chainData = [
    { name: "Ethereum", slug: "ethereum", chainId: 1, rpcUrl: "https://eth.llamarpc.com", logoUrl: "https://assets.coingecko.com/coins/images/279/small/ethereum.png" },
    { name: "Polygon", slug: "polygon", chainId: 137, rpcUrl: "https://polygon-rpc.com", logoUrl: "https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png" },
    { name: "BNB Smart Chain", slug: "bsc", chainId: 56, rpcUrl: "https://bsc-dataseed.binance.org", logoUrl: "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png" },
    { name: "Arbitrum", slug: "arbitrum", chainId: 42161, rpcUrl: "https://arb1.arbitrum.io/rpc", logoUrl: "https://assets.coingecko.com/coins/images/16547/small/arb.jpg" },
    { name: "Base", slug: "base", chainId: 8453, rpcUrl: "https://mainnet.base.org", logoUrl: "https://assets.coingecko.com/coins/images/29650/small/base.png" },
    { name: "Solana", slug: "solana", chainId: 0, rpcUrl: "https://api.mainnet-beta.solana.com", logoUrl: "https://assets.coingecko.com/coins/images/4128/small/solana.png" },
  ];

  for (const c of chainData) {
    await db.insert(supportedChains).values(c).onDuplicateKeyUpdate({
      set: { name: c.name, chainId: c.chainId, rpcUrl: c.rpcUrl, logoUrl: c.logoUrl },
    });
    console.log(`  Chain: ${c.name}`);
  }

  console.log(`\nSeed complete!`);
  console.log(`  ${verticalData.length} verticals`);
  console.log(`  ${cryptoAssetTypes.length} crypto asset types`);
  console.log(`  ${subcategoryCount} crypto subcategories`);
  console.log(`  ${chainData.length} supported chains`);
  await connection.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
