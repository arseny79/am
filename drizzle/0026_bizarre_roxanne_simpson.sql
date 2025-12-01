CREATE TABLE `buyerVerifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`amountPaid` int,
	`paidAt` timestamp,
	`identitySessionId` varchar(255),
	`identityStatus` enum('not_started','pending','verified','failed') NOT NULL DEFAULT 'not_started',
	`identityVerifiedAt` timestamp,
	`identityDocumentType` varchar(50),
	`identityDocumentNumber` varchar(100),
	`identityFullName` varchar(255),
	`identityDateOfBirth` varchar(20),
	`identityAddress` text,
	`plaidLinkToken` varchar(255),
	`plaidAccessToken` varchar(255),
	`plaidItemId` varchar(255),
	`bankStatus` enum('not_started','pending','verified','failed') NOT NULL DEFAULT 'not_started',
	`bankVerifiedAt` timestamp,
	`bankName` varchar(255),
	`bankAccountMask` varchar(10),
	`verifiedBalance` int,
	`reviewStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`reviewNotes` text,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buyerVerifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `verificationStatus` enum('unverified','payment_pending','identity_pending','funds_pending','review_pending','verified','rejected') DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationTier` enum('none','basic','verified','premium') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verifiedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeIdentitySessionId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `plaidAccessToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `fundsVerifiedAmount` int;