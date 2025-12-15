/**
 * Due Diligence Router
 * Handles checklist management and Q&A for deal due diligence
 */

import { router, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as dueDiligence from '../lib/dueDiligence';
import { TRPCError } from '@trpc/server';

export const dueDiligenceRouter = router({
  /**
   * Initialize checklist for a deal
   */
  initializeChecklist: protectedProcedure
    .input(z.object({
      dealId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      // TODO: Verify user has access to this deal
      const result = await dueDiligence.initializeDueDiligenceChecklist(
        input.dealId,
        ctx.user.id
      );
      
      return result;
    }),
  
  /**
   * Get checklist items for a deal
   */
  getItems: protectedProcedure
    .input(z.object({
      dealId: z.number(),
    }))
    .query(async ({ input }) => {
      const items = await dueDiligence.getDueDiligenceItems(input.dealId);
      return items;
    }),
  
  /**
   * Get checklist progress summary
   */
  getProgress: protectedProcedure
    .input(z.object({
      dealId: z.number(),
    }))
    .query(async ({ input }) => {
      const progress = await dueDiligence.getDueDiligenceProgress(input.dealId);
      return progress;
    }),
  
  /**
   * Update item status
   */
  updateItemStatus: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      status: z.enum(['pending', 'requested', 'in_progress', 'completed', 'waived']),
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await dueDiligence.updateDueDiligenceItemStatus(
        input.itemId,
        input.status,
        input.status === 'completed' ? ctx.user.id : undefined
      );
      
      return {
        success: true,
        item: updated,
      };
    }),
  
  /**
   * Add document to item
   */
  addDocument: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      documentId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const documentIds = await dueDiligence.addDocumentToItem(
        input.itemId,
        input.documentId
      );
      
      return {
        success: true,
        documentIds,
      };
    }),
  
  /**
   * Ask a question on an item
   */
  askQuestion: protectedProcedure
    .input(z.object({
      itemId: z.number(),
      question: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const question = await dueDiligence.askQuestion(
        input.itemId,
        input.question,
        ctx.user.id
      );
      
      return {
        success: true,
        question,
      };
    }),
  
  /**
   * Answer a question
   */
  answerQuestion: protectedProcedure
    .input(z.object({
      questionId: z.number(),
      answer: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      const question = await dueDiligence.answerQuestion(
        input.questionId,
        input.answer,
        ctx.user.id
      );
      
      return {
        success: true,
        question,
      };
    }),
  
  /**
   * Get questions for an item
   */
  getItemQuestions: protectedProcedure
    .input(z.object({
      itemId: z.number(),
    }))
    .query(async ({ input }) => {
      const questions = await dueDiligence.getItemQuestions(input.itemId);
      return questions;
    }),
  
  /**
   * Get all questions for a deal
   */
  getDealQuestions: protectedProcedure
    .input(z.object({
      dealId: z.number(),
    }))
    .query(async ({ input }) => {
      const questions = await dueDiligence.getDealQuestions(input.dealId);
      return questions;
    }),
});
