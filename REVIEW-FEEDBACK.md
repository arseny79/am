# Review Feedback — Slice 2C: Seed Minimum Diligence Fields by Asset Type
Date: 2026-08-10
Reviewer: Richard
Ready for Builder: YES

---

## Must Fix

None.

---

## Should Fix

None.

---

## Escalate to Architect

None.

---

## Cleared

**Scope guard.** Only allowed application file changed: `scripts/ensure-phase1-production.ts`. Plus three handoff docs (`ARCHITECT-BRIEF.md`, `BUILD-LOG.md`, `REVIEW-REQUEST.md`). Zero changes to `server/db.ts`, routers, client forms, `drizzle/`, migrations, shared schema/types, Railway config, auth, NDA logic, or any seller/public surface. Clean.

**`visibilityLevel` column bootstrap.** `ensureSchema()` CREATE TABLE now includes `visibilityLevel` with the full enum definition. `ensureColumn()` call immediately after ensures legacy databases gain the column without requiring a migration. Column definition in both places is identical. Fresh and legacy database bootstrap confirmed correct.

**`SeedVisibilityLevel` type and mapping.** `SeedVisibilityLevel` is correctly constrained to `"public" | "nda_required" | "seller_approval_required"` — the three seed-appropriate levels. Admin-only and other internal levels are not expressible by the seed type. `getSeedVisibilityLevel()` maps: `isPublic=true` → `"public"`; keys in `NDA_REQUIRED_FIELD_KEYS` → `"nda_required"`; all others → `"seller_approval_required"`. Logic is correct.

**NDA field set.** `jurisdiction_and_incorporation`, `gaming_licenses`, `accepted_markets`, `restricted_markets` are correctly gated at `nda_required`. All remaining non-public fields resolve to `seller_approval_required`. No field resolves to `admin_only` or any other level outside the allowed seed set.

**Visibility persistence in `upsertFieldDefinition`.** Both `isPublic` and `visibilityLevel` are written in both the UPDATE and INSERT paths. `isPublic` preserves current-UI compatibility; `visibilityLevel` stores the granular level for future runtime use. The REVIEW-REQUEST accurately describes this dual-write behaviour.

**Idempotent upsert.** `SELECT id WHERE fieldKey=? AND verticalId=? AND assetTypeId=? AND subcategoryId IS NULL LIMIT 1` is the correct match predicate — no reliance on a DB unique constraint. Found → UPDATE; missing → INSERT. Both paths set `isActive=1`. Reruns are safe on both fresh and seeded databases.

**Common fields vs. brief (13/13).** All required common field categories present: teaser summary (public teaser), transaction structure (deal type), asking price range (public teaser), jurisdiction and incorporation, gaming licences, accepted/restricted markets, annual revenue, EBITDA, fiat/crypto revenue split, fiat/crypto deposit split, ownership/authority confirmation, known disputes and incidents. Brief fully satisfied.

**Operating iGaming specific fields (13/13).** GGR, NGR, monthly active players, monthly FTDs, deposit/withdrawal volume, traffic source breakdown, affiliate revenue concentration, platform/game/payment providers, KYC/AML process, source-code/IP ownership. All brief requirements covered.

**B2B iGaming Technology specific fields (7/7).** Live client count, MRR, largest client revenue concentration, integrations and certifications, code/IP ownership, infrastructure obligations, support obligations. All brief requirements covered.

**Affiliate / Media / Traffic Asset specific fields (7/7).** Monthly verified visitors, GEO traffic mix, monthly FTDs generated, CPA/revenue-share contracts, largest operator revenue concentration, SEO dependency, compliance history. All brief requirements covered.

**Total upsert count.** 3 × 13 common + 13 operating + 7 B2B + 7 affiliate = 66 upserts. Matches the script log message and Bob's plan.

**`showOnCard` and `filterable` are conservative.** `showOnCard=true` on teaser_summary, transaction_structure, asking_price_range only. `filterable=true` on transaction_structure, asking_price_range (common) and seo_dependency (affiliate) only. All sensitive metrics have both flags false.

**No true admin-only fields seeded.** Confirmed by type constraint and by grep: no field resolves to `admin_only`, `specific_buyer_only`, `public_preview`, or `registered_users` in the seeded set. The seller-facing fetch path will not surface internal-review content.

**`assertSeedIntegrity` checks.** Duplicate fieldKey within combined scope detected and thrown. Dropdown/multi_select: options present, valid JSON, array, non-empty — all verified. Forbidden types (`wallet_address`, `contract_address`) blocked. Resolved visibility level validated. Integrity runs per asset type before any DB writes.

**No cross-scope fieldKey collisions.** Grep of all added `fieldKey` values confirms no duplicates across any combined array (common + specific). Operating `monthly_ftds` and affiliate `monthly_ftds_generated` are distinct keys. Clean.

**Pre-existing helpers confirmed present.** `ensureColumn()` at line 77, `getIdBySlug()` at line 217, `mvpVertical` at line 282 — all pre-existing from prior slices. Seed function dependencies are satisfied.

**`subcategoryId = null` throughout.** INSERT uses NULL literal; SELECT uses `IS NULL`. No subcategory complexity introduced.

**Verification runs.**
- `pnpm run check` — PASSED (zero type errors).
- `pnpm run build` — PASSED (pre-existing large-chunk warning only; no new warnings).
- `git diff --check` — PASSED (zero whitespace errors).

Slice 2C is clear. Signal to Arch: Slice 2C passes.
