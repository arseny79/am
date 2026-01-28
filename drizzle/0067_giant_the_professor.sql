CREATE TABLE `kycSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`submissionType` enum('initial','business_verification','resubmission') NOT NULL DEFAULT 'initial',
	`status` enum('pending','under_review','approved','rejected','more_info_requested') NOT NULL DEFAULT 'pending',
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`reviewerNotes` text,
	`rejectionReason` text,
	`flagged` tinyint NOT NULL DEFAULT 0,
	`flagReason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `userNotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`authorId` int NOT NULL,
	`authorName` varchar(255),
	`content` text NOT NULL,
	`category` enum('general','kyc','affiliate','support','compliance','fraud') NOT NULL DEFAULT 'general',
	`isPinned` tinyint NOT NULL DEFAULT 0,
	`editedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
ALTER TABLE `kycDocuments` ADD `submissionId` int;--> statement-breakpoint
CREATE INDEX `idx_userId` ON `kycSubmissions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `kycSubmissions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_flagged` ON `kycSubmissions` (`flagged`);--> statement-breakpoint
CREATE INDEX `idx_createdAt` ON `kycSubmissions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `userNotes` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_authorId` ON `userNotes` (`authorId`);--> statement-breakpoint
CREATE INDEX `idx_category` ON `userNotes` (`category`);--> statement-breakpoint
CREATE INDEX `idx_isPinned` ON `userNotes` (`isPinned`);