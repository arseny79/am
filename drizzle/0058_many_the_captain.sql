CREATE TABLE `brokerApplications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`companyWebsite` varchar(500),
	`licenseNumber` varchar(100),
	`licenseState` varchar(100),
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(50),
	`yearsExperience` int,
	`previousDealsCount` int,
	`previousDealVolume` int,
	`specializations` text,
	`applicationMessage` text NOT NULL,
	`resumeUrl` varchar(500),
	`licenseDocumentUrl` varchar(500),
	`referenceLetterUrl` varchar(500),
	`status` enum('pending','under_review','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`reviewNotes` text,
	`rejectionReason` text,
	`brokerId` int,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brokerApplications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brokerCommissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brokerId` int NOT NULL,
	`listingId` int NOT NULL,
	`dealId` int NOT NULL,
	`dealAmount` int NOT NULL,
	`platformFee` int NOT NULL,
	`brokerShare` int NOT NULL,
	`platformShare` int NOT NULL,
	`status` enum('pending','approved','paid','cancelled') NOT NULL DEFAULT 'pending',
	`approvedAt` timestamp,
	`approvedBy` int,
	`paidAt` timestamp,
	`paymentReference` varchar(255),
	`paymentMethod` varchar(50),
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brokerCommissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brokerContracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brokerId` int NOT NULL,
	`listingId` int NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`clientEmail` varchar(320) NOT NULL,
	`clientPhone` varchar(50),
	`clientCompanyName` varchar(255) NOT NULL,
	`contractType` enum('exclusive','non_exclusive') NOT NULL DEFAULT 'exclusive',
	`contractStartDate` timestamp NOT NULL,
	`contractEndDate` timestamp NOT NULL,
	`clientCommissionRate` decimal(5,2),
	`contractDocumentUrl` varchar(500) NOT NULL,
	`contractFileName` varchar(255) NOT NULL,
	`contractFileSize` int,
	`isVerified` tinyint NOT NULL DEFAULT 0,
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`verificationNotes` text,
	`status` enum('active','expired','terminated','pending_verification') NOT NULL DEFAULT 'pending_verification',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brokerContracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brokerListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brokerId` int NOT NULL,
	`listingId` int NOT NULL,
	`contractId` int NOT NULL,
	`status` enum('active','sold','withdrawn','expired') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brokerListings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brokerPayouts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`brokerId` int NOT NULL,
	`amount` int NOT NULL,
	`payoutMethod` enum('bank_transfer','paypal','check') NOT NULL,
	`status` enum('pending','processing','completed','failed') NOT NULL DEFAULT 'pending',
	`paymentReference` varchar(255),
	`paymentDate` timestamp,
	`failureReason` text,
	`processedBy` int,
	`processedAt` timestamp,
	`adminNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brokerPayouts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `brokers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`companyWebsite` varchar(500),
	`licenseNumber` varchar(100),
	`licenseState` varchar(100),
	`contactName` varchar(255) NOT NULL,
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(50),
	`yearsExperience` int,
	`totalDealsCompleted` int DEFAULT 0,
	`totalDealVolume` int DEFAULT 0,
	`specializations` text,
	`status` enum('pending','approved','suspended','rejected') NOT NULL DEFAULT 'pending',
	`approvedAt` timestamp,
	`approvedBy` int,
	`rejectionReason` text,
	`suspensionReason` text,
	`commissionRate` decimal(5,2) NOT NULL DEFAULT '50.00',
	`totalEarnings` int NOT NULL DEFAULT 0,
	`pendingEarnings` int NOT NULL DEFAULT 0,
	`paidEarnings` int NOT NULL DEFAULT 0,
	`payoutMethod` enum('bank_transfer','paypal','check') DEFAULT 'bank_transfer',
	`paypalEmail` varchar(320),
	`bankAccountName` varchar(255),
	`bankAccountNumber` varchar(50),
	`bankRoutingNumber` varchar(50),
	`bankName` varchar(255),
	`bio` text,
	`profilePhotoUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `brokers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `brokerApplications_userId_idx` ON `brokerApplications` (`userId`);--> statement-breakpoint
CREATE INDEX `brokerApplications_status_idx` ON `brokerApplications` (`status`);--> statement-breakpoint
CREATE INDEX `brokerCommissions_brokerId_idx` ON `brokerCommissions` (`brokerId`);--> statement-breakpoint
CREATE INDEX `brokerCommissions_dealId_idx` ON `brokerCommissions` (`dealId`);--> statement-breakpoint
CREATE INDEX `brokerCommissions_status_idx` ON `brokerCommissions` (`status`);--> statement-breakpoint
CREATE INDEX `brokerContracts_brokerId_idx` ON `brokerContracts` (`brokerId`);--> statement-breakpoint
CREATE INDEX `brokerContracts_listingId_idx` ON `brokerContracts` (`listingId`);--> statement-breakpoint
CREATE INDEX `brokerListings_brokerId_idx` ON `brokerListings` (`brokerId`);--> statement-breakpoint
CREATE INDEX `brokerListings_listingId_idx` ON `brokerListings` (`listingId`);--> statement-breakpoint
CREATE INDEX `brokerPayouts_brokerId_idx` ON `brokerPayouts` (`brokerId`);--> statement-breakpoint
CREATE INDEX `brokerPayouts_status_idx` ON `brokerPayouts` (`status`);--> statement-breakpoint
CREATE INDEX `brokers_userId_idx` ON `brokers` (`userId`);--> statement-breakpoint
CREATE INDEX `brokers_status_idx` ON `brokers` (`status`);