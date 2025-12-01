CREATE TABLE `dealMilestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`milestoneType` enum('nda_signed','financials_reviewed','offer_submitted','loi_signed','final_agreement_signed','escrow_funded','assets_transferred') NOT NULL,
	`completedAt` timestamp,
	`completedBy` int,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dealMilestones_id` PRIMARY KEY(`id`)
);
