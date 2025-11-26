CREATE TABLE `siteSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`googleAnalyticsId` varchar(50),
	`statcounterId` varchar(50),
	`statcounterSecurity` varchar(50),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`updatedBy` int,
	CONSTRAINT `siteSettings_id` PRIMARY KEY(`id`)
);
