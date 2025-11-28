CREATE TABLE `platformDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(100) NOT NULL,
	`title` varchar(200) NOT NULL,
	`content` text NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`isPublished` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `platformDocuments_id` PRIMARY KEY(`id`),
	CONSTRAINT `platformDocuments_slug_unique` UNIQUE(`slug`)
);
