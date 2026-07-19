ALTER TABLE `siteSettings`
  ADD COLUMN `launchMode` varchar(20) NOT NULL DEFAULT 'live' AFTER `docusign_rsa_private_key`;

UPDATE `siteSettings`
SET `launchMode` = 'live'
WHERE `launchMode` IS NULL OR `launchMode` = '';
