-- Phase 2B: Dynamic Category Management
-- Creates categories and categoryPriceStructures tables,
-- adds categoryId FK to listings, and seeds initial categories.

-- ── 1. categories table ──────────────────────────────────────────────────────
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `type` enum('business','asset') NOT NULL DEFAULT 'business',
  `description` text,
  `isActive` tinyint NOT NULL DEFAULT 1,
  `sortOrder` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_slug_unique` (`slug`)
);

-- ── 2. categoryPriceStructures table ─────────────────────────────────────────
CREATE TABLE `categoryPriceStructures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `categoryId` int NOT NULL,
  `feeType` enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
  `feeValue` decimal(10,4) NOT NULL DEFAULT '3.0000',
  `currency` varchar(3) NOT NULL DEFAULT 'USD',
  `premiumUpgradePrice` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cps_categoryId_idx` (`categoryId`),
  CONSTRAINT `cps_categoryId_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE CASCADE
);

-- ── 3. Add categoryId to listings ────────────────────────────────────────────
ALTER TABLE `listings`
  ADD COLUMN `categoryId` int DEFAULT NULL,
  ADD KEY `listings_categoryId_idx` (`categoryId`),
  ADD CONSTRAINT `listings_categoryId_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

-- ── 4. Seed initial categories ───────────────────────────────────────────────
-- Traditional / legacy business categories
INSERT INTO `categories` (`name`, `slug`, `type`, `description`, `isActive`, `sortOrder`) VALUES
  ('SaaS / Software', 'saas-software', 'business', 'Software-as-a-Service and software product businesses', 1, 10),
  ('E-commerce', 'ecommerce', 'business', 'Online retail and e-commerce businesses', 1, 20),
  ('IT Services / MSP', 'it-services-msp', 'business', 'Managed service providers and IT services businesses', 1, 30),
  ('Agency', 'agency', 'business', 'Digital, marketing, creative, and consulting agencies', 1, 40),
  ('Content / Media', 'content-media', 'business', 'Newsletters, blogs, media properties, and content businesses', 1, 50),
  ('Healthcare', 'healthcare', 'business', 'Healthcare practices, services, and health-tech businesses', 1, 60),
  ('Professional Services', 'professional-services', 'business', 'Law firms, accounting practices, and professional services', 1, 70),
  ('Manufacturing / Physical', 'manufacturing-physical', 'business', 'Manufacturing, distribution, and physical product businesses', 1, 80),
  ('Other Business', 'other-business', 'business', 'Other traditional business types', 1, 90),
-- Crypto / Web3 / Digital asset categories
  ('DeFi Protocol', 'defi-protocol', 'asset', 'Decentralized finance protocols and smart contract systems', 1, 100),
  ('NFT Project', 'nft-project', 'asset', 'NFT collections, marketplaces, and NFT-based projects', 1, 110),
  ('DAO', 'dao', 'asset', 'Decentralized autonomous organizations', 1, 120),
  ('Crypto / Token Project', 'crypto-token-project', 'asset', 'Cryptocurrency projects, tokens, and blockchain protocols', 1, 130),
  ('Web3 SaaS', 'web3-saas', 'asset', 'Web3-native software and decentralized applications', 1, 140),
  ('Domain / Digital Asset', 'domain-digital-asset', 'asset', 'Premium domains, social handles, and digital real estate', 1, 150),
  ('Other Digital Asset', 'other-digital-asset', 'asset', 'Other crypto, web3, or digital assets', 1, 160);

-- ── 5. Seed default price structures for all categories ──────────────────────
-- Business categories: 3% success fee
INSERT INTO `categoryPriceStructures` (`categoryId`, `feeType`, `feeValue`, `currency`, `premiumUpgradePrice`)
SELECT `id`, 'percentage', '3.0000', 'USD', 9900
FROM `categories`
WHERE `type` = 'business';

-- Asset categories: fixed $99 listing fee
INSERT INTO `categoryPriceStructures` (`categoryId`, `feeType`, `feeValue`, `currency`, `premiumUpgradePrice`)
SELECT `id`, 'fixed', '9900.0000', 'USD', NULL
FROM `categories`
WHERE `type` = 'asset';
