# REVIEW-REQUEST — Slice 2C: Seed Minimum Diligence Fields by Asset Type

Ready for Review: YES
Date: 2026-08-10
Builder: Bob (Claude Code) + Arch visibility persistence fix
Branch: am-igaming-crypto-mvp
Baseline: 3d6c99a

---

## Changed Files

### `scripts/ensure-phase1-production.ts`
New seed section added after `seedMvpTaxonomy`. No application files outside the seed script changed.

#### Bootstrap/schema compatibility
- `field_definitions` CREATE TABLE in `ensureSchema()` now includes `visibilityLevel`
- `ensureColumn(connection, "field_definitions", "visibilityLevel", ...)` added so older databases created before this column existed are upgraded in-place by the production start script

#### Seed data model
- `FieldSeed` remains the typed descriptor for seller-facing seeded field rows
- `SeedVisibilityLevel` added with only three allowed seed outputs:
  - `public`
  - `nda_required`
  - `seller_approval_required`
- `NDA_REQUIRED_FIELD_KEYS` and `getSeedVisibilityLevel(field)` added to map seeded fields onto the correct persisted visibility state

#### Seeded fields
- `commonDiligenceFields` (13) seeded for all 3 launch asset types
- `operatingIGamingFields` (13)
- `b2bIGamingTechFields` (7)
- `affiliateMediaFields` (7)
- total: 66 idempotent upserts across the three launch asset types

#### Integrity checks
`assertSeedIntegrity(fields, assetTypeSlug)` now checks:
- no duplicate `fieldKey` in the same seeded asset-type scope
- dropdown/multi_select options are present, valid JSON arrays and non-empty
- forbidden field types (`wallet_address`, `contract_address`) are blocked
- resolved seed visibility is valid

#### Upsert behavior
`upsertFieldDefinition(connection, verticalId, assetTypeId, field)`:
- `SELECT id ... WHERE fieldKey=? AND verticalId=? AND assetTypeId=? AND subcategoryId IS NULL`
- found row → `UPDATE`
- missing row → `INSERT`
- persists both:
  - `isPublic`
  - `visibilityLevel`
- no reliance on a DB unique constraint for idempotency

#### Runtime behavior after seed
- public teaser fields persist with `visibilityLevel='public'` and `isPublic=1`
- licensing/jurisdiction/market access disclosures persist with `visibilityLevel='nda_required'` and `isPublic=0`
- financial, operating, concentration and compliance-sensitive metrics persist with `visibilityLevel='seller_approval_required'` and `isPublic=0`
- no true admin-only internal-review fields are seeded into the seller-facing dynamic field flow

### `ARCHITECT-BRIEF.md`
Builder Plan present; final slice now satisfies the brief's explicit `public` / `nda_required` / `seller_approval_required` visibility requirement.

---

## Behavior

- three launch asset types gain seller-facing dynamic field definitions through the existing field-definition system
- rerunning the start script does not create duplicate rows
- seeded rows now carry explicit visibility levels, not just `isPublic`
- bootstrap SQL now ensures `visibilityLevel` exists on fresh and legacy databases
- current public listing exposure still depends on `isPublic=1`, so the more granular visibility levels are stored for future runtime use without breaking current behavior

---

## Verification

- `pnpm run check` — PASS
- `pnpm run build` — PASS (existing chunk warning only)
- `git diff --check` — PASS
- integrity proof from the seed logic:
  - all 3 asset-type combined arrays passed uniqueness and option validation
  - forbidden token-only field types blocked
  - resolved seed visibility levels valid
- scope guard:
  - changed application file only: `scripts/ensure-phase1-production.ts`
  - plus handoff docs only

---

## Open Questions

None. Arch fixed the missing `visibilityLevel` persistence before review, so this is the final slice state to assess.