// Phase 3A: Shared visibility engine for AM platform
// Centralizes visibility level types, legacy mapping helpers, and access checks.

export const VISIBILITY_LEVELS = [
  'public',
  'public_preview',
  'registered_users',
  'nda_required',
  'seller_approval_required',
  'specific_buyer_only',
  'admin_only',
] as const;

export type VisibilityLevel = typeof VISIBILITY_LEVELS[number];

/** Map legacy listing confidentialityLevel to the new VisibilityLevel. */
export function confidentialityToVisibility(
  level: 'public' | 'nda' | 'private'
): VisibilityLevel {
  switch (level) {
    case 'nda': return 'nda_required';
    case 'private': return 'seller_approval_required';
    default: return 'public';
  }
}

/** Map legacy document accessLevel to the new VisibilityLevel. */
export function accessLevelToVisibility(
  level: 'public' | 'nda_gated' | 'request_only'
): VisibilityLevel {
  switch (level) {
    case 'nda_gated': return 'nda_required';
    case 'request_only': return 'seller_approval_required';
    default: return 'public';
  }
}

export interface VisibilityContext {
  isSeller: boolean;
  isAdmin: boolean;
  isLoggedIn: boolean;
  hasNDA: boolean;
  hasApprovedAccess: boolean;
}

/**
 * Returns true if the viewer described by `ctx` is allowed to access
 * content at the given `level`.
 *
 * Rules (most to least privileged):
 * - Seller always allowed
 * - admin_only: admin only
 * - public / public_preview: everyone
 * - registered_users: must be logged in
 * - nda_required: must have an active NDA
 * - seller_approval_required: must have an approved access request
 * - specific_buyer_only: denied unless seller/admin (future slice will add buyer match)
 */
export function canViewVisibilityLevel(
  level: VisibilityLevel,
  ctx: VisibilityContext
): boolean {
  if (ctx.isSeller) return true;
  if (level === 'admin_only') return ctx.isAdmin;
  if (level === 'public' || level === 'public_preview') return true;
  if (level === 'registered_users') return ctx.isLoggedIn;
  if (level === 'nda_required') return ctx.hasNDA;
  if (level === 'seller_approval_required') return ctx.hasApprovedAccess;
  // specific_buyer_only: reserved for a future slice
  return false;
}
