# Review Feedback — Slice 2A: Idempotent MVP Taxonomy Seed
Date: 2026-08-10
Reviewer: Richard
Ready for Builder: YES

---

## Must Fix

None.

---

## Should Fix

- `server/routers/taxonomyRouter.ts:7–10` — `includeInactive` flag is on `publicProcedure`. Any unauthenticated caller can pass `{ includeInactive: true }` and enumerate inactive legacy taxonomy rows. Taxonomy metadata is not sensitive and this design was sanctioned by the brief (§3a: "minimal scope"), so it does not block. When admin procedures are consolidated in a future slice, this should migrate to an `adminProcedure`.

---

## Escalate to Architect

None.

---

## Cleared

**Scope guard.** Only the eight files listed in the brief changed — five application files (`scripts/ensure-phase1-production.ts`, `server/db.ts`, `server/routers/taxonomyRouter.ts`, `client/src/pages/admin/tabs/VerticalsTab.tsx`, `client/src/pages/admin/tabs/AssetTypesTab.tsx`) plus three handoff docs. No schema changes, no migrations, no package installs, no unrelated surfaces touched.

**Seed correctness and idempotency.** `seedMvpTaxonomy()` runs after `seedData()`. It bulk-deactivates all verticals, asset types and subcategories (`UPDATE … SET isActive = 0`), then upserts the MVP vertical, three asset types, vertical-to-asset-type links and 15 subcategories using `ON DUPLICATE KEY UPDATE … isActive = 1`. On any rerun, the bulk deactivation runs first, then MVP rows are reactivated — final state is deterministic regardless of prior run count or legacy row state.

**MVP taxonomy content.** One launch vertical (`Crypto-Friendly iGaming` / `crypto-friendly-igaming`). Exactly three launch asset types: `Operating iGaming Business`, `B2B iGaming Technology`, `Affiliate / Media / Traffic Asset`. Fifteen subcategories (5 per type). No token-only inventory classes present. Subcategory unique key is `(assetTypeId, slug)` — no cross-type slug collision risk with any legacy row.

**Public filtering.** `getAllVerticals()`, `getAllAssetTypes()`, `getAssetTypesByVertical()` default to `includeInactive = false`, applying `eq(isActive, 1)` at the ORM layer. `getSubcategoriesByAssetType()` filters `isActive = 1` unconditionally. `getVerticalById()` and `getAssetTypeById()` untouched — legacy listing reads remain intact.

**Admin no-regression.** `VerticalsTab.tsx:53` and `AssetTypesTab.tsx:57–58,399` all pass `{ includeInactive: true }`. Inactive legacy rows remain visible and manageable in admin taxonomy tabs.

**Verification runs.**
- `pnpm run check` — PASSED (clean, no type errors).
- `pnpm run build` — PASSED (pre-existing large-chunk warning only).
- `git diff --check` — PASSED (zero whitespace errors).

Slice 2A is clear. Signal to Arch: Slice 2A passes.
