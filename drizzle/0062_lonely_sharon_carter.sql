CREATE TABLE `adminAuditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`adminId` int NOT NULL,
	`adminName` varchar(255),
	`adminEmail` varchar(320),
	`action` varchar(100) NOT NULL,
	`resource` varchar(100) NOT NULL,
	`resourceId` int,
	`details` text,
	`ipAddress` varchar(45),
	`userAgent` text,
	`status` enum('success','failure') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `adminAuditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `adminAuditLogs_adminId` ON `adminAuditLogs` (`adminId`);--> statement-breakpoint
CREATE INDEX `adminAuditLogs_action` ON `adminAuditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `adminAuditLogs_resource` ON `adminAuditLogs` (`resource`);--> statement-breakpoint
CREATE INDEX `adminAuditLogs_createdAt` ON `adminAuditLogs` (`createdAt`);