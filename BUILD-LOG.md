# BUILD-LOG.md

## Operating note

- User-approved execution mode: once a CC slice is independently verified and no user decision is needed, Arch should prepare and launch the next approved slice proactively instead of waiting for another prompt.

## Current focus

- Slice 2A complete with a narrow admin no-regression fix. Pending Richard's review.

## Slice 2A — Idempotent MVP Taxonomy Seed
Status: BUILT — PENDING REVIEW
Date: 2026-08-10
Builder: Bob (Claude Code)
Branch: am-igaming-crypto-mvp
Baseline: e8d35f3

### What Was Done

**`scripts/ensure-phase1-production.ts`**
- Added `seedMvpTaxonomy()` function called from `main()` after existing `seedData()`.
- Bulk `UPDATE verticals SET isActive = 0` — deactivates all legacy verticals without deleting rows.
- Bulk `UPDATE asset_types SET isActive = 0` — same for asset types.
- Bulk `UPDATE subcategories SET isActive = 0` — same for subcategories.
- Upserts MVP launch vertical `crypto-friendly-igaming` (`Crypto-Friendly iGaming`) with `isActive = 1` via `ON DUPLICATE KEY UPDATE`.
- Upserts three MVP launch asset types (`operating-igaming-business`, `b2b-igaming-technology`, `affiliate-media-traffic-asset`) with `isActive = 1`.
- Upserts `vertical_asset_types` links: MVP vertical ↔ each of the three asset types only. Legacy `crypto-web3` links untouched.
- Upserts 5 subcategories per asset type (15 total) with `isActive = 1` using `(assetTypeId, slug)` unique key — no token-only inventory classes.
- Full idempotency: reruns bulk-deactivate then reactivate the MVP set; no duplicates created.

**`server/db.ts`**
- `getAllVerticals()` — now active-only by default, with optional `includeInactive` override for admin callers.
- `getAllAssetTypes()` — now active-only by default, with optional `includeInactive` override for admin callers.
- `getAssetTypesByVertical()` — now active-only by default, with optional `includeInactive` override for admin callers.
- `getSubcategoriesByAssetType()` — added `eq(subcategories.isActive, 1)` to WHERE clause.
- `getVerticalById()`, `getAssetTypeById()` — untouched; legacy listings remain fully readable.

**Admin no-regression fix**
- `server/routers/taxonomyRouter.ts` — added optional `includeInactive` support to `listVerticals` and `listAssetTypes`. Default behavior remains public-safe: active-only unless `includeInactive: true` is passed.
- `client/src/pages/admin/tabs/VerticalsTab.tsx` — admin verticals list now queries `listVerticals({ includeInactive: true })` so inactive legacy rows remain visible and manageable.
- `client/src/pages/admin/tabs/AssetTypesTab.tsx` — admin asset types list, vertical selector and vertical assignment list now query with `includeInactive: true` so the admin taxonomy UI still sees inactive legacy rows.

### Verification

- `pnpm run check` — PASSED (no errors)
- `pnpm run build` — PASSED; only pre-existing large-chunk warning
- `git diff --check` — PASSED (no whitespace errors)
- Scope guard (`git diff --name-only`) — only `ARCHITECT-BRIEF.md`, `scripts/ensure-phase1-production.ts`, `server/db.ts`, `server/routers/taxonomyRouter.ts`, `client/src/pages/admin/tabs/VerticalsTab.tsx`, `client/src/pages/admin/tabs/AssetTypesTab.tsx`, and handoff docs changed
- Grep proof — public taxonomy helpers are active-only by default, while admin tab queries explicitly pass `includeInactive: true`
- Seed proof — `seedMvpTaxonomy`, bulk deactivation UPDATEs, and `crypto-friendly-igaming` slug confirmed in seed script

### Known Gaps / Caveats

- None. Public selectors are narrowed to the launch taxonomy without hiding inactive legacy rows from admin management.

## Slice 1B2 — Remaining Public Copy Rewrite
Status: COMPLETE
Date: 2026-08-10
Builder: Bob (Claude Code)
Branch: am-igaming-crypto-mvp
Baseline: 9528ab3

### What Was Done

- `client/src/pages/HowItWorks.tsx` — full copy rewrite: updated H1 to use `APP_TITLE`; rewrote hero subtitle to iGaming niche; replaced three overview cards with Technology Marketplace / Confidential & Private / Direct Introductions; updated Important Notice from `MSP.Investments` to `APP_TITLE`; replaced MSP seller flow (4 steps) with iGaming concierge flow (submit → manual review & positioning → buyer interest & NDA → diligence & closing); replaced MSP buyer flow with mandate-based buyer flow (share mandate → review curated opportunities → sign NDA & request access → engage directly & acquire); replaced six feature cards — removed Valuation Calculator (TrendingUp icon) and Escrow Integration cards, replaced with Curated Listings, Confidential Access Tiers, Buyer Mandates, Deal Rooms, Document Vault, Seller Access Control; updated "Industry Specialists" disclaimer bullet from MSP to iGaming; updated CTA copy; removed unused `TrendingUp` import, added `APP_TITLE` import.
- `client/src/pages/FAQ.tsx` — full FAQ rewrite: removed Fees & Pricing category (no self-serve tiers, success fees, or escrow claims); removed MSP timeline, listing-tier, Escrow.com, and Professional Directory content; replaced three categories (For Sellers / For Buyers / Platform & Security) with iGaming-appropriate Q&A (For Sellers / For Buyers / Platform & Process); 14 new Q&A entries covering what AM lists, anonymous submission, review process, KYC, mandate flow, public vs approved access, NDA process, diligence responsibility, AM role boundary, no success fees; removed unused `useState` and `ChevronDown` imports; updated hero subtitle from MSP to iGaming.

No changes to `Contact.tsx`, `Login.tsx`, `Signup.tsx`, or `Footer.tsx` — all already consistent with iGaming positioning.

### Verification

- `pnpm run check` — PASSED (no errors)
- `pnpm run build` — PASSED; only pre-existing large-chunk warning (no new warnings)
- `git diff --check` — PASSED (no whitespace errors)
- Grep for prohibited claims (`MSP|Escrow\.com|success fee|paid tier|premium placement|instant valuation|valuation estimate|Professional Directory|Featured \$|Standard \$|Premium \$|3% success|listing tier|weekly fee`) across all six allowed public files — NO MATCHES (one match for "AM does not charge success fees" in FAQ.tsx:80 is a truthful denial, not a claim)
- Scope guard (`git diff --name-only`) — only `ARCHITECT-BRIEF.md`, `client/src/pages/HowItWorks.tsx`, `client/src/pages/FAQ.tsx` changed (plus pre-existing `.claude-flow/neural/stats.json` Ruflo runtime artifact)

### Known Gaps / Caveats

- None. All acceptance criteria met.

---

## Slice 1B1 — iGaming Homepage + Public Route Lockdown
Status: COMPLETE
Date: 2026-08-10
Builder: Bob (Claude Code)
Branch: am-igaming-crypto-mvp
Baseline: 8341a6f

### What Was Done

- `client/index.html` — updated title, description, OG title/description and Twitter title/description to iGaming niche copy. Preserved favicon, canonical, viewport and robots.
- `client/src/config/homepage.ts` — rewrote all fallback homepage content: hero headline/subheadline/description/CTAs for iGaming M&A positioning; three trust signals (Manual Review / Confidential / €250k–€20m); six feature cards (curated opportunities, buyer qualification, confidentiality, iGaming-native diligence, direct introductions, external advisors & closing); replaced Calculator icon with Users to avoid automated-valuation connotation; removed MSP example comment.
- `client/src/pages/Home.tsx` — removed `PremiumListingHero` function, `PremiumListingCard` import and `Loader2` import; updated SEO title and description; updated structured-data fallback descriptions to iGaming niche; rewrote How It Works to concierge sequence (submit → manual review → seller-controlled access → qualified introduction | share mandate → review curated → request access → engage directly); updated bottom CTA section copy. Admin CMS hero overrides preserved.
- `client/src/App.tsx` — removed imports and route registrations for PaymentSuccess (`/payment-success`), PaymentHistory (`/payment-history`), TestEmail (`/test-email`) and NDADemo (`/nda-demo`). Implementation files and backend APIs untouched; old direct URLs fall through to catch-all NotFound.

### Verification

- `pnpm run check` — PASSED (no errors)
- `pnpm run build` — PASSED; only pre-existing large-chunk warning (no new warnings)
- `git diff --check` — PASSED (no whitespace errors)
- Grep for excluded routes/imports in App.tsx (`payment-success|payment-history|nda-demo|test-email|PaymentSuccess|PaymentHistory|NDADemo|TestEmail`) — NO MATCHES
- Grep for prohibited claims in homepage/metadata files (`MSP|Escrow\.com|automated.valuat|success.fee|token.settlement|paid.tier|guaranteed.clos`) — NO MATCHES
- Scope guard (`git diff --name-only HEAD`) — only `ARCHITECT-BRIEF.md`, `client/index.html`, `client/src/App.tsx`, `client/src/config/homepage.ts`, `client/src/pages/Home.tsx` changed (plus pre-existing `.claude-flow/neural/stats.json` Ruflo runtime artifact, not introduced by this slice)

### Known Gaps / Caveats

- None. All acceptance criteria met.

---

## Slice 0B — Normalize AM Ruflo + Three Man Team Harness
Status: COMPLETE
Date: 2026-08-09
Builder: Bob (Claude Code)
Branch: am-igaming-crypto-mvp

### What Was Done
- `CLAUDE.md` — replaced all template placeholders (project, owner, domain); updated Session Start step 1 to reference Ruflo-core token discipline instead of a separate skill file; added default coding mode statement; replaced `[your skills here]` with AM-specific skill list.
- `ARCHITECT.md` — replaced `[Your Project Name]`; fixed Bob spin-up from `BOB.md` → `BUILDER.md`; fixed Richard spin-up from `RICHARD.md` → `REVIEWER.md`; updated token-optimizer step to Ruflo-core in all three Session Start sequences; added `Architect Approval: YES` semantics to Bob spin-up prompt.
- `BUILDER.md` — replaced `[Your Project Name]`; updated Session Start token step; added explicit `Architect Approval: YES` → no interactive wait rule; resolved contradiction in Before You Build step 3 — wait for Arch now only applies when Approval is not YES.
- `REVIEWER.md` — replaced `[Your Project Name]`; updated Session Start token step.
- `.gitignore` — added `.claude-flow/daemon-state.json`, `.claude-flow/*.lock`, `.claude-flow/runtime/` with a comment confirming `.claude/proven-config.json` is intentional and not ignored.

### Verification
- `git diff --name-only`: CLAUDE.md, ARCHITECT.md, BUILDER.md, REVIEWER.md, .gitignore, BUILD-LOG.md, REVIEW-REQUEST.md
- Grep for `[` placeholders in role files: none found
- All referenced filenames (BUILDER.md, REVIEWER.md, REVIEW-REQUEST.md, REVIEW-FEEDBACK.md, SESSION-CHECKPOINT.md, ARCHITECT-BRIEF.md, BUILD-LOG.md) exist
- No files under client/, server/, drizzle/, shared/, scripts/ changed

---

## Slice 1A — Launch-Safe Product Shell
Status: COMPLETE
Date: 2026-08-09
Builder: Bob (Claude Code)
Branch: am-igaming-crypto-mvp

### What Was Done
- `client/src/App.tsx` — route/nav audit and cleanup per Architect brief
- `client/src/components/Footer.tsx` — updated footer links/content for launch-safe shell
- `client/src/components/PublicHeader.tsx` — public nav updated for launch-safe shell
- `client/src/components/StandardHeader.tsx` — authenticated nav updated for launch-safe shell
- `client/src/const.ts` — constants updated to reflect current product positioning
- `client/src/pages/AdminDashboardModular.tsx` — admin tab cleanup per brief
- `client/src/pages/CreateListing.tsx` — replaced stale paid-tier/checkout comments with accurate manual-review submission comment; changed submit button label from "Create Listing" to "Submit for Review"; listingTier=standard compatibility untouched
- `client/src/pages/Dashboard.tsx` — seller dashboard cleanup per brief
- `client/src/pages/admin/tabs/ContentTab.tsx` — content tab cleanup per brief

### Verification
Hermes independently ran:
- `pnpm run check` — passed (no errors)
- `pnpm run build` — passed; emitted only the pre-existing large-chunk warning (no new warnings)
- Static route/nav assertions — passed
- `git diff --check` — passed (no whitespace errors)

---

## Phase 1 — Taxonomy + Crypto Vertical + Wallet Verification
Status: LIVE on Railway
Started: 2026-07-07
Deployed: 2026-07-08

### Result
AM now has the first digital-assets M&A foundation live:
- Digital asset taxonomy/category foundation
- Crypto/Web3 asset types and subcategories
- Wallet verification foundation
- Admin controls for verticals, asset types, chains, and wallet verification
- Seller-side taxonomy selection and wallet verification UI
- “Digital Assets M&A” positioning

### Verification
- Local `pnpm run check` — passed
- Local `pnpm run build` — passed
- Local `pnpm run lint` — passed with warnings only
- Railway deployment — success
- Railway production database setup — success
- Smoke checks — homepage/create/admin routes return 200

## Phase 2 — Dynamic Listing Forms
Status: BUILT — AWAITING HERMES REVIEW + DEPLOY
Started: 2026-07-08
Completed: 2026-07-09
Architect: Hermes
Builder: Claude Code
Reviewer: Hermes (pending)

### What Was Built
- `drizzle/schema.ts` — `field_definitions` + `listing_field_values` tables + Drizzle types
- `drizzle/0073_phase2_field_definitions.sql` — migration SQL (run manually on Railway)
- `server/db.ts` — `getFieldDefinitions`, `createFieldDefinition`, `updateFieldDefinition`, `deactivateFieldDefinition`, `getListingFieldValues`, `upsertListingFieldValue`, `upsertListingFieldValues`
- `server/routers/adminFieldDefinitionsRouter.ts` — admin tRPC router (list/create/update/deactivate)
- `server/routers/listingFieldValuesRouter.ts` — seller/public tRPC router (listDefinitionsForAssetType/getForListing/saveValues)
- `server/routers.ts` — wired both routers
- `client/src/pages/admin/tabs/ListingFieldsTab.tsx` — admin UI for field management
- `client/src/pages/AdminDashboardModular.tsx` — added "Listing Fields" tab
- `client/src/components/ListingEditForm.tsx` — seller-side dynamic field loading and saving

### Verification
- Local `pnpm run check` — PASSED (no errors)
- Local `pnpm run build` — PASSED (client + server)
- No existing MSP flows broken

### Next Step
Hermes reviews, then runs migration on Railway and deploys.

## Phase 2.5 — Public Dynamic Field Display on Listing Detail
Status: BUILT — AWAITING HERMES REVIEW + DEPLOY
Started: 2026-07-13
Completed: 2026-07-13

### What Was Built
Completes the Phase 2 user story: buyer can now see public dynamic field values on the listing detail page.

- `server/db.ts` — `getPublicListingFieldValues(listingId)` — joins listing_field_values + field_definitions (isPublic=1, isActive=1), filters empty values, orders by sortOrder
- `server/routers/listingFieldValuesRouter.ts` — `getPublicForListing` publicProcedure (no auth required)
- `client/src/pages/ListingDetail.tsx` — queries public dynamic fields, renders "Asset Details" card inside Overview tab when fields exist; boolean renders Yes/No, URL renders as link

### Verification
- Local `pnpm run check` — PASSED (no errors)
- Local `pnpm run build` — PASSED (client + server)
- No existing MSP flows broken (additive, card only renders when dynamicFields.length > 0)

## Phase 3A — Visibility Engine Backend Foundation
Status: BUILT LOCALLY — AWAITING COMMIT + DEPLOY
Started: 2026-07-19
Completed: 2026-07-19
Architect: Hermes
Builder: Claude Code + Hermes finish

### What Was Built
- `drizzle/schema.ts` — adds `visibilityLevel` enum fields to `listings`, `listingDocuments`, and `field_definitions`
- `drizzle/0074_phase3_visibility_engine.sql` — additive migration with backfill from legacy `confidentialityLevel` / `accessLevel`
- `server/lib/visibility.ts` — shared visibility levels, legacy mapping helpers, and `canViewVisibilityLevel(...)`
- `server/routers.ts` — listing create/update accept visibility level; listing detail confidentiality masking now uses the shared visibility helper with NDA/access-request fallback
- `server/routers/listingDocumentRouter.ts` — document access now resolves via the shared helper; uploads and access-level changes keep `visibilityLevel` in sync

### Verification
- Local `pnpm run check` — PASSED
- Local `pnpm run build` — PASSED
- Existing listing confidentiality, NDA, and document access flows remain additive/backward-compatible at the backend layer

### Notes
- Claude Code authenticated successfully again and was used as the default coding lane.
- CC completed the migration/schema/helper foundation but hit max-turns on the wiring step; Hermes finished the remaining backend glue directly and re-verified.
- This is backend foundation only. UI/admin controls for selecting listing/file visibility levels are a later slice.

## Phase 3B — Visibility Controls UI/Admin Slice
Status: BUILT LOCALLY — AWAITING COMMIT + DEPLOY
Started: 2026-07-19
Completed: 2026-07-19
Architect: Hermes
Builder: Claude Code + Hermes finish

### What Was Built
- `client/src/pages/CreateListing.tsx` — seller-facing listing visibility selector added (`public`, `registered_users`, `nda_required`, `seller_approval_required`) and synced back to legacy `confidentialityLevel`
- `client/src/components/ListingEditForm.tsx` — same listing visibility selector added for edit flow with backward-compatible confidentiality sync
- `client/src/components/ListingDocumentVault.tsx` — seller-facing document language updated from access-level wording to visibility wording while preserving the current API contract
- `server/routers/adminFieldDefinitionsRouter.ts` — admin field-definition create/update now accept `visibilityLevel` and sync `isPublic` from it
- `client/src/pages/admin/tabs/ListingFieldsTab.tsx` — admin can now set field-definition visibility, see it in the table, and keep legacy `isPublic` derived from the visibility source of truth

### Verification
- Local `pnpm run check` — PASSED
- Local `pnpm run build` — PASSED
- Existing listing/document/backend Phase 3A visibility plumbing still compiles cleanly with the new Phase 3B UI/admin controls

### Notes
- Claude Code was used as the default builder lane again, but one run failed on permission prompts and the next hit max-turns.
- Hermes finished the remaining narrow UI/admin cleanup directly and re-verified.
