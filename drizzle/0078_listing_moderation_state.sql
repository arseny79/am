ALTER TABLE `listings`
  ADD COLUMN `moderationStatus` enum('pending_review','needs_information','approved','rejected') NOT NULL DEFAULT 'pending_review' AFTER `subcategoryId`,
  ADD COLUMN `submittedAt` timestamp NULL AFTER `moderationStatus`,
  ADD COLUMN `reviewedAt` timestamp NULL AFTER `submittedAt`,
  ADD COLUMN `reviewedBy` int NULL AFTER `reviewedAt`,
  ADD COLUMN `reviewNotes` text NULL AFTER `reviewedBy`,
  ADD COLUMN `rejectionReason` text NULL AFTER `reviewNotes`;

-- Backfill: published listings are already approved; unpublished legacy listings stay pending_review
UPDATE `listings`
SET `moderationStatus` = CASE
  WHEN `isPublished` = 1 THEN 'approved'
  ELSE 'pending_review'
END
WHERE `deletedAt` IS NULL;
