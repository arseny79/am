ALTER TABLE `deals` ADD `escrowTransactionId` varchar(100);--> statement-breakpoint
ALTER TABLE `deals` ADD `escrowStatus` enum('not_started','created','agreed','funded','shipped','received','accepted','completed','cancelled') DEFAULT 'not_started';--> statement-breakpoint
ALTER TABLE `deals` ADD `escrowCreatedAt` timestamp;--> statement-breakpoint
ALTER TABLE `deals` ADD `escrowFundedAt` timestamp;--> statement-breakpoint
ALTER TABLE `deals` ADD `escrowCompletedAt` timestamp;--> statement-breakpoint
ALTER TABLE `deals` ADD `escrowPaymentUrl` text;