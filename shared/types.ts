/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// REQ-20: BuyerRequest interface for public buyer requests listing
export interface BuyerRequest {
  id: string;
  title: string;
  buyerType: 'Private Equity' | 'Strategic Acquirer' | 'Individual';
  investmentThesis: string;
  ebitdaMin: number;
  ebitdaMax: number;
  revenueMin: number;
  revenueMax: number;
  sectors: string[];
  geography: string;
  status: 'draft' | 'published';
  createdAt: string;
}

// REQ-20: Extend Deal type with optional buyerRequestId
export interface DealWithBuyerRequest {
  buyerRequestId?: string;
}
