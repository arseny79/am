CREATE TABLE `affiliateCommissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`referralId` int NOT NULL,
	`dealId` int NOT NULL,
	`dealAmount` int NOT NULL,
	`platformFee` int NOT NULL,
	`commissionPercent` decimal(5,2) NOT NULL,
	`commissionAmount` int NOT NULL,
	`status` enum('pending','approved','paid','cancelled') NOT NULL DEFAULT 'pending',
	`approvedAt` timestamp,
	`approvedBy` int,
	`paidAt` timestamp,
	`paymentReference` varchar(255),
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliateCommissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `affiliateTiers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`level` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`commissionPercent` decimal(5,2) NOT NULL,
	`minReferrals` int NOT NULL DEFAULT 0,
	`minEarnings` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliateTiers_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliateTiers_level_unique` UNIQUE(`level`)
);
--> statement-breakpoint
CREATE TABLE `affiliates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`referralCode` varchar(20) NOT NULL,
	`tierId` int NOT NULL,
	`status` enum('pending','active','suspended','rejected') NOT NULL DEFAULT 'pending',
	`totalReferrals` int NOT NULL DEFAULT 0,
	`successfulReferrals` int NOT NULL DEFAULT 0,
	`totalEarnings` int NOT NULL DEFAULT 0,
	`pendingEarnings` int NOT NULL DEFAULT 0,
	`paidEarnings` int NOT NULL DEFAULT 0,
	`paypalEmail` varchar(320),
	`bankDetails` text,
	`adminNotes` text,
	`rejectionReason` text,
	`appliedAt` timestamp NOT NULL DEFAULT (now()),
	`approvedAt` timestamp,
	`lastPayoutAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`),
	CONSTRAINT `affiliates_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `affiliates_referralCode_unique` UNIQUE(`referralCode`)
);
--> statement-breakpoint
CREATE TABLE `referrals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`affiliateId` int NOT NULL,
	`referredUserId` int NOT NULL,
	`referralCode` varchar(20) NOT NULL,
	`status` enum('registered','qualified','converted','expired') NOT NULL DEFAULT 'registered',
	`qualifiedAt` timestamp,
	`convertedAt` timestamp,
	`convertedDealId` int,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`),
	CONSTRAINT `referrals_referredUserId_unique` UNIQUE(`referredUserId`)
);
