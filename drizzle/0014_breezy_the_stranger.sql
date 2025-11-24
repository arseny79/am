ALTER TABLE `messages` ADD `dealId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `listingId`;--> statement-breakpoint
ALTER TABLE `messages` DROP COLUMN `receiverId`;