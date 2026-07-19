-- Phase 3A: Visibility Engine Foundation
-- Additive migration: adds visibilityLevel columns to listings, listingDocuments, field_definitions
-- Backfills from existing confidentialityLevel / accessLevel columns
-- Safe to run: all columns have defaults, existing data is preserved

-- 1. listings.visibilityLevel
ALTER TABLE `listings` ADD COLUMN `visibilityLevel` ENUM(
  'public',
  'public_preview',
  'registered_users',
  'nda_required',
  'seller_approval_required',
  'specific_buyer_only',
  'admin_only'
) NOT NULL DEFAULT 'public';

UPDATE `listings` SET `visibilityLevel` = CASE
  WHEN `confidentialityLevel` = 'nda' THEN 'nda_required'
  WHEN `confidentialityLevel` = 'private' THEN 'seller_approval_required'
  ELSE 'public'
END;

-- 2. listingDocuments.visibilityLevel
ALTER TABLE `listingDocuments` ADD COLUMN `visibilityLevel` ENUM(
  'public',
  'public_preview',
  'registered_users',
  'nda_required',
  'seller_approval_required',
  'specific_buyer_only',
  'admin_only'
) NOT NULL DEFAULT 'nda_required';

UPDATE `listingDocuments` SET `visibilityLevel` = CASE
  WHEN `accessLevel` = 'public' THEN 'public'
  WHEN `accessLevel` = 'request_only' THEN 'seller_approval_required'
  ELSE 'nda_required'
END;

-- 3. field_definitions.visibilityLevel
ALTER TABLE `field_definitions` ADD COLUMN `visibilityLevel` ENUM(
  'public',
  'public_preview',
  'registered_users',
  'nda_required',
  'seller_approval_required',
  'specific_buyer_only',
  'admin_only'
) NOT NULL DEFAULT 'public';

UPDATE `field_definitions` SET `visibilityLevel` = 'public';
