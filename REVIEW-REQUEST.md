# REVIEW-REQUEST — Slice 2B: Admin Assignment Controls for Dynamic Fields

Ready for Review: YES
Date: 2026-08-10
Builder: Bob (Claude Code) + Arch finish after max-turn exit
Branch: am-igaming-crypto-mvp
Baseline: 262f2d0

---

## Changed Files

### `server/db.ts`
Added `checkFieldKeyScope(fieldKey, scope, excludeId?)` helper:
- exact-scope duplicate detection across `(verticalId, assetTypeId, subcategoryId)`
- exact NULL matching for global-vs-scoped fields
- optional `excludeId` so an edited row does not collide with itself

### `server/routers/adminFieldDefinitionsRouter.ts`
Expanded create/update validation:
- added `TRPCError`-based options validation for `dropdown` and `multi_select`
- malformed JSON, non-array JSON and empty arrays are rejected
- create checks scoped field-key collisions before insert
- update now loads the current row, computes final field type + final options and validates the effective state, so switching a field into an option-based type without valid options is blocked
- update also computes final scope and blocks duplicate field keys within that exact scope
- `visibilityLevel` remains the source of truth; `isPublic` is still derived from it exactly as before

### `client/src/pages/admin/tabs/ListingFieldsTab.tsx`
Added end-to-end assignment UI and table scope context:
- `FieldDefinition` and `FormState` now include `verticalId`, `assetTypeId`, `subcategoryId`
- dialog now includes cascading Vertical → Asset Type → optional Subcategory selects
- selecting a vertical resets asset type + subcategory; selecting an asset type resets subcategory
- asset type options now respond correctly to selected vertical via a scoped taxonomy query, not a client-side cast on the wrong shape
- subcategories still load on demand from the selected asset type
- table now includes a Scope column showing vertical name, asset type name and subcategory ID, or `Global` when unscoped
- all existing visibility/flag/deactivate controls remain intact

### `ARCHITECT-BRIEF.md`
Builder Plan retained and updated to reflect the final vertical-scoped asset-type query approach.

---

## Behavior

- admin can create and edit a field definition with vertical, asset type and optional subcategory scope
- assignment is visible in the admin table and dialog flow
- malformed options JSON is rejected for option-based field types
- switching an existing field into an option-based type without valid options is rejected
- duplicate `fieldKey` within the same exact scope is rejected
- visibility controls still derive `isPublic` from `visibilityLevel` exactly as before
- no schema changes, migrations, package installs or seller/public flow changes

---

## Verification

- `pnpm run check` — PASS (zero type errors)
- `pnpm run build` — PASS (existing large-chunk warning only, no new warnings)
- `git diff --check` — PASS
- scope guard — changed app files only: `server/db.ts`, `server/routers/adminFieldDefinitionsRouter.ts`, `client/src/pages/admin/tabs/ListingFieldsTab.tsx`
- targeted proof from code path review:
  - scoped duplicate field-key blocking present on create and update
  - effective-state option validation present on create and update
  - vertical-scoped asset-type query now uses `listAssetTypes({ verticalId, includeInactive: true })`

---

## Open Questions

None. Bob’s max-turn partial left two real gaps; both were fixed before review.