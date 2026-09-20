-- Phase 3: remaining homepage copy fields
ALTER TABLE `siteSettings`
  ADD COLUMN `activeOpportunitiesViewListingBtn` varchar(100) NULL AFTER `activeOpportunitiesGhostCardsJson`,
  ADD COLUMN `activeOpportunitiesViewAllBtnText` varchar(200) NULL AFTER `activeOpportunitiesViewListingBtn`,
  ADD COLUMN `activeOpportunitiesFilterAllLabel` varchar(50) NULL AFTER `activeOpportunitiesViewAllBtnText`,
  ADD COLUMN `footerCopyrightText` varchar(200) NULL AFTER `footerLinksJson`;
