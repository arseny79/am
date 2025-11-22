ALTER TABLE `listings` ADD `paymentStatus` enum('pending','paid','refunded') DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `stripeSessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `listings` ADD `stripePaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `listings` ADD `paidAt` timestamp;