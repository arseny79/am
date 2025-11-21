CREATE TABLE `listingViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`viewerId` int,
	`viewedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	CONSTRAINT `listingViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`businessName` varchar(255) NOT NULL,
	`location` varchar(255) NOT NULL,
	`yearFounded` int,
	`employeeCount` int,
	`monthlyRecurringRevenue` int NOT NULL,
	`annualRevenue` int NOT NULL,
	`ebitda` int NOT NULL,
	`ebitdaMargin` int,
	`clientCount` int NOT NULL,
	`averageClientValue` int,
	`clientRetentionRate` int,
	`serviceMix` text,
	`primaryRMM` varchar(100),
	`primaryPSA` varchar(100),
	`otherTools` text,
	`askingPrice` int,
	`estimatedValuation` int,
	`valuationMultiple` int,
	`description` text NOT NULL,
	`keyStrengths` text,
	`growthOpportunities` text,
	`clientList` text,
	`financialDetails` text,
	`status` enum('draft','active','under_negotiation','sold','withdrawn') NOT NULL DEFAULT 'draft',
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`senderId` int NOT NULL,
	`receiverId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ndas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`buyerId` int NOT NULL,
	`signedAt` timestamp NOT NULL DEFAULT (now()),
	`ipAddress` varchar(45),
	`status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ndas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedSearches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`minRevenue` int,
	`maxRevenue` int,
	`minEbitda` int,
	`maxEbitda` int,
	`locations` text,
	`emailAlerts` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userType` enum('buyer','seller','both') DEFAULT 'buyer' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `companyName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `companyWebsite` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `phoneNumber` varchar(50);--> statement-breakpoint
ALTER TABLE `users` ADD `location` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;