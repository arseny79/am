# ARCHITECT-BRIEF — Slice 3A: Add Explicit Listing Moderation State

Date: 2026-08-10
Architect Approval: YES
Branch: `am-igaming-crypto-mvp`
Master plan: `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`
Baseline checkpoint: `f7df9ce`

## Role and method

You are Bob, Builder in AM's Three Man Team.

- Ruflo-core is enabled. Apply Ruflo/SPARC discipline.
- Read `BUILDER.md`, this brief and `SESSION-CHECKPOINT.md` first.
- Add a concise Builder Plan to this brief, then build immediately because Architect Approval is YES.
- Build only this slice.

## Goal

Add an explicit moderation state to listings so AM can distinguish seller submission review from listing lifecycle/publication.

This slice is additive foundation only:
- schema + migration
- backend read/update plumbing for moderation metadata
- admin list visibility of the new moderation state

Do **not** implement the full approve/request-info/reject action flow yet. That is the next slice.

## Allowed application files

1. `drizzle/schema.ts`
2. one new additive migration SQL file, expected next number after current migrations
3. `server/routers/adminListingRouter.ts`
4. `server/db.ts` or one narrow helper module if needed
5. `client/src/pages/admin/tabs/ListingsTab.tsx`
6. one targeted test under `server/` if useful

Plus handoff docs only:
- `ARCHITECT-BRIEF.md`
- `BUILD-LOG.md`
- `REVIEW-REQUEST.md`

## Additive model

Add listing moderation fields:
- `moderationStatus`: `pending_review`, `needs_information`, `approved`, `rejected`
- `submittedAt`
- `reviewedAt`
- `reviewedBy`
- `reviewNotes`
- `rejectionReason`

These fields are distinct from:
- existing listing `status` (`draft`, `active`, `under_negotiation`, `sold`, `withdrawn`)
- existing `isPublished`

## Requirements

### 1. Schema + migration

In `drizzle/schema.ts` and the new migration:

- add the moderation fields to `listings`
- keep the change additive
- backfill safely in migration SQL:
  - currently published listings should backfill to `approved`
  - unpublished legacy listings may backfill to `pending_review`
- do not delete or rewrite any legacy listing row
- do not break existing listing reads/writes

### 2. Backend read surface

In `server/routers/adminListingRouter.ts` and/or a narrow DB helper:

- include the moderation fields in the admin listing list response
- include moderation counts in admin stats if practical within scope
- if a narrow backend mutation/helper is needed to initialize or update moderation metadata for future slices, keep it internal and additive
- do not implement the full transition workflow yet

### 3. Admin list visibility

In `client/src/pages/admin/tabs/ListingsTab.tsx`:

- surface the moderation state clearly in the listings table
- add a moderation filter if it is low-cost and fits the existing filter pattern
- keep the current listing-tier management behavior working
- do not redesign the admin tab into the full moderation console yet

### 4. Safety rules

- seller cannot self-approve or publish via this slice
- rejection/internal notes must not appear in any public or seller-facing response
- no public marketplace behavior change in this slice
- no buyer-facing behavior change in this slice
- no package installs

## Protected areas

Do not modify:
- Create Listing, ListingEditForm, public listing pages, marketplace pages or buyer mandate pages
- listingFieldValues router or diligence seed logic
- auth, NDA, deal-room, access-request or payment logic
- unrelated admin tabs

Do not commit, push or deploy.

## Verification

Run:
- `pnpm run check`
- `pnpm run build`
- `git diff --check`
- scope guard proving only allowed files and handoff docs changed
- migration/read proof that old published listings backfill safely and the admin list can read the new moderation fields

## Acceptance criteria

- listings gain explicit moderation fields with additive schema + migration
- old published listings backfill safely to an approved moderation state
- unpublished legacy listings remain readable and are not broken by the new fields
- admin listings surface can see the moderation state
- existing tier-management behavior still works
- no public or seller-facing regression
- typecheck and production build pass

## Completion handoff

- Append Slice 3A to `BUILD-LOG.md` with exact verification.
- Replace `REVIEW-REQUEST.md` with changed files, behavior, verification and any open question.
- Set `Ready for Review: YES`.
