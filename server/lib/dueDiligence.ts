/**
 * Due Diligence Helpers
 * Manages due diligence checklist items and Q&A
 */

import { eq, and } from 'drizzle-orm';
import { getDb } from '../db';
import {
  dueDiligenceItems,
  dueDiligenceQuestions,
  type InsertDueDiligenceItem,
  type InsertDueDiligenceQuestion,
} from '../../drizzle/schema';
import { DUE_DILIGENCE_TEMPLATE } from './dueDiligenceTemplate';

/**
 * Initialize default checklist for a deal
 */
export async function initializeDueDiligenceChecklist(dealId: number, requestedBy: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  // Check if checklist already exists
  const existing = await db
    .select()
    .from(dueDiligenceItems)
    .where(eq(dueDiligenceItems.dealId, dealId))
    .limit(1);
  
  if (existing.length > 0) {
    return { message: 'Checklist already exists for this deal' };
  }
  
  // Create items from template
  const items: InsertDueDiligenceItem[] = DUE_DILIGENCE_TEMPLATE.map(template => ({
    dealId,
    category: template.category,
    itemName: template.itemName,
    description: template.description,
    required: template.required,
    priority: template.priority,
    status: 'pending',
    requestedBy,
  }));
  
  await db.insert(dueDiligenceItems).values(items);
  
  return { message: `Created ${items.length} checklist items`, count: items.length };
}

/**
 * Get all checklist items for a deal
 */
export async function getDueDiligenceItems(dealId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const items = await db
    .select()
    .from(dueDiligenceItems)
    .where(eq(dueDiligenceItems.dealId, dealId));
  
  return items;
}

/**
 * Get checklist progress summary
 */
export async function getDueDiligenceProgress(dealId: number) {
  const items = await getDueDiligenceItems(dealId);
  
  const total = items.length;
  const completed = items.filter(item => item.status === 'completed').length;
  const required = items.filter(item => item.required).length;
  const requiredCompleted = items.filter(item => item.required && item.status === 'completed').length;
  
  const byCategory: Record<string, { total: number; completed: number }> = {};
  items.forEach(item => {
    if (!byCategory[item.category]) {
      byCategory[item.category] = { total: 0, completed: 0 };
    }
    byCategory[item.category].total++;
    if (item.status === 'completed') {
      byCategory[item.category].completed++;
    }
  });
  
  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    required,
    requiredCompleted,
    requiredPercentage: required > 0 ? Math.round((requiredCompleted / required) * 100) : 0,
    byCategory,
  };
}

/**
 * Update checklist item status
 */
export async function updateDueDiligenceItemStatus(
  itemId: number,
  status: 'pending' | 'requested' | 'in_progress' | 'completed' | 'waived',
  completedBy?: number
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const updateData: any = {
    status,
    updatedAt: new Date(),
  };
  
  if (status === 'completed' && completedBy) {
    updateData.completedAt = new Date();
    updateData.completedBy = completedBy;
  }
  
  await db
    .update(dueDiligenceItems)
    .set(updateData)
    .where(eq(dueDiligenceItems.id, itemId));
  
  const updated = await db
    .select()
    .from(dueDiligenceItems)
    .where(eq(dueDiligenceItems.id, itemId))
    .limit(1);
  
  return updated[0];
}

/**
 * Add document to checklist item
 */
export async function addDocumentToItem(itemId: number, documentId: number) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const item = await db
    .select()
    .from(dueDiligenceItems)
    .where(eq(dueDiligenceItems.id, itemId))
    .limit(1);
  
  if (!item[0]) throw new Error('Item not found');
  
  const currentDocs = item[0].documentIds ? JSON.parse(item[0].documentIds) : [];
  const updatedDocs = [...currentDocs, documentId];
  
  await db
    .update(dueDiligenceItems)
    .set({
      documentIds: JSON.stringify(updatedDocs),
      updatedAt: new Date(),
    })
    .where(eq(dueDiligenceItems.id, itemId));
  
  return updatedDocs;
}

/**
 * Ask a question on a checklist item
 */
export async function askQuestion(
  itemId: number,
  question: string,
  askedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const questionData: InsertDueDiligenceQuestion = {
    itemId,
    question,
    askedBy,
    status: 'open',
  };
  
  await db.insert(dueDiligenceQuestions).values(questionData);
  
  // Get the created question
  const created = await db
    .select()
    .from(dueDiligenceQuestions)
    .where(and(
      eq(dueDiligenceQuestions.itemId, itemId),
      eq(dueDiligenceQuestions.askedBy, askedBy)
    ))
    .orderBy(dueDiligenceQuestions.createdAt)
    .limit(1);
  
  return created[0];
}

/**
 * Answer a question
 */
export async function answerQuestion(
  questionId: number,
  answer: string,
  answeredBy: number
) {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  await db
    .update(dueDiligenceQuestions)
    .set({
      answer,
      answeredBy,
      answeredAt: new Date(),
      status: 'answered',
      updatedAt: new Date(),
    })
    .where(eq(dueDiligenceQuestions.id, questionId));
  
  const updated = await db
    .select()
    .from(dueDiligenceQuestions)
    .where(eq(dueDiligenceQuestions.id, questionId))
    .limit(1);
  
  return updated[0];
}

/**
 * Get all questions for an item
 */
export async function getItemQuestions(itemId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const questions = await db
    .select()
    .from(dueDiligenceQuestions)
    .where(eq(dueDiligenceQuestions.itemId, itemId));
  
  return questions;
}

/**
 * Get all questions for a deal
 */
export async function getDealQuestions(dealId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Get all items for the deal
  const items = await getDueDiligenceItems(dealId);
  const itemIds = items.map(item => item.id);
  
  if (itemIds.length === 0) return [];
  
  // Get all questions for these items
  const questions = await db
    .select()
    .from(dueDiligenceQuestions);
  
  // Filter questions that belong to this deal's items
  return questions.filter(q => itemIds.includes(q.itemId));
}
