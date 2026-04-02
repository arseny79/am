-- Migration: Add multi-vertical asset category fields to listings
-- Phase 173: Crypto/Web3 Layer — Asset Tags & Filters

ALTER TABLE `listings`
  ADD COLUMN `assetCategory` varchar(100) NULL,
  ADD COLUMN `acceptsStablecoinClosing` tinyint NOT NULL DEFAULT 0,
  ADD COLUMN `controlMapAvailable` tinyint NOT NULL DEFAULT 0,
  ADD COLUMN `preferredChains` text NULL;

-- Index for category filtering
CREATE INDEX `idx_listings_asset_category` ON `listings` (`assetCategory`);
