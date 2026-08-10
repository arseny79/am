# REVIEW-REQUEST — Slice 2A: Idempotent MVP Taxonomy Seed

Date: 2026-08-10
Builder: Bob (Claude Code) + Arch no-regression patch
Branch: am-igaming-crypto-mvp
Ready for Review: YES

---

## Changed Files

### `scripts/ensure-phase1-production.ts`
Added `seedMvpTaxonomy()` and called it from `main()` after the legacy `seedData()` run:
- bulk `UPDATE verticals SET isActive = 0`
- bulk `UPDATE asset_types SET isActive = 0`
- bulk `UPDATE subcategories SET isActive = 0`
- upserts launch vertical `crypto-friendly-igaming` (`Crypto-Friendly iGaming`) with `isActive = 1`
- upserts exactly three launch asset types with `isActive = 1`:
  - `operating-igaming-business`
  - `b2b-igaming-technology`
  - `affiliate-media-traffic-asset`
- upserts `vertical_asset_types` links for the launch vertical ↔ those three launch asset types
- upserts 15 launch subcategories total (5 per launch asset type)
- no token-only inventory classes added
- all upserts use `ON DUPLICATE KEY UPDATE` — reruns stay idempotent and create no duplicates

### `server/db.ts`
Public taxonomy helpers now default to active-only launch rows while preserving legacy by-id reads:
- `getAllVerticals(includeInactive = false)`
- `getAllAssetTypes(includeInactive = false)`
- `getAssetTypesByVertical(verticalId, includeInactive = false)`
- `getSubcategoriesByAssetType(assetTypeId)` remains active-only
- `getVerticalById()` and `getAssetTypeById()` unchanged

### `server/routers/taxonomyRouter.ts`
Added narrow optional admin escape hatch so inactive legacy rows remain manageable:
- `listVerticals` now accepts optional `includeInactive`
- `listAssetTypes` now accepts optional `includeInactive`
- default behavior remains public-safe: active-only unless `includeInactive: true` is passed

### `client/src/pages/admin/tabs/VerticalsTab.tsx`
- admin verticals table now calls `trpc.taxonomy.listVerticals.useQuery({ includeInactive: true })`
- prevents inactive legacy verticals from disappearing from admin after public filtering was introduced

### `client/src/pages/admin/tabs/AssetTypesTab.tsx`
- admin asset types table now calls `trpc.taxonomy.listAssetTypes.useQuery({ includeInactive: true })`
- admin vertical selector now calls `trpc.taxonomy.listVerticals.useQuery({ includeInactive: true })`
- vertical assignment list now calls `trpc.taxonomy.listAssetTypes.useQuery({ verticalId, includeInactive: true })`
- prevents inactive legacy asset types and assignments from disappearing from admin after public filtering was introduced

### `ARCHITECT-BRIEF.md`
- architect-authorized scope widened narrowly to include `taxonomyRouter.ts`, `VerticalsTab.tsx` and `AssetTypesTab.tsx` only to avoid admin regression while keeping public selectors filtered

---

## Behavior

- on production start, legacy taxonomy rows stay in the database but are deactivated from public selector flows via `isActive = 0`
- one active public launch vertical remains: `Crypto-Friendly iGaming`
- exactly three active launch asset types remain for that launch vertical
- launch subcategories are active and seeded idempotently
- public taxonomy selectors stay narrowed to active launch rows by default
- admin taxonomy tabs still see inactive legacy rows by explicitly passing `includeInactive: true`
- by-id taxonomy reads remain unchanged, so legacy listings that already reference old taxonomy IDs stay readable
- no schema change, migration, package install or deploy behavior change beyond the existing start script continuing to run the seed

---

## Verification Results

| Check | Result |
|---|---|
| `pnpm run check` | PASSED |
| `pnpm run build` | PASSED (pre-existing large-chunk warning only) |
| `git diff --check` | PASSED |
| Public taxonomy helpers default to active-only | CONFIRMED in `server/db.ts` |
| Admin tabs explicitly request `includeInactive: true` | CONFIRMED in `VerticalsTab.tsx` and `AssetTypesTab.tsx` |
| Seed proof — bulk deactivate then MVP reactivation | CONFIRMED in `scripts/ensure-phase1-production.ts` |
| Scope guard | CONFIRMED — only `ARCHITECT-BRIEF.md`, `scripts/ensure-phase1-production.ts`, `server/db.ts`, `server/routers/taxonomyRouter.ts`, `client/src/pages/admin/tabs/VerticalsTab.tsx`, `client/src/pages/admin/tabs/AssetTypesTab.tsx` and handoff docs changed |

---

## Open Questions

None. The admin regression was patched before review, so the final slice now preserves both public narrowing and legacy admin visibility.
