/**
 * Tests for Sales Packet Preparation feature
 */

import { describe, expect, it } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';
import { DEFAULT_CHECKLIST_ITEMS, calculateReadinessScore, getReadinessLevel } from './lib/preparationChecklist';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createAuthContext(userId: number = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `seller${userId}@example.com`,
    name: `Test Seller ${userId}`,
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };

  return { ctx };
}

describe('Preparation Checklist', () => {
  describe('Default Checklist Items', () => {
    it('should have correct number of items by priority', () => {
      const requiredItems = DEFAULT_CHECKLIST_ITEMS.filter(i => i.required);
      const recommendedItems = DEFAULT_CHECKLIST_ITEMS.filter(i => !i.required && i.recommended);
      const niceToHaveItems = DEFAULT_CHECKLIST_ITEMS.filter(i => !i.required && !i.recommended);
      
      expect(requiredItems.length).toBeGreaterThan(0);
      expect(recommendedItems.length).toBeGreaterThan(0);
      expect(niceToHaveItems.length).toBeGreaterThan(0);
      expect(requiredItems.length + recommendedItems.length + niceToHaveItems.length).toBe(DEFAULT_CHECKLIST_ITEMS.length);
    });
    
    it('should have templates for key items', () => {
      const itemsWithTemplates = DEFAULT_CHECKLIST_ITEMS.filter(i => i.hasTemplate);
      expect(itemsWithTemplates.length).toBeGreaterThan(0);
      
      // Check that financial, client, and tech stack items have templates
      const financialTemplate = DEFAULT_CHECKLIST_ITEMS.find(i => 
        i.category === 'financial' && i.hasTemplate
      );
      const clientTemplate = DEFAULT_CHECKLIST_ITEMS.find(i => 
        i.category === 'clients' && i.hasTemplate
      );
      const techTemplate = DEFAULT_CHECKLIST_ITEMS.find(i => 
        i.category === 'technical' && i.hasTemplate
      );
      
      expect(financialTemplate).toBeDefined();
      expect(clientTemplate).toBeDefined();
      expect(techTemplate).toBeDefined();
    });
    
    it('should cover all categories', () => {
      const categories = new Set(DEFAULT_CHECKLIST_ITEMS.map(i => i.category));
      expect(categories.has('financial')).toBe(true);
      expect(categories.has('clients')).toBe(true);
      expect(categories.has('technical')).toBe(true);
      expect(categories.has('operational')).toBe(true);
      expect(categories.has('legal')).toBe(true);
    });
  });
  
  describe('Readiness Score Calculation', () => {
    it('should return 10 for no completed items (nice-to-have default)', () => {
      const items = [
        { required: true, recommended: false, completed: false },
        { required: true, recommended: false, completed: false },
        { required: false, recommended: true, completed: false },
      ];
      
      const score = calculateReadinessScore(items);
      expect(score).toBe(10); // 0% required + 0% recommended + 10% nice-to-have default
    });
    
    it('should return 60 for all required items completed', () => {
      const items = [
        { required: true, recommended: false, completed: true },
        { required: true, recommended: false, completed: true },
        { required: false, recommended: true, completed: false },
        { required: false, recommended: false, completed: false },
      ];
      
      const score = calculateReadinessScore(items);
      expect(score).toBe(60);
    });
    
    it('should return 90 for required + recommended items completed', () => {
      const items = [
        { required: true, recommended: false, completed: true },
        { required: true, recommended: false, completed: true },
        { required: false, recommended: true, completed: true },
        { required: false, recommended: true, completed: true },
        { required: false, recommended: false, completed: false },
      ];
      
      const score = calculateReadinessScore(items);
      expect(score).toBe(90);
    });
    
    it('should return 100 for all items completed', () => {
      const items = [
        { required: true, recommended: false, completed: true },
        { required: true, recommended: false, completed: true },
        { required: false, recommended: true, completed: true },
        { required: false, recommended: false, completed: true },
      ];
      
      const score = calculateReadinessScore(items);
      expect(score).toBe(100);
    });
    
    it('should weight required items at 60%', () => {
      const items = [
        { required: true, recommended: false, completed: true },
        { required: true, recommended: false, completed: false },
        { required: false, recommended: true, completed: false },
      ];
      
      const score = calculateReadinessScore(items);
      expect(score).toBe(40); // 50% of required (30%) + 0% recommended + 10% nice-to-have default
    });
    
    it('should weight recommended items at 30%', () => {
      const items = [
        { required: true, recommended: false, completed: false },
        { required: false, recommended: true, completed: true },
        { required: false, recommended: true, completed: false },
      ];
      
      const score = calculateReadinessScore(items);
      expect(score).toBe(25); // 0% required + 50% of recommended (15%) + 10% nice-to-have default
    });
  });
  
  describe('Readiness Level', () => {
    it('should return "not_started" for 0% score', () => {
      const level = getReadinessLevel(0);
      expect(level.level).toBe('not_started');
      expect(level.color).toBe('gray');
    });
    
    it('should return "getting_started" for low scores', () => {
      const level = getReadinessLevel(20);
      expect(level.level).toBe('getting_started');
      expect(level.color).toBe('red');
    });
    
    it('should return "in_progress" for medium scores', () => {
      const level = getReadinessLevel(50);
      expect(level.level).toBe('in_progress');
      expect(level.color).toBe('orange');
    });
    
    it('should return "almost_ready" for high scores', () => {
      const level = getReadinessLevel(75);
      expect(level.level).toBe('almost_ready');
      expect(level.color).toBe('yellow');
    });
    
    it('should return "ready" for 85%+ scores', () => {
      const level = getReadinessLevel(90);
      expect(level.level).toBe('ready');
      expect(level.color).toBe('green');
    });
  });
  
  describe('Template Download Mapping', () => {
    it('should have valid template filenames', () => {
      const templateItems = DEFAULT_CHECKLIST_ITEMS.filter(i => i.hasTemplate);
      
      const validFilenames = [
        'financial-statement-template.xlsx',
        'client-list-template.xlsx',
        'tech-stack-inventory-template.xlsx',
        'employee-information-template.xlsx',
        'vendor-contract-summary-template.xlsx',
        'asset-list-template.xlsx',
      ];
      
      templateItems.forEach(item => {
        expect(validFilenames).toContain(item.templateFileName);
      });
    });
  });
  
  describe('Category Coverage', () => {
    it('should have required items in financial category', () => {
      const financialRequired = DEFAULT_CHECKLIST_ITEMS.filter(i => 
        i.category === 'financial' && i.required
      );
      expect(financialRequired.length).toBeGreaterThan(0);
    });
    
    it('should have required items in clients category', () => {
      const clientsRequired = DEFAULT_CHECKLIST_ITEMS.filter(i => 
        i.category === 'clients' && i.required
      );
      expect(clientsRequired.length).toBeGreaterThan(0);
    });
    
    it('should have required items in technical category', () => {
      const technicalRequired = DEFAULT_CHECKLIST_ITEMS.filter(i => 
        i.category === 'technical' && i.required
      );
      expect(technicalRequired.length).toBeGreaterThan(0);
    });
    
    it('should have recommended items in operational category', () => {
      const operationalRecommended = DEFAULT_CHECKLIST_ITEMS.filter(i => 
        i.category === 'operational' && i.recommended
      );
      expect(operationalRecommended.length).toBeGreaterThan(0);
    });
    
    it('should have items in legal category', () => {
      const legalItems = DEFAULT_CHECKLIST_ITEMS.filter(i => 
        i.category === 'legal'
      );
      expect(legalItems.length).toBeGreaterThan(0);
    });
  });
  
  describe('Scoring Edge Cases', () => {
    it('should handle empty items array', () => {
      const score = calculateReadinessScore([]);
      expect(score).toBe(100); // No items = 100% complete
    });
    
    it('should handle only required items', () => {
      const items = [
        { required: true, recommended: false, completed: true },
        { required: true, recommended: false, completed: true },
      ];
      const score = calculateReadinessScore(items);
      expect(score).toBe(100); // All required done = 60% + 30% + 10% defaults
    });
    
    it('should handle only recommended items', () => {
      const items = [
        { required: false, recommended: true, completed: true },
        { required: false, recommended: true, completed: true },
      ];
      const score = calculateReadinessScore(items);
      expect(score).toBe(100); // All recommended done = 60% + 30% + 10% defaults
    });
    
    it('should handle mixed completion states', () => {
      const items = [
        { required: true, recommended: false, completed: true },
        { required: true, recommended: false, completed: false },
        { required: true, recommended: false, completed: true },
        { required: false, recommended: true, completed: true },
        { required: false, recommended: false, completed: false },
      ];
      
      const score = calculateReadinessScore(items);
      // 2/3 required (40%) + 1/1 recommended (30%) + 0/1 nice-to-have (0%) = 70%
      expect(score).toBe(70);
    });
  });
});
