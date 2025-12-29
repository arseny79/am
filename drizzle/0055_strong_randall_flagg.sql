ALTER TABLE `users` ADD `stripeIdentityVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeIdentityVerifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeIdentityPaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeIdentityAmountPaid` int;