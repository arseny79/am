-- Phase 4: widen siteSettings.logoUrl to support base64 data URL logo uploads
ALTER TABLE `siteSettings`
  MODIFY COLUMN `logoUrl` longtext NULL;
