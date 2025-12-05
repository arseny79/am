ALTER TABLE `listings` ADD `tier` enum('free','featured','premium_featured') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `thumbnailUrl` text;--> statement-breakpoint
ALTER TABLE `listings` ADD `featuredUntil` timestamp;