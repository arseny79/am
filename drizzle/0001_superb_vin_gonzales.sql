ALTER TABLE `listings` ADD `stripeSubscriptionId` varchar(255);--> statement-breakpoint
ALTER TABLE `listings` ADD `subscriptionStatus` enum('none','active','past_due','canceled','unpaid') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `subscriptionCurrentPeriodEnd` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeCustomerId` varchar(255);