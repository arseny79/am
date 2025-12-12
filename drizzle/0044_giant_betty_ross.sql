CREATE TABLE `listingPreparationItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`category` enum('financial','clients','technical','operational','legal') NOT NULL,
	`itemName` varchar(255) NOT NULL,
	`description` text,
	`required` boolean NOT NULL DEFAULT false,
	`recommended` boolean NOT NULL DEFAULT false,
	`completed` boolean NOT NULL DEFAULT false,
	`completedAt` timestamp,
	`documentId` int,
	`templateFileName` varchar(255),
	`hasTemplate` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listingPreparationItems_id` PRIMARY KEY(`id`)
);
