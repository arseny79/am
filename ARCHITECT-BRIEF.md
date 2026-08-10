# ARCHITECT-BRIEF — Slice 2B: Admin Assignment Controls for Dynamic Fields

Date: 2026-08-10
Architect Approval: YES
Branch: `am-igaming-crypto-mvp`
Master plan: `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`
Baseline checkpoint: `262f2d0`

## Role and method

You are Bob, Builder in AM's Three Man Team.

- Ruflo-core is enabled. Apply Ruflo/SPARC discipline.
- Read `BUILDER.md`, this brief and `SESSION-CHECKPOINT.md` first.
- Add a concise Builder Plan to this brief, then build immediately because Architect Approval is YES.
- Build only this slice.

## Goal

Add end-to-end admin controls so a dynamic field definition can be assigned to:
- a vertical
- an asset type
- an optional subcategory

This slice is about assignment, validation and preserving the current visibility model. Do not seed diligence content yet — that is Slice 2C.

## Allowed application files

1. `client/src/pages/admin/tabs/ListingFieldsTab.tsx`
2. `server/routers/adminFieldDefinitionsRouter.ts`
3. `server/db.ts` if a narrow helper/validation query is needed
4. one targeted test under `server/` if useful

Plus handoff docs only:
- `ARCHITECT-BRIEF.md`
- `BUILD-LOG.md`
- `REVIEW-REQUEST.md`

## Requirements

### 1. Admin UI: assignment controls

In `client/src/pages/admin/tabs/ListingFieldsTab.tsx`:

- add controls for selecting vertical, asset type and optional subcategory in the create/edit dialog
- use the existing taxonomy queries already available in the app; do not build new taxonomy UI from scratch
- asset type options should respond to the selected vertical where practical
- subcategory options should respond to the selected asset type where practical
- existing visibility controls remain the source of truth and must stay intact
- existing show-on-card, filterable, sortable, required and active flags must stay intact
- the table should surface assignment context clearly enough for an admin to understand each field's scope
- do not redesign the whole admin tab; keep this as a narrow extension of the current table/dialog pattern

### 2. Backend: validate scope and options

In `server/routers/adminFieldDefinitionsRouter.ts` and/or a narrow `server/db.ts` helper:

- support saving `verticalId`, `assetTypeId` and `subcategoryId` cleanly on create and update
- validate options JSON when `fieldType` is `dropdown` or `multi_select`
  - malformed JSON must be rejected
  - non-array JSON must be rejected
  - empty arrays should be rejected for those field types
- for non-option field types, empty or absent options should be acceptable
- prevent duplicate `fieldKey` collisions within the intended scope
  - same `fieldKey` should not be allowed twice for the same `(verticalId, assetTypeId, subcategoryId)` scope
  - editing an existing field should not conflict with itself
- keep `visibilityLevel` as the source of truth, with `isPublic` derived from it exactly as today

### 3. Preserve current behavior

- no schema changes in this slice
- no diligence-field seeding in this slice
- no seller-facing form changes in this slice
- no public taxonomy or marketplace changes in this slice
- no package installs

## Protected areas

Do not modify:
- `scripts/ensure-phase1-production.ts`
- `drizzle/`, migrations, shared schema/types, Railway config
- listing create/edit seller UI, public listing detail pages, buyer mandate pages
- any auth, NDA, visibility or deal-room logic outside field-definition assignment

Do not commit, push or deploy.

## Verification

Run:
- `pnpm run check`
- `pnpm run build`
- `git diff --check`
- a targeted proof that malformed options JSON is rejected and duplicate scoped field keys are blocked
- scope guard proving only allowed files and handoff docs changed

## Acceptance criteria

- admin can create and edit a field definition with vertical, asset type and optional subcategory assignment
- assignment is visible in the admin table/dialog flow
- malformed option JSON is blocked for option-based field types
- duplicate `fieldKey` within the same scope is blocked
- visibility controls still behave exactly as before
- no regression to existing field definitions
- typecheck and production build pass

## Completion handoff

- Append Slice 2B to `BUILD-LOG.md` with exact verification.
- Replace `REVIEW-REQUEST.md` with changed files, behavior, verification and any open question.
- Set `Ready for Review: YES`.
