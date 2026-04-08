import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { ENV } from "../_core/env";

const stripe = ENV.stripeSecretKey
  ? new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-11-17.clover" })
  : null;

/**
 * Stripe Identity Verification Router
 * Handles $5 instant KYC verification via Stripe Identity API
 * 
 * Flow:
 * 1. User pays $5 via Stripe Payment Intent
 * 2. After payment, create Stripe Identity Verification Session
 * 3. User completes identity verification (takes photo of ID, selfie)
 * 4. Webhook receives verification result
 * 5. Update user.stripeIdentityVerified = true
 */
export const stripeIdentityRouter = router({
  /**
   * Create payment intent for $5 verification fee
   */
  createVerificationPayment: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user already has Stripe Identity verification
      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      if (user[0]?.stripeIdentityVerified) {
        throw new Error("You are already verified via Stripe Identity");
      }

      // Create payment intent for $5
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 500, // $5 in cents
        currency: "usd",
        metadata: {
          userId: ctx.user.id.toString(),
          verificationType: "stripe_identity",
        },
        description: "Instant KYC Verification Fee",
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    }),

  /**
   * Create Stripe Identity verification session after payment
   */
  createVerificationSession: protectedProcedure
    .input(z.object({
      paymentIntentId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Verify payment was successful
      const paymentIntent = await stripe.paymentIntents.retrieve(input.paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        throw new Error("Payment must be completed before starting verification");
      }

      // Create Stripe Identity verification session
      const verificationSession = await stripe.identity.verificationSessions.create({
        type: "document",
        metadata: {
          userId: ctx.user.id.toString(),
          paymentIntentId: input.paymentIntentId,
        },
        options: {
          document: {
            require_live_capture: true,
            require_matching_selfie: true,
          },
        },
      });

      // Update user with session ID and payment info
      await db.update(users)
        .set({
          stripeIdentitySessionId: verificationSession.id,
          stripeIdentityPaymentIntentId: input.paymentIntentId,
          stripeIdentityAmountPaid: 500,
        })
        .where(eq(users.id, ctx.user.id));

      return {
        sessionId: verificationSession.id,
        clientSecret: verificationSession.client_secret,
        url: verificationSession.url,
      };
    }),

  /**
   * Check verification status
   */
  getVerificationStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
      const userData = user[0];

      if (!userData) {
        throw new Error("User not found");
      }

      // If already verified, return verified status
      if (userData.stripeIdentityVerified) {
        return {
          status: "verified",
          verifiedAt: userData.stripeIdentityVerifiedAt,
          sessionId: userData.stripeIdentitySessionId,
        };
      }

      // If has session ID, check Stripe for status
      if (userData.stripeIdentitySessionId) {
        const session = await stripe.identity.verificationSessions.retrieve(
          userData.stripeIdentitySessionId
        );

        return {
          status: session.status,
          sessionId: session.id,
          lastError: session.last_error?.reason,
        };
      }

      return {
        status: "not_started",
      };
    }),
});
