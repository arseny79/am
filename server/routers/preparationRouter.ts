/**
 * Preparation Router - Sales packet preparation checklist management
 */

import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { getDb } from '../db';
import { listingPreparationItems, listings } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { 
  DEFAULT_CHECKLIST_ITEMS, 
  calculateReadinessScore, 
  getReadinessLevel,
  getCategoryInfo 
} from '../lib/preparationChecklist';

export const preparationRouter = router({
  /**
   * Initialize checklist for a listing
   * Creates default checklist items if they don't exist
   */
  initializeChecklist: protectedProcedure
    .input(z.object({
      listingId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      // Verify listing ownership
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);
      
      if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
      }
      
      if (listing.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this listing' });
      }
      
      // Check if checklist already exists
      const existingItems = await db
        .select()
        .from(listingPreparationItems)
        .where(eq(listingPreparationItems.listingId, input.listingId));
      
      if (existingItems.length > 0) {
        return { message: 'Checklist already initialized', itemCount: existingItems.length };
      }
      
      // Create default checklist items
      const itemsToInsert = DEFAULT_CHECKLIST_ITEMS.map(item => ({
        listingId: input.listingId,
        category: item.category,
        itemName: item.itemName,
        description: item.description,
        required: item.required,
        recommended: item.recommended,
        templateFileName: item.templateFileName || null,
        hasTemplate: item.hasTemplate,
        completed: false,
      }));
      
      await db.insert(listingPreparationItems).values(itemsToInsert);
      
      return { message: 'Checklist initialized successfully', itemCount: itemsToInsert.length };
    }),
  
  /**
   * Get checklist for a listing
   */
  getChecklist: protectedProcedure
    .input(z.object({
      listingId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      // Verify listing ownership
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);
      
      if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
      }
      
      if (listing.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this listing' });
      }
      
      // Get checklist items
      const items = await db
        .select()
        .from(listingPreparationItems)
        .where(eq(listingPreparationItems.listingId, input.listingId));
      
      // Calculate readiness score
      const score = calculateReadinessScore(items);
      const readiness = getReadinessLevel(score);
      
      // Group items by category
      const itemsByCategory = items.reduce((acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      }, {} as Record<string, typeof items>);
      
      // Add category info
      const categoriesWithInfo = Object.entries(itemsByCategory).map(([category, categoryItems]) => ({
        category,
        ...getCategoryInfo(category as any),
        items: categoryItems,
        completedCount: categoryItems.filter(i => i.completed).length,
        totalCount: categoryItems.length,
      }));
      
      return {
        items,
        itemsByCategory: categoriesWithInfo,
        readinessScore: score,
        readinessLevel: readiness,
        totalItems: items.length,
        completedItems: items.filter(i => i.completed).length,
        requiredItems: items.filter(i => i.required).length,
        completedRequiredItems: items.filter(i => i.required && i.completed).length,
      };
    }),
  
  /**
   * Update checklist item (mark as complete/incomplete)
   */
  updateItem: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      completed: z.boolean(),
      documentId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      // Get item and verify ownership through listing
      const [item] = await db
        .select()
        .from(listingPreparationItems)
        .where(eq(listingPreparationItems.id, input.itemId))
        .limit(1);
      
      if (!item) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Checklist item not found' });
      }
      
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, item.listingId))
        .limit(1);
      
      if (!listing || listing.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this listing' });
      }
      
      // Update item
      await db
        .update(listingPreparationItems)
        .set({
          completed: input.completed,
          completedAt: input.completed ? new Date() : null,
          documentId: input.documentId || item.documentId,
        })
        .where(eq(listingPreparationItems.id, input.itemId));
      
      return { success: true };
    }),
  
  /**
   * Get readiness score for a listing
   */
  getReadinessScore: protectedProcedure
    .input(z.object({
      listingId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });
      
      // Verify listing ownership
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);
      
      if (!listing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Listing not found' });
      }
      
      if (listing.sellerId !== ctx.user.id) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this listing' });
      }
      
      // Get checklist items
      const items = await db
        .select()
        .from(listingPreparationItems)
        .where(eq(listingPreparationItems.listingId, input.listingId));
      
      const score = calculateReadinessScore(items);
      const readiness = getReadinessLevel(score);
      
      return {
        score,
        ...readiness,
        totalItems: items.length,
        completedItems: items.filter(i => i.completed).length,
        requiredItems: items.filter(i => i.required).length,
        completedRequiredItems: items.filter(i => i.required && i.completed).length,
      };
    }),
});
