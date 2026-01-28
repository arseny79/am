ALTER TABLE `deals` ADD `docusign_envelope_id` varchar(255);--> statement-breakpoint
ALTER TABLE `deals` ADD `docusign_status` varchar(50);--> statement-breakpoint
ALTER TABLE `deals` ADD `docusign_buyer_status` varchar(50);--> statement-breakpoint
ALTER TABLE `deals` ADD `docusign_seller_status` varchar(50);--> statement-breakpoint
ALTER TABLE `deals` ADD `docusign_sent_at` timestamp;--> statement-breakpoint
ALTER TABLE `deals` ADD `docusign_completed_at` timestamp;--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `docusign_integration_key` varchar(255);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `docusign_user_id` varchar(255);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `docusign_account_id` varchar(255);--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `docusign_environment` varchar(50) DEFAULT 'sandbox';--> statement-breakpoint
ALTER TABLE `siteSettings` ADD `docusign_rsa_private_key` text;