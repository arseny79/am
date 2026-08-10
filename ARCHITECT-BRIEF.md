# ARCHITECT-BRIEF — Slice 2A: Idempotent MVP Taxonomy Seed

Date: 2026-08-10
Architect Approval: YES
Branch: `am-igaming-crypto-mvp`
Master plan: `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`
Baseline checkpoint: `e8d35f3`

## Role and method

You are Bob, Builder in AM's Three Man Team.

- Ruflo-core is enabled. Apply Ruflo/SPARC discipline.
- Read `BUILDER.md`, this brief and `SESSION-CHECKPOINT.md` first.
- Add a concise Builder Plan to this brief, then build immediately because Architect Approval is YES.
- Build only this slice.

## Goal

Create the launch-safe taxonomy seed for the approved AM MVP: one public vertical focused on the crypto-friendly iGaming intersection, exactly three launch asset types and useful subcategories.

This slice must preserve old taxonomy rows and old listing references while ensuring the public taxonomy selectors expose only active MVP launch choices.

## Allowed application files

1. `scripts/ensure-phase1-production.ts`
2. `server/db.ts`
3. one narrowly named targeted test under `scripts/` or `server/` if needed

Plus handoff docs only:
- `ARCHITECT-BRIEF.md`
- `BUILD-LOG.md`
- `REVIEW-REQUEST.md`

## Requirements

### 1. Keep the existing production start path

The current production script already runs:
- `node --import tsx scripts/ensure-phase1-production.ts`

Do not rename or move the seed entrypoint unless strictly necessary. Prefer updating the existing script in place.

### 2. Seed the MVP launch taxonomy without destroying legacy rows

In `scripts/ensure-phase1-production.ts`:

- preserve existing tables and existing rows
- do not delete old verticals, asset types or subcategories
- do not repurpose old crypto/Web3 rows or old slugs that existing listings may already reference
- create or reactivate exactly one launch vertical for the approved niche:
  - name: `Crypto-Friendly iGaming`
  - slug: `crypto-friendly-igaming`
- create or reactivate exactly three launch asset types:
  1. `Operating iGaming Business`
  2. `B2B iGaming Technology`
  3. `Affiliate / Media / Traffic Asset`
- link only those three launch asset types to the launch vertical
- add useful subcategories for each launch asset type, but do not add token-only inventory classes
- broad legacy verticals and non-MVP self-serve launch choices should be deactivated from public selectors with `isActive = 0`, not deleted
- the seed must remain idempotent: reruns should update/reactivate the intended launch rows and not create duplicates

### 3. Public taxonomy APIs must expose only active rows

The public taxonomy router already reads through `server/db.ts` helpers.

Update the public-facing taxonomy reads in `server/db.ts` so selector-style reads only return active launch choices:
- `getAllVerticals()` → active verticals only
- `getAllAssetTypes()` → active asset types only
- `getAssetTypesByVertical(verticalId)` → active asset types only
- `getSubcategoriesByAssetType(assetTypeId)` → active subcategories only

Do not break by-id helpers such as `getVerticalById()` or `getAssetTypeById()` — old listings must remain readable even if their legacy taxonomy rows are now inactive.

### 4. Preserve compatibility

- no destructive migration
- no schema changes in this slice
- no UI work in this slice
- no auth, listing, admin, buyer-mandate or dynamic-field logic changes
- no package installs

## Protected areas

Do not modify:
- `client/`
- routers unless absolutely required by a type constraint (prefer not to touch them)
- `drizzle/`, shared types, migrations, env handling, Railway config
- listing creation/edit logic and listing detail rendering

Do not commit, push or deploy.

## Verification

Run:
- `pnpm run check`
- `pnpm run build`
- `git diff --check`
- a targeted proof that the seed stays idempotent or that launch constants/seed behavior are covered by a narrow test, if you add one
- static grep / code proof that public taxonomy helpers now filter `isActive`
- scope guard proving only allowed files and handoff docs changed

## Acceptance criteria

- AM has one active public launch vertical: `Crypto-Friendly iGaming`
- AM has exactly three active launch asset types for that vertical
- useful launch subcategories exist without token-only inventory classes
- broad legacy rows are preserved but hidden from public selectors via `isActive`
- public taxonomy APIs expose only active launch choices
- old taxonomy rows and by-id readers remain intact so old listings stay readable
- typecheck and production build pass

## Completion handoff

- Append Slice 2A to `BUILD-LOG.md` with exact verification.
- Replace `REVIEW-REQUEST.md` with changed files, behavior, verification and any open question.
- Set `Ready for Review: YES`.
