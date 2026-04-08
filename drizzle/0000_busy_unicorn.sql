CREATE TABLE `accessRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`buyerId` int NOT NULL,
	`companyName` varchar(255),
	`contactEmail` varchar(320) NOT NULL,
	`contactPhone` varchar(50),
	`message` text NOT NULL,
	`status` enum('pending','approved','declined','more_info_requested') NOT NULL DEFAULT 'pending',
	`sellerResponse` text,
	`respondedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accessRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `actionItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`assignedTo` enum('buyer','seller','both') NOT NULL,
	`status` enum('pending','in_progress','completed','blocked') NOT NULL DEFAULT 'pending',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`dueDate` timestamp,
	`completedAt` timestamp,
	`completedBy` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actionItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `adminAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`adminName` varchar(255),
	`adminEmail` varchar(320),
	`action` varchar(100) NOT NULL,
	`resource` varchar(100) NOT NULL,
	`resourceId` int,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','failure') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `adminAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
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
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliateTiers_id` PRIMARY KEY(`id`)
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
	`appliedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`approvedAt` timestamp,
	`lastPayoutAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `affiliates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buyerQualifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buyerRequestProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`sellerId` int NOT NULL,
	`listingId` int NOT NULL,
	`proposalMessage` text,
	`dealId` int,
	`status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`respondedAt` timestamp,
	CONSTRAINT `buyerRequestProposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `buyerRequests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`buyerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`targetRevenue` int,
	`minRevenue` int,
	`maxRevenue` int,
	`targetEbitda` int,
	`minEbitda` int,
	`maxEbitda` int,
	`preferredLocations` text,
	`requiredServiceMix` text,
	`budget` int,
	`timeline` varchar(100),
	`additionalRequirements` text,
	`status` enum('active','fulfilled','expired','withdrawn') NOT NULL DEFAULT 'active',
	`isPublic` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`expiresAt` timestamp,
	`isAnonymous` tinyint NOT NULL DEFAULT 0,
	CONSTRAINT `buyerRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `buyerVerifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dealActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`userId` int,
	`activityType` enum('deal_created','stage_changed','document_uploaded','message_sent','nda_signed','action_item_created','action_item_completed','milestone_completed','escrow_initiated','payment_received','deal_closed','deal_cancelled','note_added','offer_submitted','negotiation_update','proposal_submitted','proposal_accepted','proposal_declined') NOT NULL,
	`description` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `dealActivities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dealMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`milestoneType` enum('nda_signed','financials_reviewed','offer_submitted','loi_signed','final_agreement_signed','escrow_funded','assets_transferred') NOT NULL,
	`completedAt` timestamp,
	`completedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`expectedCompletionDate` timestamp,
	CONSTRAINT `dealMilestones_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dealProfessionals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`professionalId` int NOT NULL,
	`invitedBy` int NOT NULL,
	`invitedByRole` enum('buyer','seller') NOT NULL,
	`status` enum('invited','accepted','declined','removed') NOT NULL DEFAULT 'invited',
	`accessLevel` enum('view_only','participant','full_access') NOT NULL DEFAULT 'view_only',
	`invitationNote` text,
	`responseNote` text,
	`invitedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`respondedAt` timestamp,
	`removedAt` timestamp,
	CONSTRAINT `dealProfessionals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `deals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`stage` enum('initial_contact','nda_signed','due_diligence','negotiation','escrow','closing','closed','cancelled') NOT NULL DEFAULT 'initial_contact',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`closedAt` timestamp,
	`notes` text,
	`acceptedAskingPrice` tinyint DEFAULT 0,
	`skipNegotiation` tinyint DEFAULT 0,
	`stageSkipReason` text,
	`counterOfferRequested` tinyint DEFAULT 0,
	`counterOfferAmount` int,
	`counterOfferReason` text,
	`loiAccepted` tinyint DEFAULT 0,
	`loiAcceptedAt` timestamp,
	`escrowTransactionId` varchar(100),
	`escrowStatus` enum('not_started','created','agreed','funded','shipped','received','accepted','completed','cancelled') DEFAULT 'not_started',
	`escrowCreatedAt` timestamp,
	`escrowFundedAt` timestamp,
	`escrowCompletedAt` timestamp,
	`escrowPaymentUrl` text,
	`buyerRequestId` int,
	`ndaExpiresAt` timestamp,
	`ndaRevokedAt` timestamp,
	`ndaRevokedBy` int,
	`ndaRevocationReason` text,
	`buyerNdaConfirmed` tinyint DEFAULT 0,
	`sellerNdaConfirmed` tinyint DEFAULT 0,
	`buyerNdaSignedAt` timestamp,
	`sellerNdaSignedAt` timestamp,
	`docusign_envelope_id` varchar(255),
	`docusign_status` varchar(50),
	`docusign_buyer_status` varchar(50),
	`docusign_seller_status` varchar(50),
	`docusign_sent_at` timestamp,
	`docusign_completed_at` timestamp,
	CONSTRAINT `deals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`version` int NOT NULL DEFAULT 1,
	`isLatest` int NOT NULL DEFAULT 1,
	`category` varchar(100),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`sourceListingDocumentId` int,
	`signatureStatus` enum('none','pending','signed','declined','voided') NOT NULL DEFAULT 'none',
	`docusignEnvelopeId` varchar(255),
	`signers` text,
	`signedAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dueDiligenceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`category` enum('financial','legal','technical','operational','clients','employees','contracts') NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`description` text,
	`required` tinyint NOT NULL DEFAULT 0,
	`priority` enum('low','medium','high','critical') NOT NULL DEFAULT 'medium',
	`status` enum('pending','requested','in_progress','completed','waived') NOT NULL DEFAULT 'pending',
	`requestedBy` int,
	`assignedTo` int,
	`completedAt` timestamp,
	`completedBy` int,
	`documentIds` text,
	`dueDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
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
	`askedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`answeredAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `dueDiligenceQuestions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kycDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`submissionId` int,
	`documentType` enum('government_id','business_license','proof_of_ownership','proof_of_address','financial_statement','other') NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`reviewStatus` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`reviewedAt` timestamp,
	`reviewedBy` int,
	`reviewNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kycDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
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
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kycSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listingDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`uploadedBy` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`accessLevel` enum('public','nda_gated','request_only') NOT NULL DEFAULT 'nda_gated',
	`category` varchar(100),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listingDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listingPreparationItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`category` enum('financial','clients','technical','operational','legal') NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`description` text,
	`required` tinyint NOT NULL DEFAULT 0,
	`recommended` tinyint NOT NULL DEFAULT 0,
	`completed` tinyint NOT NULL DEFAULT 0,
	`completedAt` timestamp,
	`documentId` int,
	`templateFileName` varchar(255),
	`hasTemplate` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`documentUrl` text,
	`documentFileName` varchar(255),
	CONSTRAINT `listingPreparationItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listingViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`viewerId` int,
	`viewedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`ipAddress` varchar(45),
	CONSTRAINT `listingViews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`brokerId` int,
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
	`primaryRmm` varchar(100),
	`primaryPsa` varchar(100),
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
	`isPublished` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`confidentialityLevel` enum('public','nda','private') NOT NULL DEFAULT 'public',
	`isAnonymous` tinyint NOT NULL DEFAULT 0,
	`ndaTemplateUrl` text,
	`primaryServiceCategory` enum('managed_security','cloud_services','infrastructure_management','help_desk_support','backup_disaster_recovery','application_management','consulting_strategy','telecommunications'),
	`industryVertical` enum('healthcare','financial_services','legal','education','manufacturing','professional_services','retail_ecommerce','nonprofit','government','general_smb'),
	`listingTier` enum('standard','featured','premium') NOT NULL DEFAULT 'standard',
	`paymentStatus` enum('pending','paid','refunded') NOT NULL DEFAULT 'pending',
	`stripeSessionId` varchar(255),
	`stripePaymentIntentId` varchar(255),
	`paidAt` timestamp,
	`valuationInputs` json,
	`valuationOutputs` json,
	`sellerDesiredPrice` int,
	`valuationCompletedAt` timestamp,
	`logoUrl` text,
	`tier` enum('free','featured','premium_featured') NOT NULL DEFAULT 'free',
	`thumbnailUrl` text,
	`featuredUntil` timestamp,
	CONSTRAINT `listings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`senderId` int NOT NULL,
	`content` text NOT NULL,
	`isRead` tinyint NOT NULL DEFAULT 0,
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`dealId` int NOT NULL,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ndaSigningAuditLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ndaSigningId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`userId` int,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`createdAt` timestamp DEFAULT 'CURRENT_TIMESTAMP',
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
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`buyerSignature` text,
	`sellerSignature` text,
	`buyerSignatureType` varchar(50),
	`sellerSignatureType` varchar(50),
	`variableValues` text,
	`customNdaUrl` varchar(500),
	`customNdaFileName` varchar(255),
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
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
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
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `ndaVariableDefinitions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ndas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`buyerId` int NOT NULL,
	`signedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`ipAddress` varchar(45),
	`status` enum('active','expired','revoked') NOT NULL DEFAULT 'active',
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`ndaType` enum('clickwrap','pdf_upload') NOT NULL DEFAULT 'clickwrap',
	`uploadedPdfUrl` text,
	CONSTRAINT `ndas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`relatedEntityType` varchar(50),
	`relatedEntityId` int,
	`isRead` int NOT NULL DEFAULT 0,
	`emailSent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offerHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`offeredBy` int NOT NULL,
	`offerType` enum('initial_asking_price','buyer_counter_offer','seller_counter_offer','final_accepted_offer') NOT NULL,
	`amount` int NOT NULL,
	`reason` text,
	`status` enum('pending','accepted','rejected','superseded','expired') NOT NULL DEFAULT 'pending',
	`respondedBy` int,
	`respondedAt` timestamp,
	`responseNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`expiresAt` timestamp,
	CONSTRAINT `offerHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `platformDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`isPublished` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `platformDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pricePlans` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tier` enum('free','featured','premium_featured') NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`price` int NOT NULL,
	`billingPeriod` enum('one_time','weekly','monthly','annual') NOT NULL DEFAULT 'weekly',
	`features` json NOT NULL,
	`stripeProductId` varchar(255),
	`stripePriceId` varchar(255),
	`displayOrder` int NOT NULL DEFAULT 0,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`isFeatured` tinyint NOT NULL DEFAULT 0,
	`allowsThumbnail` tinyint NOT NULL DEFAULT 0,
	`carouselPlacement` tinyint NOT NULL DEFAULT 0,
	`prioritySupport` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`successFeePercentage` int NOT NULL DEFAULT 300,
	CONSTRAINT `pricePlans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professionalCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professionalId` int NOT NULL,
	`credentialType` enum('license','certification','degree','insurance','other') NOT NULL,
	`title` varchar(255) NOT NULL,
	`issuingOrganization` varchar(255),
	`issueDate` timestamp,
	`expiryDate` timestamp,
	`credentialNumber` varchar(100),
	`fileUrl` varchar(500) NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileSize` int,
	`mimeType` varchar(100),
	`verificationStatus` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
	`verifiedAt` timestamp,
	`verifiedBy` int,
	`rejectionReason` text,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professionalCredentials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professionalReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`professionalId` int NOT NULL,
	`reviewerId` int NOT NULL,
	`dealId` int,
	`rating` int NOT NULL,
	`review` text,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `professionalReviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `professionals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`companyName` varchar(255),
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`website` varchar(500),
	`type` enum('broker','lawyer','accountant','due_diligence','valuation','consultant','other') NOT NULL,
	`profilePhotoUrl` varchar(500),
	`specialties` json,
	`bio` text,
	`yearsExperience` int,
	`dealsCompleted` int,
	`location` varchar(255),
	`serviceAreas` json,
	`feeStructure` text,
	`tier` enum('basic','professional','premium') NOT NULL DEFAULT 'basic',
	`tierExpiresAt` timestamp,
	`stripeSubscriptionId` varchar(255),
	`verified` tinyint NOT NULL DEFAULT 0,
	`verifiedAt` timestamp,
	`status` enum('pending','active','suspended','rejected') NOT NULL DEFAULT 'pending',
	`profileViews` int NOT NULL DEFAULT 0,
	`dealInvitations` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professionals_id` PRIMARY KEY(`id`)
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
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `referrals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`listingId` int NOT NULL,
	`savedAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	CONSTRAINT `savedListings_id` PRIMARY KEY(`id`)
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
	`emailAlerts` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedSearches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`googleAnalyticsId` varchar(50),
	`statcounterId` varchar(50),
	`statcounterSecurity` varchar(50),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	`seoTitle` varchar(200),
	`seoDescription` text,
	`ogTitle` varchar(200),
	`ogDescription` text,
	`ogImage` varchar(500),
	`logoUrl` text,
	`heroHeadline` text,
	`heroSubheadline` text,
	`heroDescription` text,
	`heroPrimaryButtonText` varchar(100),
	`heroPrimaryButtonUrl` varchar(500),
	`heroSecondaryButtonText` varchar(100),
	`heroSecondaryButtonUrl` varchar(500),
	`statGmv` varchar(50),
	`statActiveListings` varchar(50),
	`statEscrowProtected` varchar(100),
	`valuationDataSources` text,
	`valuationDisclaimer` text,
	`valuationToolHeading` text,
	`valuationToolSubheading` text,
	`marketplaceHeading` text,
	`marketplaceSubheading` text,
	`buyAssetHeading` text,
	`buyAssetSubheading` text,
	`statGmvLabel` varchar(100),
	`statActiveListingsLabel` varchar(100),
	`statEscrowProtectedLabel` varchar(100),
	`docusign_integration_key` varchar(255),
	`docusign_user_id` varchar(255),
	`docusign_account_id` varchar(255),
	`docusign_environment` varchar(50) DEFAULT 'sandbox',
	`docusign_rsa_private_key` text,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`)
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
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userNotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64),
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT 'CURRENT_TIMESTAMP',
	`companyName` varchar(255),
	`companyWebsite` varchar(255),
	`phoneNumber` varchar(50),
	`location` varchar(255),
	`bio` text,
	`profilePhotoUrl` varchar(500),
	`tosAcceptedAt` timestamp,
	`privacyPolicyAcceptedAt` timestamp,
	`stripeIdentitySessionId` varchar(255),
	`passwordHash` varchar(255),
	`emailVerified` tinyint DEFAULT 0,
	`emailVerificationToken` varchar(64),
	`emailVerificationTokenExpiry` timestamp,
	`passwordResetToken` varchar(64),
	`passwordResetTokenExpiry` timestamp,
	`kycStatus` enum('unverified','pending','verified','rejected') NOT NULL DEFAULT 'unverified',
	`kycMethod` enum('none','manual','stripe_identity') DEFAULT 'none',
	`kycSubmittedAt` timestamp,
	`kycReviewedAt` timestamp,
	`kycReviewedBy` int,
	`kycRejectionReason` text,
	`stripeIdentityVerificationId` varchar(255),
	`kycVerified` tinyint NOT NULL DEFAULT 0,
	`verificationStatus` enum('unverified','payment_pending','identity_pending','funds_pending','review_pending','verified','rejected') NOT NULL DEFAULT 'unverified',
	`verificationTier` enum('none','basic','verified','premium') NOT NULL DEFAULT 'none',
	`verifiedAt` timestamp,
	`verificationExpiresAt` timestamp,
	`plaidAccessToken` varchar(255),
	`fundsVerifiedAmount` int,
	`stripeIdentityVerified` tinyint NOT NULL DEFAULT 0,
	`stripeIdentityVerifiedAt` timestamp,
	`stripeIdentityPaymentIntentId` varchar(255),
	`stripeIdentityAmountPaid` int,
	`lastReminderSentAt` timestamp,
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `adminAuditLogs_adminId` ON `adminAuditLogs` (`adminId`);--> statement-breakpoint
CREATE INDEX `adminAuditLogs_action` ON `adminAuditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `adminAuditLogs_resource` ON `adminAuditLogs` (`resource`);--> statement-breakpoint
CREATE INDEX `adminAuditLogs_createdAt` ON `adminAuditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `level` ON `affiliateTiers` (`level`);--> statement-breakpoint
CREATE INDEX `userId` ON `affiliates` (`userId`);--> statement-breakpoint
CREATE INDEX `referralCode` ON `affiliates` (`referralCode`);--> statement-breakpoint
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
CREATE INDEX `brokers_status_idx` ON `brokers` (`status`);--> statement-breakpoint
CREATE INDEX `userId` ON `buyerQualifications` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `kycSubmissions` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_status` ON `kycSubmissions` (`status`);--> statement-breakpoint
CREATE INDEX `idx_flagged` ON `kycSubmissions` (`flagged`);--> statement-breakpoint
CREATE INDEX `idx_createdAt` ON `kycSubmissions` (`createdAt`);--> statement-breakpoint
CREATE INDEX `platformDocuments_slug_unique` ON `platformDocuments` (`slug`);--> statement-breakpoint
CREATE INDEX `pricePlans_tier_unique` ON `pricePlans` (`tier`);--> statement-breakpoint
CREATE INDEX `referredUserId` ON `referrals` (`referredUserId`);--> statement-breakpoint
CREATE INDEX `idx_userId` ON `userNotes` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_authorId` ON `userNotes` (`authorId`);--> statement-breakpoint
CREATE INDEX `idx_category` ON `userNotes` (`category`);--> statement-breakpoint
CREATE INDEX `idx_isPinned` ON `userNotes` (`isPinned`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
CREATE INDEX `users_email_unique` ON `users` (`email`);