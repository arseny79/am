ALTER TABLE `ndaSigningAuditLog` MODIFY COLUMN `userId` int;--> statement-breakpoint
ALTER TABLE `ndaSigningAuditLog` MODIFY COLUMN `createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP';--> statement-breakpoint
ALTER TABLE `siteSettings` MODIFY COLUMN `statGmv` varchar(50);--> statement-breakpoint
ALTER TABLE `siteSettings` MODIFY COLUMN `statActiveListings` varchar(50);--> statement-breakpoint
ALTER TABLE `buyerRequests` ADD `isAnonymous` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `ndaSigningAuditLog` ADD `ndaSigningId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `ndaSigningAuditLog` ADD `details` text;--> statement-breakpoint
ALTER TABLE `ndaSigningAuditLog` DROP COLUMN `signingId`;--> statement-breakpoint
ALTER TABLE `ndaSigningAuditLog` DROP COLUMN `metadata`;