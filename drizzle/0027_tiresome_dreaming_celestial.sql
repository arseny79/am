ALTER TABLE `deals` ADD `acceptedAskingPrice` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `deals` ADD `skipNegotiation` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `deals` ADD `stageSkipReason` text;