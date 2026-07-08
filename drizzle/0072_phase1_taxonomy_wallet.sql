-- Phase 1: configurable digital-assets taxonomy, supported chains, wallet verification

ALTER TABLE `listings` ADD COLUMN `verticalId` int;
ALTER TABLE `listings` ADD COLUMN `assetTypeId` int;
ALTER TABLE `listings` ADD COLUMN `subcategoryId` int;

CREATE TABLE `verticals` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `icon` varchar(255),
  `sortOrder` int NOT NULL DEFAULT 0,
  `isActive` tinyint NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `verticals_slug_unique` (`slug`)
);

CREATE TABLE `asset_types` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `icon` varchar(255),
  `sortOrder` int NOT NULL DEFAULT 0,
  `isActive` tinyint NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `asset_types_slug_unique` (`slug`)
);

CREATE TABLE `subcategories` (
  `id` int AUTO_INCREMENT NOT NULL,
  `assetTypeId` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `description` text,
  `sortOrder` int NOT NULL DEFAULT 0,
  `isActive` tinyint NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subcategories_asset_slug_unique` (`assetTypeId`, `slug`)
);

CREATE TABLE `vertical_asset_types` (
  `id` int AUTO_INCREMENT NOT NULL,
  `verticalId` int NOT NULL,
  `assetTypeId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vertical_asset_types_unique` (`verticalId`, `assetTypeId`)
);

CREATE TABLE `supported_chains` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `chainId` int,
  `rpcUrl` text,
  `logoUrl` text,
  `isActive` tinyint NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `supported_chains_slug_unique` (`slug`)
);

CREATE TABLE `wallet_verifications` (
  `id` int AUTO_INCREMENT NOT NULL,
  `listingId` int NOT NULL,
  `walletAddress` varchar(255) NOT NULL,
  `chainId` int NOT NULL,
  `signature` text NOT NULL,
  `message` text NOT NULL,
  `verifiedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `wallet_verifications_listing_unique` (`listingId`)
);
