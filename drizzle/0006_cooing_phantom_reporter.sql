ALTER TABLE `listings` MODIFY COLUMN `isAnonymous` boolean NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` MODIFY COLUMN `isAnonymous` boolean NOT NULL DEFAULT false;