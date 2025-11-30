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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `listingDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `documents` ADD `sourceListingDocumentId` int;--> statement-breakpoint
ALTER TABLE `documents` ADD `signatureStatus` enum('none','pending','signed','declined','voided') DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `documents` ADD `docusignEnvelopeId` varchar(255);--> statement-breakpoint
ALTER TABLE `documents` ADD `signers` text;--> statement-breakpoint
ALTER TABLE `documents` ADD `signedAt` timestamp;--> statement-breakpoint
ALTER TABLE `documents` ADD `updatedAt` timestamp DEFAULT (now()) NOT NULL ON UPDATE CURRENT_TIMESTAMP;