/**
 * Database helper functions for type conversions
 * 
 * Since the schema uses timestamp({ mode: 'string' }), we need to convert
 * Date objects to ISO strings for database operations.
 */

/**
 * Convert a Date to MySQL timestamp string format
 * MySQL expects: 'YYYY-MM-DD HH:MM:SS'
 */
export function dateToTimestamp(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Convert a Date to ISO string for storage
 */
export function dateToISOString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date.toISOString();
}

/**
 * Convert a boolean to MySQL tinyint (0 or 1)
 */
export function boolToInt(value: boolean | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  return value ? 1 : 0;
}

/**
 * Convert MySQL tinyint (0 or 1) to boolean
 */
export function intToBool(value: number | null | undefined): boolean {
  return value === 1;
}

/**
 * Get current timestamp as MySQL string
 */
export function nowTimestamp(): string {
  return dateToTimestamp(new Date())!;
}
