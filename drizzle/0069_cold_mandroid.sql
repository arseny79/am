ALTER TABLE `deals` ADD `ndaExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `deals` ADD `ndaRevokedAt` timestamp;--> statement-breakpoint
ALTER TABLE `deals` ADD `ndaRevokedBy` int;--> statement-breakpoint
ALTER TABLE `deals` ADD `ndaRevocationReason` text;--> statement-breakpoint
ALTER TABLE `deals` ADD `buyerNdaConfirmed` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `deals` ADD `sellerNdaConfirmed` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `deals` ADD `buyerNdaSignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `deals` ADD `sellerNdaSignedAt` timestamp;