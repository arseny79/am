-- Phase 2: Dynamic Listing Forms — field definitions + listing field values

CREATE TABLE `field_definitions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `verticalId` int,
  `assetTypeId` int,
  `subcategoryId` int,
  `fieldKey` varchar(100) NOT NULL,
  `label` varchar(255) NOT NULL,
  `description` text,
  `helpText` text,
  `fieldType` enum('text','textarea','number','currency','percentage','url','dropdown','multi_select','boolean','date','wallet_address','contract_address') NOT NULL,
  `required` tinyint NOT NULL DEFAULT 0,
  `options` text,
  `sortOrder` int NOT NULL DEFAULT 0,
  `isPublic` tinyint NOT NULL DEFAULT 1,
  `showOnCard` tinyint NOT NULL DEFAULT 0,
  `filterable` tinyint NOT NULL DEFAULT 0,
  `sortable` tinyint NOT NULL DEFAULT 0,
  `isActive` tinyint NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `field_definitions_assetTypeId_idx` (`assetTypeId`),
  INDEX `field_definitions_verticalId_idx` (`verticalId`)
);

CREATE TABLE `listing_field_values` (
  `id` int AUTO_INCREMENT NOT NULL,
  `listingId` int NOT NULL,
  `fieldDefinitionId` int NOT NULL,
  `value` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `listing_field_values_listingId_idx` (`listingId`),
  INDEX `listing_field_values_fieldDefinitionId_idx` (`fieldDefinitionId`)
);
