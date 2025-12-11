CREATE TABLE `kycDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`documentType` enum('government_id','proof_of_address') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`reviewStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`reviewNotes` text,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kycDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `kycVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `kycSubmittedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `kycReviewedAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `kycRejectionReason` text;