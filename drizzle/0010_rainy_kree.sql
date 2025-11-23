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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actionItems_id` PRIMARY KEY(`id`)
);
