/**
 * Database Backup System
 * 
 * This module provides automated database backup functionality.
 * Backups are stored as JSON files with timestamps.
 */

import { getDb } from "../db";
import { 
  users, 
  listings, 
  deals, 
  messages, 
  documents,
  ndas,
  ndaSignings,
  kycDocuments,
  siteSettings,
  pricePlans
} from "../../drizzle/schema";
import { isNull } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const BACKUP_DIR = path.join(process.cwd(), "database-backups");

export interface BackupMetadata {
  timestamp: string;
  version: string;
  tables: string[];
  recordCounts: Record<string, number>;
}

export interface DatabaseBackup {
  metadata: BackupMetadata;
  data: {
    users: unknown[];
    listings: unknown[];
    deals: unknown[];
    messages: unknown[];
    documents: unknown[];
    ndas: unknown[];
    ndaSignings: unknown[];
    kycDocuments: unknown[];
    siteSettings: unknown[];
    pricePlans: unknown[];
  };
}

/**
 * Ensure backup directory exists
 */
function ensureBackupDir(): void {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Create a full database backup
 */
export async function createDatabaseBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    const db = await getDb();
    if (!db) {
      return { success: false, error: "Database not available" };
    }

    ensureBackupDir();

    // Fetch all data from critical tables (excluding soft-deleted records)
    const [
      usersData,
      listingsData,
      dealsData,
      messagesData,
      documentsData,
      ndasData,
      ndaSigningsData,
      kycDocumentsData,
      siteSettingsData,
      pricePlansData,
    ] = await Promise.all([
      db.select().from(users).where(isNull(users.deletedAt)),
      db.select().from(listings).where(isNull(listings.deletedAt)),
      db.select().from(deals).where(isNull(deals.deletedAt)),
      db.select().from(messages).where(isNull(messages.deletedAt)),
      db.select().from(documents).where(isNull(documents.deletedAt)),
      db.select().from(ndas),
      db.select().from(ndaSignings),
      db.select().from(kycDocuments),
      db.select().from(siteSettings),
      db.select().from(pricePlans),
    ]);

    const backup: DatabaseBackup = {
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        tables: [
          "users",
          "listings",
          "deals",
          "messages",
          "documents",
          "ndas",
          "ndaSignings",
          "kycDocuments",
          "siteSettings",
          "pricePlans",
        ],
        recordCounts: {
          users: usersData.length,
          listings: listingsData.length,
          deals: dealsData.length,
          messages: messagesData.length,
          documents: documentsData.length,
          ndas: ndasData.length,
          ndaSignings: ndaSigningsData.length,
          kycDocuments: kycDocumentsData.length,
          siteSettings: siteSettingsData.length,
          pricePlans: pricePlansData.length,
        },
      },
      data: {
        users: usersData,
        listings: listingsData,
        deals: dealsData,
        messages: messagesData,
        documents: documentsData,
        ndas: ndasData,
        ndaSignings: ndaSigningsData,
        kycDocuments: kycDocumentsData,
        siteSettings: siteSettingsData,
        pricePlans: pricePlansData,
      },
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${timestamp}.json`;
    const filePath = path.join(BACKUP_DIR, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));

    console.log(`[DatabaseBackup] Backup created successfully: ${filePath}`);
    console.log(`[DatabaseBackup] Record counts:`, backup.metadata.recordCounts);

    return { success: true, filePath };
  } catch (error) {
    console.error("[DatabaseBackup] Failed to create backup:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * List all available backups
 */
export function listBackups(): { fileName: string; timestamp: string; size: number }[] {
  ensureBackupDir();
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith(".json"))
    .map(fileName => {
      const filePath = path.join(BACKUP_DIR, fileName);
      const stats = fs.statSync(filePath);
      const match = fileName.match(/backup-(.+)\.json/);
      const timestamp = match ? match[1].replace(/-/g, ":").replace("T", " ") : "unknown";
      return {
        fileName,
        timestamp,
        size: stats.size,
      };
    })
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return files;
}

/**
 * Load a backup file
 */
export function loadBackup(fileName: string): DatabaseBackup | null {
  const filePath = path.join(BACKUP_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.error(`[DatabaseBackup] Backup file not found: ${filePath}`);
    return null;
  }

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content) as DatabaseBackup;
  } catch (error) {
    console.error(`[DatabaseBackup] Failed to load backup: ${error}`);
    return null;
  }
}

/**
 * Clean up old backups, keeping only the most recent N backups
 */
export function cleanupOldBackups(keepCount: number = 30): void {
  const backups = listBackups();
  
  if (backups.length <= keepCount) {
    return;
  }

  const toDelete = backups.slice(keepCount);
  
  for (const backup of toDelete) {
    const filePath = path.join(BACKUP_DIR, backup.fileName);
    try {
      fs.unlinkSync(filePath);
      console.log(`[DatabaseBackup] Deleted old backup: ${backup.fileName}`);
    } catch (error) {
      console.error(`[DatabaseBackup] Failed to delete backup ${backup.fileName}:`, error);
    }
  }
}
