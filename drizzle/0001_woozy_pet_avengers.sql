ALTER TABLE `deals` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `documents` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `listings` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `messages` ADD `deletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `deletedAt` timestamp;