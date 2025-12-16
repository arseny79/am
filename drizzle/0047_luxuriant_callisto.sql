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
	`invitedAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	`removedAt` timestamp,
	CONSTRAINT `dealProfessionals_id` PRIMARY KEY(`id`)
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
	`createdAt` timestamp NOT NULL DEFAULT (now()),
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
	`verified` boolean NOT NULL DEFAULT false,
	`verifiedAt` timestamp,
	`status` enum('pending','active','suspended','inactive') NOT NULL DEFAULT 'pending',
	`profileViews` int NOT NULL DEFAULT 0,
	`dealInvitations` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `professionals_id` PRIMARY KEY(`id`)
);
