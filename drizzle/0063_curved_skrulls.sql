ALTER TABLE `siteSettings` MODIFY COLUMN `statGmv` varchar(100);--> statement-breakpoint
ALTER TABLE `siteSettings` MODIFY COLUMN `statActiveListings` varchar(100);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `statGmvLabel` varchar(100);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `statActiveListingsLabel` varchar(100);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `statEscrowProtectedLabel` varchar(100);