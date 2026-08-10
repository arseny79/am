# Review Feedback — Slice 2B: Admin Assignment Controls for Dynamic Fields
Date: 2026-08-10
Reviewer: Richard
Ready for Builder: YES

---

## Must Fix

None.

---

## Should Fix

- `client/src/pages/admin/tabs/ListingFieldsTab.tsx:269` — The Scope column displays `Subcategory #N` (raw ID) while vertical and asset type show resolved names. Inconsistent. To fix: load all subcategories upfront with a `listSubcategories` query (or iterate per type) and resolve by ID the same way `verticalName`/`assetTypeName` do. Not blocking for MVP admin tooling, but note it before Slice 2C adds real subcategory content.

- `.claude-flow/neural/stats.json` — Modified in the working tree (Ruflo runtime state). The brief and checkpoint both prohibit committing it. Ensure it is not staged when this slice is committed.

---

## Escalate to Architect

None.

---

## Cleared

**Scope guard.** Only allowed files changed: `server/db.ts`, `server/routers/adminFieldDefinitionsRouter.ts`, `client/src/pages/admin/tabs/ListingFieldsTab.tsx` plus three handoff docs (`ARCHITECT-BRIEF.md`, `BUILD-LOG.md`, `REVIEW-REQUEST.md`). No schema changes, no migrations, no package installs, no seller or public surfaces touched.

**`checkFieldKeyScope` helper (`server/db.ts:1085–1100`).** Exact NULL matching across all three scope dimensions (`verticalId`, `assetTypeId`, `subcategoryId`). Global fields (all-null) do not collide with scoped fields sharing the same key. `excludeId` correctly uses `ne()` so an edited row cannot conflict with itself. Imports (`isNull`, `ne`, `and`) were already present at line 1.

**Options validation — create (`adminFieldDefinitionsRouter.ts:72–73`).** `validateOptions()` fires before insert for `dropdown` and `multi_select`. Rejects: absent/empty string, malformed JSON, non-array JSON, empty array. Each case throws `BAD_REQUEST` with a clear message.

**Options validation — update (effective-state, `adminFieldDefinitionsRouter.ts:119–124`).** `finalFieldType` merges `data.fieldType` with `current.fieldType`; `finalOptions` merges `data.options` with `current.options`. Switching an existing field into an option type without supplying valid options is blocked. Switching away from an option type skips validation correctly.

**Scope collision — create (`adminFieldDefinitionsRouter.ts:75–82`).** `checkFieldKeyScope` called with the intended scope before insert. Throws `CONFLICT` on duplicate.

**Scope collision — update (`adminFieldDefinitionsRouter.ts:127–143`).** Guard fires whenever any of `fieldKey`, `verticalId`, `assetTypeId`, `subcategoryId` is present in the payload. Final key and scope are computed by merging payload values with current DB row. `excludeId = id` prevents self-collision. Logic is correct for all combinations: key change only, scope change only, both, and explicit null-clearing of any dimension.

**Visibility model.** `isPublic` remains derived from `visibilityLevel` via `visibilityLevel === 'public' ? 1 : 0` on both create and update, exactly as before. `visibilityLevel` is the source of truth. Untouched.

**Existing flags.** `showOnCard`, `filterable`, `sortable`, `required`, `isActive`, and the deactivate button are all present and unchanged in the updated table render.

**Client assignment UI.** Cascading selects: choosing a vertical resets `assetTypeId` and `subcategoryId`; choosing an asset type resets `subcategoryId`. `formAssetTypes` correctly switches between `filteredAssetTypes` (vertical-scoped) and `allAssetTypes` (unscoped). Subcategory select renders only when `assetTypeId !== null && subcategories.length > 0`. Sentinel `"_all"` maps to `null` in state and is stored as `null` in the DB. Payload passes all three IDs through on submit. Edit dialog pre-populates from the existing row.

**Taxonomy query binding.** `listVerticals`, `listAssetTypes`, `listSubcategories` all confirmed present on `taxonomyRouter`. Typecheck passed with zero errors — all query shapes are valid at compile time.

**Verification runs.**
- `pnpm run check` — PASSED (zero type errors).
- `pnpm run build` — PASSED (pre-existing large-chunk warning only; no new warnings).
- `git diff --check` — PASSED (zero whitespace errors).

Slice 2B is clear. Signal to Arch: Slice 2B passes.
