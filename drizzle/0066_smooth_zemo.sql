ALTER TABLE `ndaSignings` ADD `buyerSignature` text;--> statement-breakpoint
ALTER TABLE `ndaSignings` ADD `sellerSignature` text;--> statement-breakpoint
ALTER TABLE `ndaSignings` ADD `buyerSignatureType` varchar(50);--> statement-breakpoint
ALTER TABLE `ndaSignings` ADD `sellerSignatureType` varchar(50);--> statement-breakpoint
ALTER TABLE `ndaSignings` ADD `variableValues` text;--> statement-breakpoint
ALTER TABLE `ndaSignings` ADD `customNdaUrl` varchar(500);--> statement-breakpoint
ALTER TABLE `ndaSignings` ADD `customNdaFileName` varchar(255);