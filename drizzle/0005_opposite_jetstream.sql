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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accessRequests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `listings` ADD `confidentialityLevel` enum('public','nda','private') DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `isAnonymous` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `listings` ADD `ndaTemplateUrl` text;--> statement-breakpoint
ALTER TABLE `ndas` ADD `ndaType` enum('clickwrap','pdf_upload') DEFAULT 'clickwrap' NOT NULL;--> statement-breakpoint
ALTER TABLE `ndas` ADD `uploadedPdfUrl` text;