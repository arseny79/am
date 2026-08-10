# Review Feedback — Slice 3A: Add Explicit Listing Moderation State
Date: 2026-08-10
Reviewer: Richard
Ready for Builder: YES

---

## Must Fix

None.

---

## Should Fix

- `client/src/pages/admin/tabs/ListingsTab.tsx:137` — Stats grid is `grid-cols-2 md:grid-cols-4` with 5 cards. The new "Pending Review" card overflows to its own row on desktop (orphaned card). Not broken, just visually loose. Fix inline: expand to `grid-cols-2 md:grid-cols-5` or move the moderation card into a deliberate secondary row.

- `server/routers/adminListingRouter.ts:69` — `as typeof query` cast works around Drizzle's conditional `.where()` type inference. Typecheck passes, no functional concern. If this conditional-where pattern recurs in future slices, abstract it into a shared helper rather than repeating the cast.

- `.claude-flow/neural/stats.json` — File is tracked by git, currently modified and unstaged. SESSION-CHECKPOINT explicitly prohibits committing generated `.claude-flow` runtime state. Not staged now, but one careless `git add .` would include it. Add to `.gitignore` to close the gap permanently.

---

## Escalate to Architect

None.

---

## Cleared

Reviewed `drizzle/0078_listing_moderation_state.sql`, `drizzle/schema.ts`, `server/routers/adminListingRouter.ts`, and `client/src/pages/admin/tabs/ListingsTab.tsx` against baseline `2ab3534` and ARCHITECT-BRIEF.md Slice 3A.

**Schema / migration.** All 6 moderation fields appended additively to `listings` at lines 652–657. Migration `0078` is correctly numbered (follows `0077`). Uses additive `ADD COLUMN` only — no destructive operations. Backfill correctly sets `isPublished = 1` rows to `approved` and non-deleted unpublished rows to `pending_review` via `WHERE deletedAt IS NULL`. Soft-deleted rows receive the column default `pending_review` from MySQL's ADD COLUMN behaviour — this is the documented open question in REVIEW-REQUEST and is acceptable.

**Backend read surface.** `getAll` accepts optional `moderationStatus` filter via zod enum. Response select includes all 6 moderation fields. `getStats` returns `byModerationStatus` counts. All three modified procedures are behind `adminProcedure`. No write/transition workflow added, matching brief's scope boundary. Verified `reviewNotes` and `rejectionReason` are selected only in the admin router.

**Public/seller exposure audit.** Pre-existing wildcard `.select().from(listings)` calls in `ndaSigningRouter.ts` (lines 84, 518) were inspected: both load the listing row server-side to extract `businessName` for NDA template rendering and email notifications only. Neither call returns the listing object or any moderation field to the client. `savedListingsRouter.ts` does not query the `listings` table directly. No other router was changed. The brief requirement — "rejection/internal notes must not appear in any public or seller-facing response" — is satisfied.

**Admin UI.** `ModerationStatus` type, badge maps (`moderationLabels`, `moderationColors`, `moderationIcons`), moderation filter dropdown, "Pending Review" stat card, and "Moderation" table column added correctly. `reviewNotes` and `rejectionReason` are in the query response payload but not rendered anywhere in the component — correct. Tier management dialog and mutation are untouched.

**Separation of concerns.** `moderationStatus` is orthogonal to existing `status` enum (`draft`, `active`, `under_negotiation`, `sold`, `withdrawn`) and `isPublished`. Neither existing field was altered.

**Scope guard.** Only allowed application files changed: `drizzle/schema.ts`, `drizzle/0078_listing_moderation_state.sql`, `server/routers/adminListingRouter.ts`, `client/src/pages/admin/tabs/ListingsTab.tsx`. Plus three handoff docs (`ARCHITECT-BRIEF.md`, `BUILD-LOG.md`, `REVIEW-REQUEST.md`). No protected areas touched. No new packages installed.

**`boolToInt` import** in `adminListingRouter.ts` is pre-existing from baseline `2ab3534`, not introduced by Bob.

**Verification.** `pnpm run check`: PASS (zero type errors). `pnpm run build`: PASS (pre-existing chunk size warning only, no new warnings). `git diff --check`: PASS (zero whitespace errors). Migration sequence: 0078 follows 0077 correctly.

Slice 3A is clear. Signal to Arch: Slice 3A passes.
