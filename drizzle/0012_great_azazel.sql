CREATE TABLE `dealActivities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`userId` int,
	`activityType` enum('deal_created','stage_changed','document_uploaded','message_sent','action_item_created','action_item_completed','nda_signed','escrow_initiated','payment_received','deal_closed','deal_cancelled') NOT NULL,
	`description` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `dealActivities_id` PRIMARY KEY(`id`)
);
