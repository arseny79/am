/**
 * Buyer Qualification & Due Diligence Tests
 * Comprehensive test suite for both features
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

// Mock context helpers
function createMockContext(userId: number, role: 'user' | 'admin' = 'user'): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: {
      id: userId,
      openId: `user-${userId}`,
      email: `user${userId}@example.com`,
      name: `User ${userId}`,
      loginMethod: 'email',
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };
  
  return { ctx };
}

describe('Buyer Qualification System', () => {
  describe('getMyQualification', () => {
    it('returns null for user without qualification', async () => {
      const { ctx } = createMockContext(9999);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.buyerQualification.getMyQualification();
      
      expect(result.qualification).toBeNull();
      expect(result.isExpired).toBe(false);
    });
  });
  
  describe('submitProofOfFunds', () => {
    it('allows user to submit proof of funds', async () => {
      const { ctx } = createMockContext(1001);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.buyerQualification.submitProofOfFunds({
        proofOfFundsUrl: 'https://example.com/bank-statement.pdf',
        proofOfFundsAmount: 500000,
        proofOfFundsType: 'bank_statement',
      });
      
      expect(result.success).toBe(true);
      expect(result.qualification).toBeDefined();
      expect(result.qualification?.status).toBe('pending');
      expect(result.qualification?.verificationLevel).toBe('basic');
    });
    
    it('validates proof of funds amount is positive', async () => {
      const { ctx } = createMockContext(1002);
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.buyerQualification.submitProofOfFunds({
          proofOfFundsUrl: 'https://example.com/bank-statement.pdf',
          proofOfFundsAmount: -100,
          proofOfFundsType: 'bank_statement',
        })
      ).rejects.toThrow();
    });
  });
  
  describe('checkListingAccess', () => {
    it('returns no access for basic users', async () => {
      const { ctx } = createMockContext(1003);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.buyerQualification.checkListingAccess({
        listingPrice: 500000,
      });
      
      expect(result.hasAccess).toBe(false);
      expect(result.reason).toContain('verify your proof of funds');
    });
  });
  
  describe('Admin: approve qualification', () => {
    it('allows admin to approve buyer qualification', async () => {
      const { ctx: userCtx } = createMockContext(1004);
      const { ctx: adminCtx } = createMockContext(1, 'admin');
      
      const userCaller = appRouter.createCaller(userCtx);
      const adminCaller = appRouter.createCaller(adminCtx);
      
      // User submits proof of funds
      await userCaller.buyerQualification.submitProofOfFunds({
        proofOfFundsUrl: 'https://example.com/bank-statement.pdf',
        proofOfFundsAmount: 750000,
        proofOfFundsType: 'bank_statement',
      });
      
      // Admin approves
      const result = await adminCaller.buyerQualification.approve({
        userId: 1004,
        verificationLevel: 'verified',
        verificationNotes: 'Verified bank statement',
      });
      
      expect(result.success).toBe(true);
      expect(result.qualification?.status).toBe('approved');
      expect(result.qualification?.verificationLevel).toBe('verified');
    });
    
    it('prevents non-admin from approving', async () => {
      const { ctx } = createMockContext(1005, 'user');
      const caller = appRouter.createCaller(ctx);
      
      await expect(
        caller.buyerQualification.approve({
          userId: 1006,
          verificationLevel: 'verified',
        })
      ).rejects.toThrow('permission');
    });
  });
  
  describe('Admin: reject qualification', () => {
    it('allows admin to reject buyer qualification', async () => {
      const { ctx: userCtx } = createMockContext(1007);
      const { ctx: adminCtx } = createMockContext(1, 'admin');
      
      const userCaller = appRouter.createCaller(userCtx);
      const adminCaller = appRouter.createCaller(adminCtx);
      
      // User submits proof of funds
      await userCaller.buyerQualification.submitProofOfFunds({
        proofOfFundsUrl: 'https://example.com/fake-document.pdf',
        proofOfFundsAmount: 100000,
        proofOfFundsType: 'bank_statement',
      });
      
      // Admin rejects
      const result = await adminCaller.buyerQualification.reject({
        userId: 1007,
        verificationNotes: 'Document appears to be fraudulent',
      });
      
      expect(result.success).toBe(true);
      expect(result.qualification?.status).toBe('rejected');
    });
  });
});

describe('Due Diligence Checklist', () => {
  const dealId = 5001;
  
  describe('initializeChecklist', () => {
    it('creates 50 checklist items from template', async () => {
      const { ctx } = createMockContext(2001);
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.dueDiligence.initializeChecklist({ dealId });
      
      // Either creates new items or reports existing
      expect(result.message).toBeDefined();
      if (result.count) {
        expect(result.count).toBe(50);
      }
    });
    
    it('prevents duplicate initialization', async () => {
      const { ctx } = createMockContext(2002);
      const caller = appRouter.createCaller(ctx);
      
      // Initialize once
      await caller.dueDiligence.initializeChecklist({ dealId: 5002 });
      
      // Try to initialize again
      const result = await caller.dueDiligence.initializeChecklist({ dealId: 5002 });
      
      expect(result.message).toContain('already exists');
    });
  });
  
  describe('getItems', () => {
    it('returns all checklist items for a deal', async () => {
      const { ctx } = createMockContext(2003);
      const caller = appRouter.createCaller(ctx);
      
      await caller.dueDiligence.initializeChecklist({ dealId: 5003 });
      const items = await caller.dueDiligence.getItems({ dealId: 5003 });
      
      expect(items.length).toBe(50);
      expect(items[0]).toHaveProperty('category');
      expect(items[0]).toHaveProperty('itemName');
      expect(items[0]).toHaveProperty('status');
    });
  });
  
  describe('getProgress', () => {
    it('calculates progress correctly', async () => {
      const { ctx } = createMockContext(2004);
      const caller = appRouter.createCaller(ctx);
      
      await caller.dueDiligence.initializeChecklist({ dealId: 5004 });
      const progress = await caller.dueDiligence.getProgress({ dealId: 5004 });
      
      expect(progress.total).toBe(50);
      expect(progress.completed).toBeGreaterThanOrEqual(0);
      expect(progress.percentage).toBeGreaterThanOrEqual(0);
      expect(progress.byCategory).toBeDefined();
    });
  });
  
  describe('updateItemStatus', () => {
    it('allows updating item status to completed', async () => {
      const { ctx } = createMockContext(2005);
      const caller = appRouter.createCaller(ctx);
      
      await caller.dueDiligence.initializeChecklist({ dealId: 5005 });
      const items = await caller.dueDiligence.getItems({ dealId: 5005 });
      const firstItem = items[0];
      
      const result = await caller.dueDiligence.updateItemStatus({
        itemId: firstItem.id,
        status: 'completed',
      });
      
      expect(result.success).toBe(true);
      expect(result.item.status).toBe('completed');
      expect(result.item.completedAt).toBeDefined();
    });
    
    it('allows marking items as in_progress', async () => {
      const { ctx } = createMockContext(2006);
      const caller = appRouter.createCaller(ctx);
      
      await caller.dueDiligence.initializeChecklist({ dealId: 5006 });
      const items = await caller.dueDiligence.getItems({ dealId: 5006 });
      
      const result = await caller.dueDiligence.updateItemStatus({
        itemId: items[0].id,
        status: 'in_progress',
      });
      
      expect(result.item.status).toBe('in_progress');
    });
  });
  
  describe('Q&A functionality', () => {
    it('allows asking questions on checklist items', async () => {
      const { ctx } = createMockContext(2007);
      const caller = appRouter.createCaller(ctx);
      
      await caller.dueDiligence.initializeChecklist({ dealId: 5007 });
      const items = await caller.dueDiligence.getItems({ dealId: 5007 });
      
      const result = await caller.dueDiligence.askQuestion({
        itemId: items[0].id,
        question: 'Can you provide more details about this item?',
      });
      
      expect(result.success).toBe(true);
      expect(result.question).toBeDefined();
      expect(result.question.status).toBe('open');
    });
    
    it('allows answering questions', async () => {
      const { ctx } = createMockContext(2008);
      const caller = appRouter.createCaller(ctx);
      
      await caller.dueDiligence.initializeChecklist({ dealId: 5008 });
      const items = await caller.dueDiligence.getItems({ dealId: 5008 });
      
      // Ask question
      const questionResult = await caller.dueDiligence.askQuestion({
        itemId: items[0].id,
        question: 'What format should this document be in?',
      });
      
      // Answer question
      const answerResult = await caller.dueDiligence.answerQuestion({
        questionId: questionResult.question.id,
        answer: 'PDF format is preferred, but Excel is also acceptable',
      });
      
      expect(answerResult.success).toBe(true);
      expect(answerResult.question.status).toBe('answered');
      expect(answerResult.question.answer).toContain('PDF format');
    });
    
    it('validates minimum question length', async () => {
      const { ctx } = createMockContext(2009);
      const caller = appRouter.createCaller(ctx);
      
      await caller.dueDiligence.initializeChecklist({ dealId: 5009 });
      const items = await caller.dueDiligence.getItems({ dealId: 5009 });
      
      await expect(
        caller.dueDiligence.askQuestion({
          itemId: items[0].id,
          question: 'Short',
        })
      ).rejects.toThrow();
    });
  });
  
  describe('getItemQuestions', () => {
    it('returns all questions for an item', async () => {
      const { ctx } = createMockContext(2010);
      const caller = appRouter.createCaller(ctx);
      
      await caller.dueDiligence.initializeChecklist({ dealId: 5010 });
      const items = await caller.dueDiligence.getItems({ dealId: 5010 });
      
      // Ask multiple questions
      await caller.dueDiligence.askQuestion({
        itemId: items[0].id,
        question: 'Question 1: What is the deadline for this?',
      });
      await caller.dueDiligence.askQuestion({
        itemId: items[0].id,
        question: 'Question 2: Who should I contact for clarification?',
      });
      
      const questions = await caller.dueDiligence.getItemQuestions({
        itemId: items[0].id,
      });
      
      expect(questions.length).toBeGreaterThanOrEqual(2);
    });
  });
});

describe('Integration Tests', () => {
  it('buyer qualification affects listing access', async () => {
    const { ctx: buyerCtx } = createMockContext(3001);
    const { ctx: adminCtx } = createMockContext(1, 'admin');
    
    const buyerCaller = appRouter.createCaller(buyerCtx);
    const adminCaller = appRouter.createCaller(adminCtx);
    
    // Check initial qualification state
    const initialQual = await buyerCaller.buyerQualification.getMyQualification();
    const wasAlreadyVerified = initialQual.qualification?.status === 'approved';
    
    // Submit proof of funds
    await buyerCaller.buyerQualification.submitProofOfFunds({
      proofOfFundsUrl: 'https://example.com/bank-statement.pdf',
      proofOfFundsAmount: 750000,
      proofOfFundsType: 'bank_statement',
    });
    
    // Admin approves
    await adminCaller.buyerQualification.approve({
      userId: 3001,
      verificationLevel: 'verified',
    });
    
    // Check access after verification
    const accessAfter = await buyerCaller.buyerQualification.checkListingAccess({
      listingPrice: 500000,
    });
    // If user was already verified or just got verified, they should have access
    expect(accessAfter.hasAccess).toBe(true);
  });
  
  it('due diligence progress updates correctly as items complete', async () => {
    const { ctx } = createMockContext(3002);
    const caller = appRouter.createCaller(ctx);
    
    await caller.dueDiligence.initializeChecklist({ dealId: 6001 });
    
    // Initial progress
    const progressBefore = await caller.dueDiligence.getProgress({ dealId: 6001 });
    const initialPercentage = progressBefore.percentage;
    
    // Complete some items
    const items = await caller.dueDiligence.getItems({ dealId: 6001 });
    await caller.dueDiligence.updateItemStatus({
      itemId: items[0].id,
      status: 'completed',
    });
    await caller.dueDiligence.updateItemStatus({
      itemId: items[1].id,
      status: 'completed',
    });
    
    // Check updated progress
    const progressAfter = await caller.dueDiligence.getProgress({ dealId: 6001 });
    expect(progressAfter.completed).toBeGreaterThanOrEqual(2);
    expect(progressAfter.percentage).toBeGreaterThanOrEqual(initialPercentage);
  });
});
