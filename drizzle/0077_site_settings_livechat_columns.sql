ALTER TABLE `siteSettings`
  ADD COLUMN `livechatScript` text NULL AFTER `buyAssetSubheading`,
  ADD COLUMN `livechatEnabledPublic` tinyint NULL DEFAULT 1 AFTER `livechatScript`,
  ADD COLUMN `livechatEnabledAdmin` tinyint NULL DEFAULT 0 AFTER `livechatEnabledPublic`;

UPDATE `siteSettings`
SET
  `livechatEnabledPublic` = COALESCE(`livechatEnabledPublic`, 1),
  `livechatEnabledAdmin` = COALESCE(`livechatEnabledAdmin`, 0);
