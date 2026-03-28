import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

/** Roles that have any kind of admin access */
export const ADMIN_ROLES = ['admin', 'superadmin', 'sales', 'support'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** All admin roles (any level of access) */
export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || !(ADMIN_ROLES as readonly string[]).includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/** Superadmin only — platform configuration, admin management */
export const superAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'superadmin') {
      throw new TRPCError({ code: "FORBIDDEN", message: "Superadmin access required." });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/** Admin + superadmin — KYC, listings, user management */
export const seniorAdminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || !(['admin', 'superadmin'] as string[]).includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);

/**
 * Middleware that requires email verification.
 * Users must verify their email before performing protected actions.
 */
const requireEmailVerified = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Check if email is verified
  if (!ctx.user.emailVerified) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "EMAIL_NOT_VERIFIED",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Middleware that requires KYC verification.
 * Users must complete KYC (manual or Stripe Identity) before performing protected actions.
 */
const requireKYCVerified = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Check if email is verified first
  if (!ctx.user.emailVerified) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "EMAIL_NOT_VERIFIED",
    });
  }

  // Check if KYC is verified (either manual KYC or Stripe Identity)
  const isKYCVerified = ctx.user.kycVerified || ctx.user.stripeIdentityVerified;
  
  if (!isKYCVerified) {
    // Check if KYC is pending review
    if (ctx.user.kycStatus === 'pending') {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "KYC_PENDING_REVIEW",
      });
    }
    
    // Check if KYC was rejected
    if (ctx.user.kycStatus === 'rejected') {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "KYC_REJECTED",
      });
    }
    
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "KYC_NOT_VERIFIED",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Middleware that requires user to be verified.
 * Only users with verificationStatus === "verified" can proceed.
 * This ensures trust and security for marketplace transactions.
 */
const requireVerified = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Check if user is verified
  if (ctx.user.verificationStatus !== "verified") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must complete verification to perform this action. Verification ensures trust and security for all marketplace participants. Please visit the Verification page to get started.",
    });
  }

  // Check if verification has expired (12 months validity)
  if (ctx.user.verificationExpiresAt && new Date(ctx.user.verificationExpiresAt) < new Date()) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Your verification has expired. Please renew your verification to continue using the marketplace.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

/**
 * Procedure that requires email verification.
 * Use this for basic protected actions that need email confirmation.
 */
export const emailVerifiedProcedure = protectedProcedure.use(requireEmailVerified);

/**
 * Procedure that requires KYC verification (email + KYC).
 * Use this for any action that involves:
 * - Creating or managing listings
 * - Requesting access to private listings
 * - Creating buyer requests
 * - Initiating deals
 * - Sending messages in deals
 * - Submitting offers
 */
export const kycVerifiedProcedure = protectedProcedure.use(requireKYCVerified);

/**
 * Procedure that requires verified user.
 * Use this for any action that involves:
 * - Creating or managing listings
 * - Requesting access to private listings
 * - Creating buyer requests
 * - Initiating deals
 * - Sending messages
 * - Submitting offers
 */
export const verifiedProcedure = protectedProcedure.use(requireVerified);
