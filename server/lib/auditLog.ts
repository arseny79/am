/**
 * Audit Logging System
 * 
 * This module provides comprehensive audit logging for critical database operations.
 * All create, update, and delete operations on important tables should be logged.
 */

import { getDb } from "../db";
import { auditLogs } from "../../drizzle/schema";

export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'SOFT_DELETE' 
  | 'RESTORE' 
  | 'LOGIN' 
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'EMAIL_CHANGE'
  | 'PERMISSION_CHANGE'
  | 'PAYMENT'
  | 'SUBSCRIPTION_CHANGE';

export type AuditEntity = 
  | 'listing' 
  | 'deal' 
  | 'user' 
  | 'message' 
  | 'document'
  | 'nda'
  | 'kyc'
  | 'payment'
  | 'subscription'
  | 'settings';

export interface AuditLogEntry {
  userId: number | null;
  action: AuditAction;
  entityType: AuditEntity;
  entityId: number | string;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.error('[AuditLog] Database not available');
      return;
    }

    await db.insert(auditLogs).values({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: String(entry.entityId),
      oldValue: entry.oldValue ? JSON.stringify(entry.oldValue) : null,
      newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
      createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
    });
  } catch (error) {
    // Log to console but don't throw - audit logging should not break main operations
    console.error('[AuditLog] Failed to log audit event:', error);
  }
}

/**
 * Helper to extract IP address from request context
 */
export function getIpFromContext(ctx: { req?: { headers?: Record<string, string | string[] | undefined> } }): string | null {
  if (!ctx.req?.headers) return null;
  
  const forwarded = ctx.req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ip?.trim() || null;
  }
  
  const realIp = ctx.req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }
  
  return null;
}

/**
 * Helper to extract user agent from request context
 */
export function getUserAgentFromContext(ctx: { req?: { headers?: Record<string, string | string[] | undefined> } }): string | null {
  if (!ctx.req?.headers) return null;
  
  const ua = ctx.req.headers['user-agent'];
  if (ua) {
    return Array.isArray(ua) ? ua[0] : ua;
  }
  
  return null;
}
