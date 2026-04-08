import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { ENV } from "../_core/env";
import { buyerVerifications, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { getDb } from "../db";

const stripe = ENV.stripeSecretKey
  ? new Stripe(ENV.stripeSecretKey, { apiVersion: "2025-11-17.clover" })
  : null;

const VERIFICATION_PRICE = 19900; // $199.00 in cents

export const verificationRouter = router({
  /**
   * Get current user's verification status
   */
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    
    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // Get latest verification attempt
    const [verification] = await db
      .select()
      .from(buyerVerifications)
      .where(eq(buyerVerifications.userId, ctx.user.id))
      .orderBy(buyerVerifications.createdAt)
      .limit(1);

    return {
      verificationStatus: user.verificationStatus,
      verificationTier: user.verificationTier,
      verifiedAt: user.verifiedAt,
      verificationExpiresAt: user.verificationExpiresAt,
      latestAttempt: verification || null,
    };
  }),

  /**
   * Initiate verification payment - creates Stripe checkout session
   */
  initiatePayment: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Check if user already verified
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    
    if (user?.verificationStatus === "verified") {
      throw new TRPCError({ 
        code: "BAD_REQUEST", 
        message: "You are already verified" 
      });
    }

    // Check if there's a pending payment
    const [existingVerification] = await db
      .select()
      .from(buyerVerifications)
      .where(eq(buyerVerifications.userId, ctx.user.id))
      .orderBy(buyerVerifications.createdAt)
      .limit(1);

    if (existingVerification?.paidAt) {
      throw new TRPCError({ 
        code: "BAD_REQUEST", 
        message: "Payment already completed. Please complete identity and bank verification." 
      });
    }

    try {
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Verified Buyer Badge",
                description: "Get verified to build trust with sellers and unlock premium features",
                images: ["https://your-domain.com/verified-badge.png"], // TODO: Add actual badge image
              },
              unit_amount: VERIFICATION_PRICE,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${ENV.frontendUrl}/verification/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ENV.frontendUrl}/verification/cancelled`,
        client_reference_id: ctx.user.id.toString(),
        customer_email: user?.email || undefined,
        metadata: {
          userId: ctx.user.id.toString(),
          verificationType: "buyer_verification",
        },
      });

      // Create or update verification record
      if (existingVerification) {
        await db
          .update(buyerVerifications)
          .set({
            stripePaymentIntentId: session.payment_intent as string,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(buyerVerifications.id, existingVerification.id));
      } else {
        await db.insert(buyerVerifications).values({
          userId: ctx.user.id,
          stripePaymentIntentId: session.payment_intent as string,
          amountPaid: VERIFICATION_PRICE,
        });
      }

      // Update user status to payment_pending
      await db
        .update(users)
        .set({
          verificationStatus: "payment_pending",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(users.id, ctx.user.id));

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    } catch (error) {
      console.error("Failed to create Stripe checkout session:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to initiate payment. Please try again.",
      });
    }
  }),

  /**
   * Handle Stripe webhook for payment confirmation
   * This should be called by Stripe webhook endpoint
   */
  handlePaymentSuccess: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      try {
        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(input.sessionId);

        if (session.payment_status !== "paid") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Payment not completed",
          });
        }

        // Update verification record
        const [verification] = await db
          .select()
          .from(buyerVerifications)
          .where(eq(buyerVerifications.userId, ctx.user.id))
          .orderBy(buyerVerifications.createdAt)
          .limit(1);

        if (!verification) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Verification record not found",
          });
        }

        await db
          .update(buyerVerifications)
          .set({
            paidAt: new Date().toISOString(),
            amountPaid: VERIFICATION_PRICE,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(buyerVerifications.id, verification.id));

        // Update user status to identity_pending
        await db
          .update(users)
          .set({
            verificationStatus: "identity_pending",
            updatedAt: new Date().toISOString(),
          })
          .where(eq(users.id, ctx.user.id));

        return {
          success: true,
          nextStep: "identity_verification",
        };
      } catch (error) {
        console.error("Failed to handle payment success:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process payment confirmation",
        });
      }
    }),

  /**
   * Upload verification documents (ID + proof of funds)
   */
  uploadDocuments: protectedProcedure
    .input(
      z.object({
        idDocumentUrl: z.string().url(),
        proofOfFundsUrl: z.string().url(),
        fullName: z.string().min(2),
        dateOfBirth: z.string(),
        address: z.string().min(5),
        fundsAmount: z.number().min(0),
        bankName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get verification record
      const [verification] = await db
        .select()
        .from(buyerVerifications)
        .where(eq(buyerVerifications.userId, ctx.user.id))
        .orderBy(buyerVerifications.createdAt)
        .limit(1);

      if (!verification || !verification.paidAt) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Payment required before uploading documents",
        });
      }

      // Update verification with document info
      await db
        .update(buyerVerifications)
        .set({
          identityFullName: input.fullName,
          identityDateOfBirth: input.dateOfBirth,
          identityAddress: input.address,
          verifiedBalance: input.fundsAmount * 100, // Convert to cents
          bankName: input.bankName,
          identityStatus: "pending",
          bankStatus: "pending",
          updatedAt: new Date().toISOString(),
        })
        .where(eq(buyerVerifications.id, verification.id));

      return {
        success: true,
        message: "Documents uploaded successfully",
      };
    }),

  /**
   * Submit verification for admin review
   */
  submitForReview: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get verification record
    const [verification] = await db
      .select()
      .from(buyerVerifications)
      .where(eq(buyerVerifications.userId, ctx.user.id))
      .orderBy(buyerVerifications.createdAt)
      .limit(1);

    if (!verification || !verification.paidAt) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Payment required",
      });
    }

    if (verification.identityStatus !== "pending" || verification.bankStatus !== "pending") {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Please upload all required documents first",
      });
    }

    // Update user status to review_pending
    await db
      .update(users)
      .set({
        verificationStatus: "review_pending",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, ctx.user.id));

    return {
      success: true,
      message: "Verification submitted for review",
    };
  }),
});
