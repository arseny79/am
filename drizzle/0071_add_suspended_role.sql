-- Migration: Add 'suspended' to users.role enum
-- Date: 2026-02-27
-- Description: Adds 'suspended' as a valid role value to support user suspension feature

ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','suspended') NOT NULL DEFAULT 'user';
