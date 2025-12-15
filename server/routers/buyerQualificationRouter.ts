/**
 * Buyer Qualification Router
 * Handles proof of funds verification and buyer access levels
 */

import { router, protectedProcedure, adminProcedure } from '../_core/trpc';
import { z } from 'zod';
import * as buyerQual from '../lib/buyerQualification';
import { TRPCError } from '@trpc/server';

export const buyerQualificationRouter = router({
  /**
   * Get current user's qualification status
   */
  getMyQualification: protectedProcedure.query(async ({ ctx }) => {
    const qualification = await buyerQual.getBuyerQualification(ctx.user.id);
    
    // Check if expired
    const isExpired = buyerQual.isQualificationExpired(qualification);
    
    return {
      qualification,
      isExpired,
      needsReverification: isExpired && qualification?.status === 'approved',
    };
  }),
  
  /**
   * Submit proof of funds for verification
   */
  submitProofOfFunds: protectedProcedure
    .input(z.object({
      proofOfFundsUrl: z.string().url(),
      proofOfFundsAmount: z.number().int().positive(),
      proofOfFundsType: z.enum(['bank_statement', 'credit_line', 'investor_letter', 'other']),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await buyerQual.submitProofOfFunds(
        ctx.user.id,
        input.proofOfFundsUrl,
        input.proofOfFundsAmount,
        input.proofOfFundsType
      );
      
      return {
        success: true,
        qualification: result,
        message: 'Proof of funds submitted successfully. Our team will review it within 24-48 hours.',
      };
    }),
  
  /**
   * Check access to a specific listing
   */
  checkListingAccess: protectedProcedure
    .input(z.object({
      listingPrice: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const qualification = await buyerQual.getBuyerQualification(ctx.user.id);
      const accessCheck = buyerQual.hasListingAccess(qualification, input.listingPrice);
      
      return {
        ...accessCheck,
        qualification,
        verificationLevel: qualification?.verificationLevel || 'basic',
      };
    }),
  
  /**
   * Admin: Get all pending qualifications
   */
  getPending: adminProcedure.query(async () => {
    const pending = await buyerQual.getPendingQualifications();
    return pending;
  }),
  
  /**
   * Admin: Approve buyer qualification
   */
  approve: adminProcedure
    .input(z.object({
      userId: z.number(),
      verificationLevel: z.enum(['verified', 'premium']),
      verificationNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await buyerQual.approveBuyerQualification(
        input.userId,
        ctx.user.id,
        input.verificationLevel,
        input.verificationNotes
      );
      
      return {
        success: true,
        qualification: result,
        message: `Buyer qualification approved as ${input.verificationLevel}`,
      };
    }),
  
  /**
   * Admin: Reject buyer qualification
   */
  reject: adminProcedure
    .input(z.object({
      userId: z.number(),
      verificationNotes: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await buyerQual.rejectBuyerQualification(
        input.userId,
        ctx.user.id,
        input.verificationNotes
      );
      
      return {
        success: true,
        qualification: result,
        message: 'Buyer qualification rejected',
      };
    }),
  
  /**
   * Get qualification by user ID (admin only)
   */
  getByUserId: adminProcedure
    .input(z.object({
      userId: z.number(),
    }))
    .query(async ({ input }) => {
      const qualification = await buyerQual.getBuyerQualification(input.userId);
      
      if (!qualification) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No qualification found for this user',
        });
      }
      
      return qualification;
    }),
});
