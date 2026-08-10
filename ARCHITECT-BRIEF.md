# ARCHITECT-BRIEF — Slice 2C: Seed Minimum Diligence Fields by Asset Type

Date: 2026-08-10
Architect Approval: YES
Branch: `am-igaming-crypto-mvp`
Master plan: `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`
Baseline checkpoint: `3d6c99a`

## Role and method

You are Bob, Builder in AM's Three Man Team.

- Ruflo-core is enabled. Apply Ruflo/SPARC discipline.
- Read `BUILDER.md`, this brief and `SESSION-CHECKPOINT.md` first.
- Add a concise Builder Plan to this brief, then build immediately because Architect Approval is YES.
- Build only this slice.

## Goal

Seed the minimum seller-facing diligence field definitions for the three launch asset types using the existing dynamic-field system.

This is a seed/data-definition slice, not a seller-form redesign. Use the current field-definition system as it exists today.

## Important implementation constraint

The current seller-facing fetch path is:
- `listingFieldValues.listDefinitionsForAssetType`
- which calls `db.getFieldDefinitions({ assetTypeId, subcategoryId?, activeOnly: true })`

That means:
- asset-type scoped field definitions work today
- vertical-only/global fallback is not currently merged in that fetch path
- true admin-only internal-review fields are NOT appropriate to seed in this slice, because current seller-facing field loading would surface them

So for this slice:
- seed seller-supplied diligence fields scoped to the launch asset type
- use public / `nda_required` / `seller_approval_required` visibility levels where appropriate
- do **not** seed internal review notes or other truly admin-only-only workflow fields yet; those belong in the later moderation/admin slice

## Allowed application files

1. `scripts/ensure-phase1-production.ts`
2. one narrowly targeted test under `scripts/` or `server/` if useful

Plus handoff docs only:
- `ARCHITECT-BRIEF.md`
- `BUILD-LOG.md`
- `REVIEW-REQUEST.md`

## Requirements

### 1. Seed field definitions through the start script

In `scripts/ensure-phase1-production.ts`:

- continue using the existing production start hook path
- add a new seed step after taxonomy seeding for launch field definitions
- seed field definitions only for the three launch asset types created in Slice 2A:
  - `operating-igaming-business`
  - `b2b-igaming-technology`
  - `affiliate-media-traffic-asset`
- assign each seeded field definition to the launch vertical and the relevant launch asset type
- use `subcategoryId = null` in this slice unless a subcategory-specific field is truly necessary (prefer not to introduce that complexity here)
- seed idempotently without relying on a DB unique constraint that does not exist on `(fieldKey, verticalId, assetTypeId, subcategoryId)`
  - implement explicit raw-SQL or helper-based “find existing by exact scope + fieldKey, then update-or-insert” behavior
  - reruns must not create duplicates

### 2. Seed the common seller-facing diligence set for each launch asset type

For each of the three launch asset types, seed appropriate common fields covering:
- transaction structure
- asking range
- jurisdiction and licenses
- accepted/restricted markets
- annual revenue
- EBITDA
- fiat versus crypto revenue/deposit share
- ownership/authority confirmation
- known disputes, regulatory issues or security incidents
- public teaser summary

Interpret the visibility rule like this in the current system:
- public: teaser summary and broad-range teaser fields only
- `nda_required` or `seller_approval_required`: sensitive commercial/operating metrics
- do not seed true admin-only internal notes in this slice

### 3. Seed asset-type-specific fields

Also seed:

#### Operating iGaming Business
- GGR
- NGR
- monthly active players
- FTDs
- deposit/withdrawal volume
- traffic source and affiliate concentration
- platform/game/payment providers
- KYC/AML process
- source-code/IP ownership

#### B2B iGaming Technology
- live clients and recurring revenue
- client concentration
- integrations and certifications
- code ownership
- infrastructure/support obligations

#### Affiliate / Media / Traffic Asset
- verified traffic and GEO mix
- FTDs
- CPA/revenue-share contracts
- operator concentration
- SEO dependency
- compliance history

### 4. Keep seeded fields compatible with the current UI

- use field types already supported by the current dynamic form renderer
- for dropdown/multi_select fields, store valid JSON array options strings
- prefer clear seller-facing labels and practical help text
- keep `showOnCard`, `filterable` and `sortable` conservative unless a field clearly belongs there

### 5. Add deterministic seed integrity checks

Inside the seed script, add a narrow integrity check for the field-definition seed data before writing:
- no duplicate `fieldKey` within the same asset-type scope
- required option-based fields have valid option arrays
- no forbidden token-only inventory classes are introduced

This check can be a runtime assertion/helper in the script; no broad test harness work is needed.

## Protected areas

Do not modify:
- `server/db.ts`
- routers, client forms, seller/public UI, admin tabs
- `drizzle/`, migrations, shared schema/types, Railway config
- any auth, NDA, visibility or marketplace logic outside the seed script

Do not commit, push or deploy.

## Verification

Run:
- `pnpm run check`
- `pnpm run build`
- `git diff --check`
- proof from the script that the seed is idempotent and integrity-checked
- scope guard proving only allowed files and handoff docs changed

## Acceptance criteria

- launch asset types have seeded seller-facing diligence fields through the dynamic-field system
- seeded fields are idempotent on rerun and create no duplicates
- common and asset-type-specific diligence fields are present
- public teaser/broad-range fields are marked public only where appropriate
- sensitive metrics are non-public and aligned to current visibility levels
- no true admin-only internal review fields are seeded into the seller-facing dynamic field flow
- typecheck and production build pass

## Builder Plan (Bob)

### What I am building

A new `seedMvpDiligenceFields(connection)` function in `scripts/ensure-phase1-production.ts`, called after `seedMvpTaxonomy`. It seeds seller-facing dynamic field definitions for all three launch asset types using the existing `field_definitions` table and raw-SQL explicit upsert (SELECT then UPDATE-or-INSERT) because no unique constraint exists on `(fieldKey, verticalId, assetTypeId, subcategoryId)`.

### Field data layout

- `commonDiligenceFields` (13 fields, seeded for all 3 asset types): teaser_summary (public), transaction_structure (public, filterable), asking_price_range (public, filterable), jurisdiction_and_incorporation, gaming_licenses, accepted_markets, restricted_markets, annual_revenue_usd, ebitda_usd, fiat_crypto_revenue_split, fiat_crypto_deposit_split, ownership_confirmation (required boolean), known_disputes_or_incidents
- `operatingIGamingFields` (13 fields): ggr_monthly_usd, ngr_monthly_usd, monthly_active_players, monthly_ftds, monthly_deposit_volume_usd, monthly_withdrawal_volume_usd, traffic_source_breakdown, affiliate_revenue_concentration, platform_provider, game_providers, payment_providers, kyc_aml_process, source_code_ip_ownership
- `b2bIGamingTechFields` (7 fields): live_client_count, monthly_recurring_revenue_usd, largest_client_revenue_concentration, integrations_and_certifications, code_ownership, infrastructure_obligations, support_obligations
- `affiliateMediaFields` (7 fields): monthly_visitors_verified, geo_traffic_mix, monthly_ftds_generated, cpa_rev_share_contracts, largest_operator_revenue_concentration, seo_dependency, compliance_history

Total: 66 upserts (3 × 13 common + 13 + 7 + 7 specific)

### Visibility mapping (current schema)

`isPublic = 1` → public teaser/broad fields (teaser_summary, transaction_structure, asking_price_range)
`isPublic = 0` → all sensitive commercial/operating metrics (NDA-gated in practice)

### Integrity check

`assertSeedIntegrity(fields, assetTypeSlug)` runs before any DB writes per asset type:
- duplicate fieldKey in same scope → throw
- dropdown/multi_select with missing/malformed/empty options → throw
- `wallet_address` or `contract_address` fieldType in iGaming seed → throw (forbidden token-only class)

### Idempotent upsert

`upsertFieldDefinition(connection, verticalId, assetTypeId, field)`:
- `SELECT id WHERE fieldKey=? AND verticalId=? AND assetTypeId=? AND subcategoryId IS NULL LIMIT 1`
- If found → `UPDATE ... WHERE id=?`
- If not → `INSERT ... subcategoryId=NULL`

### Decisions

- `subcategoryId = NULL` for all seeds (brief instructs to avoid subcategory complexity here)
- No `showOnCard` on sensitive metrics; `showOnCard=true` on teaser_summary, transaction_structure, asking_price_range only
- `filterable=true` on transaction_structure, asking_price_range, seo_dependency only
- `sortable=true` on revenue/volume/count fields (non-public; useful when buyers have access)
- No new files — all changes in `scripts/ensure-phase1-production.ts`

### Uncertainty

None. Schema is clear from the existing CREATE TABLE in the same file. Field types are constrained to the existing enum.

## Completion handoff

- Append Slice 2C to `BUILD-LOG.md` with exact verification.
- Replace `REVIEW-REQUEST.md` with changed files, behavior, verification and any open question.
- Set `Ready for Review: YES`.
