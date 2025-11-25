CREATE TABLE `buyerRequestProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requestId` int NOT NULL,
	`sellerId` int NOT NULL,
	`listingId` int NOT NULL,
	`proposalMessage` text,
	`dealId` int,
	`status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	CONSTRAINT `buyerRequestProposals_id` PRIMARY KEY(`id`)
);
