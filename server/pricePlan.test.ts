import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Price Plan Router', () => {
  const routerPath = path.join(__dirname, 'routers', 'pricePlanRouters.ts');
  
  it('should have pricePlanRouter file', () => {
    expect(fs.existsSync(routerPath)).toBe(true);
  });

  it('should export pricePlanRouter', async () => {
    const routerModule = await import('./routers/pricePlanRouters');
    expect(routerModule.pricePlanRouter).toBeDefined();
  });

  it('should have getActive procedure for public pricing page', async () => {
    const routerModule = await import('./routers/pricePlanRouters');
    const router = routerModule.pricePlanRouter;
    
    // Check that the router has the expected procedures
    expect(router._def.procedures).toBeDefined();
    expect(router._def.procedures.getActive).toBeDefined();
  });

  it('should have getAll procedure for admin', async () => {
    const routerModule = await import('./routers/pricePlanRouters');
    const router = routerModule.pricePlanRouter;
    
    expect(router._def.procedures.getAll).toBeDefined();
  });

  it('should have update procedure for admin', async () => {
    const routerModule = await import('./routers/pricePlanRouters');
    const router = routerModule.pricePlanRouter;
    
    expect(router._def.procedures.update).toBeDefined();
  });

  it('should have toggleActive procedure for admin', async () => {
    const routerModule = await import('./routers/pricePlanRouters');
    const router = routerModule.pricePlanRouter;
    
    expect(router._def.procedures.toggleActive).toBeDefined();
  });
});

describe('Pricing Page Component', () => {
  const pricingPagePath = path.join(__dirname, '..', 'client', 'src', 'pages', 'Pricing.tsx');
  
  it('should have Pricing.tsx file', () => {
    expect(fs.existsSync(pricingPagePath)).toBe(true);
  });

  it('should NOT contain trust stats banner elements', () => {
    const content = fs.readFileSync(pricingPagePath, 'utf-8');
    
    // These elements were removed per user request
    expect(content).not.toContain('$2B+');
    expect(content).not.toContain('500+');
    expect(content).not.toContain('Escrow protected');
    expect(content).not.toContain('3-7 months');
  });

  it('should NOT contain fee calculator', () => {
    const content = fs.readFileSync(pricingPagePath, 'utf-8');
    
    // Fee calculator was removed per user request
    expect(content).not.toContain('Estimate your fees');
    expect(content).not.toContain('salePrice');
    expect(content).not.toContain('calculateFees');
  });

  it('should contain pricing tier cards', () => {
    const content = fs.readFileSync(pricingPagePath, 'utf-8');
    
    // Should have the pricing tier display logic
    expect(content).toContain('plans.map');
    expect(content).toContain('plan.name');
    expect(content).toContain('plan.price');
  });

  it('should use pricePlan.getActive query', () => {
    const content = fs.readFileSync(pricingPagePath, 'utf-8');
    
    expect(content).toContain('trpc.pricePlan.getActive.useQuery');
  });

  it('should show success fee percentage', () => {
    const content = fs.readFileSync(pricingPagePath, 'utf-8');
    
    expect(content).toContain('success fee');
    expect(content).toContain('successFeePercentage');
  });
});
