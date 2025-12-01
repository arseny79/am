ALTER TABLE `deals` ADD `counterOfferRequested` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `deals` ADD `counterOfferAmount` int;--> statement-breakpoint
ALTER TABLE `deals` ADD `counterOfferReason` text;--> statement-breakpoint
ALTER TABLE `deals` ADD `loiAccepted` boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE `deals` ADD `loiAcceptedAt` timestamp;