CREATE TABLE `ndaSigningAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`signingId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `ndaSigningAuditLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ndaSignings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`templateId` int NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`signedByBuyer` tinyint NOT NULL DEFAULT 0,
	`signedBySeller` tinyint NOT NULL DEFAULT 0,
	`buyerSignedAt` timestamp,
	`sellerSignedAt` timestamp,
	`buyerIpAddress` varchar(45),
	`sellerIpAddress` varchar(45),
	`renderedContent` text NOT NULL,
	`status` enum('pending','partially_signed','fully_signed','expired','revoked') NOT NULL DEFAULT 'pending',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ndaSignings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ndaTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isDefault` tinyint NOT NULL DEFAULT 0,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`content` text NOT NULL,
	`fileUrl` varchar(500),
	`fileName` varchar(255),
	`fileMimeType` varchar(100),
	`createdBy` int NOT NULL,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ndaTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ndaVariableDefinitions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`variableName` varchar(100) NOT NULL,
	`displayName` varchar(255) NOT NULL,
	`type` enum('text','date','email','number','company') NOT NULL,
	`required` tinyint NOT NULL DEFAULT 0,
	`defaultValue` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `ndaVariableDefinitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `affiliateTiers` DROP INDEX `affiliateTiers_level_unique`;--> statement-breakpoint
ALTER TABLE `affiliates` DROP INDEX `affiliates_userId_unique`;--> statement-breakpoint
ALTER TABLE `affiliates` DROP INDEX `affiliates_referralCode_unique`;--> statement-breakpoint
ALTER TABLE `buyerQualifications` DROP INDEX `buyerQualifications_userId_unique`;--> statement-breakpoint
ALTER TABLE `platformDocuments` DROP INDEX `platformDocuments_slug_unique`;--> statement-breakpoint
ALTER TABLE `pricePlans` DROP INDEX `pricePlans_tier_unique`;--> statement-breakpoint
ALTER TABLE `referrals` DROP INDEX `referrals_referredUserId_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_openId_unique`;--> statement-breakpoint
ALTER TABLE `users` DROP INDEX `users_email_unique`;--> statement-breakpoint
ALTER TABLE `accessRequests` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `actionItems` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `affiliateCommissions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `affiliateTiers` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `affiliates` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `buyerQualifications` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `buyerRequestProposals` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `buyerRequests` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `buyerVerifications` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `dealActivities` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `dealMilestones` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `dealProfessionals` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `deals` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `documents` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `dueDiligenceItems` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `dueDiligenceQuestions` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `kycDocuments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `listingDocuments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `listingViews` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `listings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `messages` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `ndas` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `notifications` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `offerHistory` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `platformDocuments` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `pricePlans` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `professionalCredentials` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `professionalReviews` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `professionals` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `referrals` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `savedListings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `savedSearches` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `siteSettings` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `users` DROP PRIMARY KEY;--> statement-breakpoint
ALTER TABLE `accessRequests` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `actionItems` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `affiliateCommissions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `affiliateTiers` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `affiliateTiers` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `appliedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `affiliates` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `buyerQualifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `buyerRequestProposals` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `buyerRequests` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `buyerVerifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `dealActivities` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `dealMilestones` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `dealProfessionals` MODIFY COLUMN `invitedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `acceptedAskingPrice` tinyint;--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `acceptedAskingPrice` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `skipNegotiation` tinyint;--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `skipNegotiation` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `counterOfferRequested` tinyint;--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `counterOfferRequested` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `loiAccepted` tinyint;--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `loiAccepted` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `deals` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `documents` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `dueDiligenceItems` MODIFY COLUMN `required` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `dueDiligenceItems` MODIFY COLUMN `required` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `dueDiligenceItems` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `dueDiligenceQuestions` MODIFY COLUMN `askedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `dueDiligenceQuestions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `kycDocuments` MODIFY COLUMN `documentType` enum('government_id','business_license','proof_of_ownership','proof_of_address','financial_statement','other') NOT NULL;--> statement-breakpoint
ALTER TABLE `kycDocuments` MODIFY COLUMN `fileUrl` text NOT NULL;--> statement-breakpoint
ALTER TABLE `listingDocuments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` MODIFY COLUMN `required` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` MODIFY COLUMN `required` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` MODIFY COLUMN `recommended` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` MODIFY COLUMN `recommended` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` MODIFY COLUMN `completed` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` MODIFY COLUMN `completed` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` MODIFY COLUMN `hasTemplate` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` MODIFY COLUMN `hasTemplate` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `listingViews` MODIFY COLUMN `viewedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `listings` MODIFY COLUMN `isAnonymous` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` MODIFY COLUMN `isAnonymous` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `listings` MODIFY COLUMN `isPublished` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` MODIFY COLUMN `isPublished` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `listings` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `isRead` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `isRead` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `messages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `ndas` MODIFY COLUMN `signedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `ndas` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `notifications` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `offerHistory` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `platformDocuments` MODIFY COLUMN `isPublished` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `platformDocuments` MODIFY COLUMN `isPublished` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `platformDocuments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `pricePlans` MODIFY COLUMN `isActive` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `pricePlans` MODIFY COLUMN `isFeatured` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `pricePlans` MODIFY COLUMN `isFeatured` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `pricePlans` MODIFY COLUMN `allowsThumbnail` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `pricePlans` MODIFY COLUMN `allowsThumbnail` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `pricePlans` MODIFY COLUMN `carouselPlacement` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `pricePlans` MODIFY COLUMN `carouselPlacement` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `pricePlans` MODIFY COLUMN `prioritySupport` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `pricePlans` MODIFY COLUMN `prioritySupport` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `pricePlans` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `professionalCredentials` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `professionalReviews` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `professionals` MODIFY COLUMN `verified` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `professionals` MODIFY COLUMN `verified` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `professionals` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `referrals` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `savedListings` MODIFY COLUMN `savedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `savedSearches` MODIFY COLUMN `emailAlerts` tinyint NOT NULL DEFAULT 1;--> statement-breakpoint
ALTER TABLE `savedSearches` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `emailVerified` tinyint;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `emailVerified` tinyint DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `kycVerified` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `kycVerified` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `stripeIdentityVerified` tinyint NOT NULL;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `stripeIdentityVerified` tinyint NOT NULL DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `kycDocuments` ADD `createdAt` timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE `kycDocuments` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` ADD `documentUrl` text;--> statement-breakpoint
ALTER TABLE `listingPreparationItems` ADD `documentFileName` varchar(255);--> statement-breakpoint
ALTER TABLE `listings` ADD `primaryRmm` varchar(100);--> statement-breakpoint
ALTER TABLE `listings` ADD `primaryPsa` varchar(100);--> statement-breakpoint
ALTER TABLE `users` ADD `kycStatus` enum('unverified','pending','verified','rejected') DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `kycMethod` enum('none','manual','stripe_identity') DEFAULT 'none';--> statement-breakpoint
ALTER TABLE `users` ADD `kycReviewedBy` int;--> statement-breakpoint
ALTER TABLE `users` ADD `stripeIdentityVerificationId` varchar(255);--> statement-breakpoint
CREATE INDEX `level` ON `affiliateTiers` (`level`);--> statement-breakpoint
CREATE INDEX `userId` ON `affiliates` (`userId`);--> statement-breakpoint
CREATE INDEX `referralCode` ON `affiliates` (`referralCode`);--> statement-breakpoint
CREATE INDEX `userId` ON `buyerQualifications` (`userId`);--> statement-breakpoint
CREATE INDEX `platformDocuments_slug_unique` ON `platformDocuments` (`slug`);--> statement-breakpoint
CREATE INDEX `pricePlans_tier_unique` ON `pricePlans` (`tier`);--> statement-breakpoint
CREATE INDEX `referredUserId` ON `referrals` (`referredUserId`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
ALTER TABLE `kycDocuments` DROP COLUMN `uploadedAt`;--> statement-breakpoint
ALTER TABLE `listings` DROP COLUMN `primaryRMM`;--> statement-breakpoint
ALTER TABLE `listings` DROP COLUMN `primaryPSA`;