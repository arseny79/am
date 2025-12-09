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

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
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
  if (ctx.user.verificationExpiresAt && ctx.user.verificationExpiresAt < new Date()) {
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
