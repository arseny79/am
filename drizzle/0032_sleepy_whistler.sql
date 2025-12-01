CREATE TABLE `offerHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dealId` int NOT NULL,
	`offeredBy` int NOT NULL,
	`offerType` enum('initial_asking_price','buyer_counter_offer','seller_counter_offer','final_accepted_offer') NOT NULL,
	`amount` int NOT NULL,
	`reason` text,
	`status` enum('pending','accepted','rejected','superseded') NOT NULL DEFAULT 'pending',
	`respondedBy` int,
	`respondedAt` timestamp,
	`responseNotes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `offerHistory_id` PRIMARY KEY(`id`)
);
