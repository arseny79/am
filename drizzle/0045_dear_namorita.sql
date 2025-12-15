CREATE TABLE `buyerQualifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`verificationLevel` enum('basic','verified','premium') NOT NULL DEFAULT 'basic',
	`proofOfFundsUrl` varchar(500),
	`proofOfFundsAmount` int,
	`proofOfFundsType` enum('bank_statement','credit_line','investor_letter','other'),
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`verificationNotes` text,
	`status` enum('pending','approved','rejected','expired') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buyerQualifications_id` PRIMARY KEY(`id`),
	CONSTRAINT `buyerQualifications_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `dueDiligenceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`category` enum('financial','legal','technical','operational','clients','employees','contracts') NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`description` text,
	`required` boolean NOT NULL DEFAULT false,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('pending','requested','in_progress','completed','waived') NOT NULL DEFAULT 'pending',
	`requestedBy` int,
	`assignedTo` int,
	`completedAt` timestamp,
	`completedBy` int,
	`documentIds` text,
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dueDiligenceItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dueDiligenceQuestions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`itemId` int NOT NULL,
	`question` text NOT NULL,
	`answer` text,
	`askedBy` int NOT NULL,
	`answeredBy` int,
	`status` enum('open','answered','resolved') NOT NULL DEFAULT 'open',
	`askedAt` timestamp NOT NULL DEFAULT (now()),
	`answeredAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dueDiligenceQuestions_id` PRIMARY KEY(`id`)
);
