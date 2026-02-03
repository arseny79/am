/**
 * Soft Delete Helpers
 * 
 * These utilities provide consistent soft delete functionality across the application.
 * Instead of permanently deleting records, we set a deleted_at timestamp.
 * This allows for data recovery and audit trails.
 */

import { sql, isNull, and, type SQL } from "drizzle-orm";

/**
 * Get the current timestamp in ISO format for soft delete
 */
export function nowTimestampForDelete(): string {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Create a SQL condition to filter out soft-deleted records
 * Use this in WHERE clauses when querying tables with soft delete support
 * 
 * @param deletedAtColumn - The deleted_at column from the table schema
 * @returns SQL condition that filters out deleted records
 */
export function notDeleted<T extends { deletedAt: unknown }>(table: T): SQL {
  return isNull(table.deletedAt as any);
}

/**
 * Combine notDeleted with other conditions
 * 
 * @param deletedAtColumn - The deleted_at column from the table schema
 * @param otherConditions - Additional WHERE conditions
 * @returns Combined SQL condition
 */
export function whereNotDeleted<T extends { deletedAt: unknown }>(
  table: T,
  ...otherConditions: (SQL | undefined)[]
): SQL {
  const validConditions = otherConditions.filter((c): c is SQL => c !== undefined);
  return and(isNull(table.deletedAt as any), ...validConditions) as SQL;
}

/**
 * Tables that support soft delete:
 * - listings
 * - deals
 * - users
 * - messages
 * - documents
 * 
 * When deleting from these tables, use:
 * 
 * await db.update(tableName)
 *   .set({ deletedAt: nowTimestampForDelete() })
 *   .where(eq(tableName.id, recordId));
 * 
 * Instead of:
 * 
 * await db.delete(tableName).where(eq(tableName.id, recordId));
 */
