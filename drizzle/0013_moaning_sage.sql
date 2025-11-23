ALTER TABLE `listings` ADD `valuationInputs` json;--> statement-breakpoint
ALTER TABLE `listings` ADD `valuationOutputs` json;--> statement-breakpoint
ALTER TABLE `listings` ADD `sellerDesiredPrice` int;--> statement-breakpoint
ALTER TABLE `listings` ADD `valuationCompletedAt` timestamp;