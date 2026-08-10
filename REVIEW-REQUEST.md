# REVIEW-REQUEST — Slice 3A: Add Explicit Listing Moderation State

Ready for Review: YES
Date: 2026-08-10
Builder: Bob (Claude Code) + Arch finish after max-turn exit
Branch: am-igaming-crypto-mvp
Baseline: f7df9ce

---

## Changed Files

### `drizzle/schema.ts`
Added 6 moderation fields to `listings`:
- `moderationStatus` enum(`pending_review`,`needs_information`,`approved`,`rejected`) default `pending_review`
- `submittedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `rejectionReason`

These are additive and distinct from the existing listing lifecycle `status` and `isPublished`.

### `drizzle/0078_listing_moderation_state.sql`
New additive migration file:
- adds the 6 moderation columns
- backfills `moderationStatus`
  - `isPublished = 1` → `approved`
  - otherwise → `pending_review`
- excludes soft-deleted rows from backfill with `WHERE deletedAt IS NULL`
- no destructive operations

### `server/routers/adminListingRouter.ts`
Extended admin-only listing reads:
- `getAll` input now accepts optional `moderationStatus`
- `getAll` response now includes moderation fields
- `getStats` now returns `byModerationStatus`
- no write/transition workflow added yet

### `client/src/pages/admin/tabs/ListingsTab.tsx`
Admin list visibility only:
- added `ModerationStatus` type and badge maps
- added moderation filter select
- added moderation column in the listings table
- added a pending-review stat card
- existing tier-management UI remains intact

### `ARCHITECT-BRIEF.md`
Builder Plan retained for the reviewed slice.

---

## Behavior

- listings gain explicit moderation metadata without changing public publish behavior
- old published listings backfill to `approved`
- legacy unpublished listings remain readable and backfill to `pending_review`
- admin listing table can see and filter moderation state
- tier-management flow remains unchanged
- no seller/public surfaces expose `reviewNotes` or `rejectionReason`

---

## Verification

- `pnpm run check` — PASS
- `pnpm run build` — PASS (pre-existing chunk warning only)
- `git diff --check` — PASS
- scope guard — reviewable diff includes only:
  - `drizzle/schema.ts`
  - `drizzle/0078_listing_moderation_state.sql`
  - `server/routers/adminListingRouter.ts`
  - `client/src/pages/admin/tabs/ListingsTab.tsx`
  - handoff docs
- migration file is intentionally included in the diff via git intent-to-add so review is not blind to the schema change

---

## Open Questions

1. Migration journal remains untouched, matching the repo’s existing hand-authored migration pattern.
2. Soft-deleted rows are excluded from moderation-status backfill and therefore keep the column default; this seems acceptable for now but worth noting.
