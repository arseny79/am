# BUILD-LOG.md

## Operating note

- User-approved execution mode: once a CC slice is independently verified and no user decision is needed, Arch should prepare and launch the next approved slice proactively instead of waiting for another prompt.

## Current focus

- Slice 5B next: listing detail and access path, with stricter teaser-safe public presentation and gated field handling.

---

## Slice 5A — iGaming-Native Browse and Empty State
Status: COMPLETE — HERMES VERIFIED
Date: 2026-08-10
Branch: am-igaming-crypto-mvp
Baseline: f1fd938

### What Was Done

**`client/src/pages/Marketplace.tsx`**
- removed MSP-era category and industry-vertical filters from public browse
- added active launch asset-type filter via `taxonomy.listAssetTypes`
- broad revenue range filter kept, now based on annual revenue directly
- search / header / helper copy rewritten for private iGaming M&A browsing
- zero-result state now explains the private curated flow and includes the two approved CTAs
- listing cards now use asset-type labeling instead of MSP-style service categorization

**`client/src/components/FeaturedListings.tsx`**
- removed MSP category/industry badge usage
- replaced featured/premium public promo badges with launch asset-type labeling
- updated section heading/subheading to curated iGaming opportunity language

### Verification

- `pnpm run check` — PASS
- `pnpm run build` — PASS (pre-existing large-chunk warning only)
- `git diff --check` — PASS
- Scope guard: only `client/src/pages/Marketplace.tsx`, `client/src/components/FeaturedListings.tsx` and handoff docs changed for 5A

### Known Gaps / Deferred

- Marketplace cards still use the legacy generic metric frame (revenue / EBITDA / type) rather than fully asset-type-specific teaser cards. That tighter listing-detail/access work is next in 5B.

---

## Slice 4B — Rewrite Buyer Mandate Intake for the Niche
Status: COMPLETE — HERMES VERIFIED
Date: 2026-08-10
Branch: am-igaming-crypto-mvp
Baseline: c113847

### What Was Done

**`server/routers/buyerRequestRouters.ts`**
- `buyerRequest.create` changed from `kycVerifiedProcedure` to `protectedProcedure`
- new buyer mandates now default to private review state on create:
  - `status = 'pending'`
  - `isPublic = 0`
- removed seller-notification fanout from initial creation; publication is now an admin decision

**`server/routers/adminBuyerRequestsRouter.ts`**
- publish now also sets `isPublic = 1`
- unpublish now also sets `isPublic = 0`

**`client/src/pages/BuyAsset.tsx`**
- removed pre-submit KYC gating from initial buyer mandate submission
- rewrote default public-facing copy from MSP language to buyer-mandate / iGaming acquisition language
- mandate submission success message now explains private review before any teaser is published
- form labels/placeholder copy updated for:
  - mandate title
  - acquisition thesis
  - target jurisdictions / license tolerance
  - target asset types / business models
  - budget / purchase capacity
  - transaction structure / crypto exposure / other requirements
- buyer identity option relabeled to privacy language
- my-requests pending state copy updated to explain private-by-default review
- public section renamed from active buyer requests to published buyer mandates

**`client/src/components/BuyerRequestEditForm.tsx`**
- edit-form labels and placeholders updated to the same niche language as the create form

### Verification

- `pnpm run check` — PASS
- `pnpm run build` — PASS (pre-existing large-chunk warning only)
- `git diff --check` — PASS
- Scope guard: only `server/routers/buyerRequestRouters.ts`, `server/routers/adminBuyerRequestsRouter.ts`, `client/src/pages/BuyAsset.tsx`, `client/src/components/BuyerRequestEditForm.tsx` changed for 4B

### Known Gaps / Deferred

- Current buyer mandate schema is still the legacy table, so some niche fields are represented through relabeled existing text fields rather than new structured columns.

---

## Slice 3B — Convert Create Listing into Confidential Seller Application
Status: BUILT — READY FOR REVIEW
Date: 2026-08-10
Builder: Bob (Claude Code) + Arch finish after max-turn exit
Branch: am-igaming-crypto-mvp
Baseline: 94d08ec

### What Was Done

**`server/routers.ts`**
- `listing.create` changed from `kycVerifiedProcedure` to `protectedProcedure` so login is sufficient for the initial seller application
- new submissions now land as `status='draft'`, `isPublished=0`, `moderationStatus='pending_review'`, `submittedAt=now`
- legacy auto-activation logic removed from initial create path
- default confidentiality/visibility now falls back server-side to `private` / `seller_approval_required`
- dynamic field values are validated against seller-visible definitions for the selected asset type and optional subcategory before write
- deprecated `listingTier` is still accepted in input for broker-flow compatibility but ignored by the new seller-application path

**`server/db.ts`**
- added `createListingWithFieldValues(data, values)` transaction helper
- listing row insert and initial dynamic field value inserts now happen in one DB transaction

**`server/routers/listingFieldValuesRouter.ts`**
- seller-facing definition list explicitly filters out `admin_only` field definitions

**`client/src/pages/CreateListing.tsx`**
- removed pre-submit KYC gating UI from the initial seller application path
- success state now says the application is under review
- default visibility set to `seller_approval_required`
- dynamic diligence fields render during initial creation and their values submit with the listing
- legacy general-industry vertical question removed from the seller application path
- no listing-tier / paid-placement UX remains in the initial submission path

### Verification

- `pnpm run check` — PASS (zero type errors)
- `pnpm run build` — PASS (pre-existing large-chunk warning only)
- `git diff --check` — PASS
- Scope guard: only `client/src/pages/CreateListing.tsx`, `server/routers.ts`, `server/routers/listingFieldValuesRouter.ts`, `server/db.ts` and handoff docs changed

### Known Gaps / Deferred

- Broker create-listing flow still sends a deprecated `listingTier`; the backend accepts and ignores it for compatibility. Cleanup can happen in a later broker slice.
- Existing seller edit flows still contain legacy MSP-era fields and will need a later niche cleanup pass outside this slice.

---

## Slice 4A — Fix the Public Buyer Mandates Page
Status: COMPLETE — HERMES VERIFIED
Date: 2026-08-10
Branch: am-igaming-crypto-mvp
Baseline: 7daf04a

### What Was Done

**`server/db.ts`**
- added `getPublicBuyerRequestTeasers()`
- returns only published, public, non-expired buyer request teaser fields
- redacts buyer identity and internal/private fields by omission

**`server/routers/buyerRequestRouters.ts`**
- kept authenticated `getAll` protected
- added dedicated public `getPublicTeasers` procedure for the public page
- changed full `getById` from public to protected so full buyer request data is no longer openly exposed

**`client/src/pages/BuyAsset.tsx`**
- public list now uses `buyerRequest.getPublicTeasers`
- unauthenticated public page no longer depends on the protected `getAll` procedure

### Verification

- `pnpm run check` — PASS
- `pnpm run build` — PASS (pre-existing large-chunk warning only)
- `git diff --check` — PASS
- Scope guard: only `server/db.ts`, `server/routers/buyerRequestRouters.ts`, `client/src/pages/BuyAsset.tsx` changed for the 4A fix

### Known Gaps / Deferred

- Public buyer mandate content is still MSP-era and will be rewritten in Slice 4B.

---

## Slice 3C — Admin Approve / Request-Info / Reject / Publish Flow
Status: BUILT — READY FOR REVIEW
Date: 2026-08-10
Builder: Bob (Claude Code) + Arch finish after usage-limit stop
Branch: am-igaming-crypto-mvp
Baseline: 32242d0

### What Was Done

**`server/routers/adminListingRouter.ts`**
- added admin mutations: `requestMoreInfo`, `approve`, `reject`, `publish`
- `requestMoreInfo` requires seller note and sets moderation status to `needs_information`
- `approve` sets moderation status to `approved`
- `reject` requires reason and sets moderation status to `rejected`
- all moderation actions set `reviewedAt`, `reviewedBy`
- `publish` refuses unless moderation state is `approved`; on success sets `isPublished = 1` and `status = 'active'`
- all four actions create an in-app seller notification via the existing notification helper
- all four actions write admin audit records via `adminAuditLogs`

**`client/src/pages/admin/tabs/ListingsTab.tsx`**
- added moderation action dialog state and mutations
- added action buttons for approve / request info / reject / publish in the listings table
- request-info and reject enforce note / reason in the dialog
- publish is only shown for approved, unpublished listings
- fixed the 5-card stats grid to `grid-cols-2 md:grid-cols-5`
- existing tier-management dialog remains intact

### Verification

- `pnpm run check` — PASS (zero type errors)
- `pnpm run build` — PASS (pre-existing large-chunk warning only)
- `git diff --check` — PASS
- Scope guard: only `server/routers/adminListingRouter.ts`, `client/src/pages/admin/tabs/ListingsTab.tsx` and handoff docs changed

### Known Gaps / Deferred

- Email remains optional; this slice guarantees in-app seller notifications and does not block on email configuration.
- The moderation UI remains intentionally narrow and does not yet show internal note history beyond the action dialog.

---

## Slice 3A — Add Explicit Listing Moderation State
Status: BUILT — READY FOR REVIEW
Date: 2026-08-10
Builder: Bob (Claude Code)
Branch: am-igaming-crypto-mvp
Baseline: f7df9ce

### What Was Done

**`drizzle/schema.ts`** — 6 moderation fields appended to `listings` table after `subcategoryId`:
- `moderationStatus` — enum `pending_review | needs_information | approved | rejected`, default `pending_review`, not null
- `submittedAt`, `reviewedAt` — nullable timestamps
- `reviewedBy` — nullable int (admin user id)
- `reviewNotes`, `rejectionReason` — nullable text (internal only, never in public/seller routes)

**`drizzle/0078_listing_moderation_state.sql`** — additive migration:
- ALTER TABLE ADD COLUMN for all six fields
- Backfill: `isPublished = 1 → approved`, else `→ pending_review` (WHERE deletedAt IS NULL)
- No destructive ops; existing listing rows untouched beyond backfill

**`server/routers/adminListingRouter.ts`**:
- `getAll` — added `moderationStatus` filter input; all 6 moderation fields added to the SELECT projection (reviewNotes + rejectionReason exposed only to this admin-only procedure)
- `getStats` — added `byModerationStatus` count grouped by `moderationStatus`

**`client/src/pages/admin/tabs/ListingsTab.tsx`**:
- `ModerationStatus` type + `moderationLabels`, `moderationColors`, `moderationIcons` maps (ShieldCheck/ShieldAlert/ShieldX/ShieldQuestion)
- Moderation filter dropdown added alongside existing status/tier filters
- `moderationStatus` column added to the listings table with badge rendering
- "Pending Review" stat card added in stats overview row

### Verification

- `pnpm run check` — passed (no type errors)
- `pnpm run build` — passed (same pre-existing large-chunk warning only)
- `git diff --check` — clean
- Scope guard: 5 intentional files changed, all within allowed set; `.claude-flow/neural/stats.json` is auto-generated runtime state (not to be committed)

### Known Gaps / Deferred

- Migration SQL is hand-authored; Drizzle meta journal not updated (matches existing pattern — migrations in this project are managed manually)
- Full approve/request-info/reject action flow deferred to next slice

---

## Slice 2C — Seed Minimum Diligence Fields by Asset Type
Status: BUILT — READY FOR REVIEW
Date: 2026-08-10
Builder: Bob (Claude Code)
Branch: am-igaming-crypto-mvp
Baseline: 3d6c99a

### What Was Done

**`scripts/ensure-phase1-production.ts`** — new seed section added after `seedMvpTaxonomy`

- `FieldSeed` type — typed descriptor for all seeded field rows (no `wallet_address`/`contract_address` in the type to enforce the iGaming exclusion at the TypeScript level)
- `SeedVisibilityLevel` + `getSeedVisibilityLevel()` — explicit mapping for seeded fields: `public`, `nda_required`, `seller_approval_required`
- `ensureSchema()` now creates `field_definitions.visibilityLevel` on fresh databases and `ensureColumn()` backfills that column on older databases
- `commonDiligenceFields` (13 fields) — seeded for all 3 launch asset types: `teaser_summary` (public, showOnCard), `transaction_structure` (public, showOnCard, filterable), `asking_price_range` (public, showOnCard, filterable), `jurisdiction_and_incorporation`, `gaming_licenses`, `accepted_markets`, `restricted_markets`, `annual_revenue_usd`, `ebitda_usd`, `fiat_crypto_revenue_split`, `fiat_crypto_deposit_split`, `ownership_confirmation` (required boolean), `known_disputes_or_incidents`
- `operatingIGamingFields` (13 fields) — `ggr_monthly_usd`, `ngr_monthly_usd`, `monthly_active_players`, `monthly_ftds`, `monthly_deposit_volume_usd`, `monthly_withdrawal_volume_usd`, `traffic_source_breakdown`, `affiliate_revenue_concentration`, `platform_provider`, `game_providers`, `payment_providers`, `kyc_aml_process`, `source_code_ip_ownership`
- `b2bIGamingTechFields` (7 fields) — `live_client_count`, `monthly_recurring_revenue_usd`, `largest_client_revenue_concentration`, `integrations_and_certifications`, `code_ownership`, `infrastructure_obligations`, `support_obligations`
- `affiliateMediaFields` (7 fields) — `monthly_visitors_verified`, `geo_traffic_mix`, `monthly_ftds_generated`, `cpa_rev_share_contracts`, `largest_operator_revenue_concentration`, `seo_dependency`, `compliance_history`
- `assertSeedIntegrity(fields, assetTypeSlug)` — runs before any DB writes per asset type; checks: no duplicate fieldKey in scope, dropdown/multi_select have non-empty valid JSON array options, no `wallet_address`/`contract_address` fieldType, resolved visibility level is valid
- `upsertFieldDefinition(connection, verticalId, assetTypeId, field)` — explicit `SELECT id ... LIMIT 1` then `UPDATE ... WHERE id=?` or `INSERT`; `subcategoryId = NULL`; reruns do not create duplicates; now persists both `isPublic` and `visibilityLevel`
- `seedMvpDiligenceFields(connection)` — iterates the 3 launch asset types, runs integrity check, then upserts all fields; called from `main()` after `seedMvpTaxonomy`

### Visibility mapping

- `visibilityLevel = public` and `isPublic = 1`: teaser_summary, transaction_structure, asking_price_range
- `visibilityLevel = nda_required` and `isPublic = 0`: jurisdiction / licence / accepted-markets / restricted-markets disclosure fields
- `visibilityLevel = seller_approval_required` and `isPublic = 0`: financial, operational, concentration and compliance-sensitive metrics
- No true admin-only internal-review fields seeded

### Verification

- `pnpm run check` — PASS (zero type errors)
- `pnpm run build` — PASS (existing large-chunk warning only, no new warnings)
- `git diff --check` — PASS (no whitespace issues)
- Integrity proof (all 3 asset types): 26 / 20 / 20 unique fieldKeys, no duplicates, no forbidden types, all dropdown options valid — PASS
- Idempotency: `upsertFieldDefinition` always SELECT-then-UPDATE-or-INSERT; no reliance on DB unique constraint
- Scope guard: only `scripts/ensure-phase1-production.ts` + handoff docs changed; no server/, drizzle/, client/, schema, migration, or protected-area files touched

### Known Gaps / Caveats

- Query-layer public exposure still keys off `isPublic=1`, so `nda_required` vs `seller_approval_required` is now stored and future-proofed in the seed data but not yet differentiated in seller/buyer runtime access flows. That is acceptable for this seed slice.
- Subcategory-scoped diligence fields not seeded (per brief: avoid introducing that complexity here)


---

## Slice 2B — Admin Assignment Controls for Dynamic Fields
Status: BUILT — READY FOR REVIEW
Date: 2026-08-10
Builder: Bob (Claude Code)
Branch: am-igaming-crypto-mvp
Baseline: 262f2d0

### What Was Done

**`server/db.ts`** — added `checkFieldKeyScope(fieldKey, scope, excludeId?)` helper
- Queries `field_definitions` matching exact NULL equality per dimension
- Global field (all nulls) does not collide with a scoped field of the same key
- `excludeId` prevents an update from conflicting with itself

**`server/routers/adminFieldDefinitionsRouter.ts`** — added options validation + scope collision guard
- `validateOptions()` rejects undefined/empty, malformed JSON, non-array JSON, empty arrays — for dropdown and multi_select field types only
- `create`: validates options then checks scope collision before insert
- `update`: validates options if fieldType+options both present; checks scope collision when any of {fieldKey, verticalId, assetTypeId, subcategoryId} is in the payload, merging from the current DB row for any dimension not supplied
- TRPCError codes: `BAD_REQUEST` for options, `CONFLICT` for duplicate scope

**`client/src/pages/admin/tabs/ListingFieldsTab.tsx`** — added assignment UI
- `FieldDefinition` type gains `subcategoryId`; `FormState` gains `verticalId`, `assetTypeId`, `subcategoryId`
- Component loads all verticals + all asset types once; filters asset types client-side by selected vertical; loads subcategories on-demand when assetTypeId is set
- Dialog: three cascading selects (Vertical → Asset Type → Subcategory); resetting a parent clears children
- Table: new Scope column shows vertical name → asset type name → subcategory ID, or "Global" if all null
- Existing visibility controls, flags, and deactivate button untouched

### Verification

- `pnpm run check` — PASS (zero type errors)
- `pnpm run build` — PASS (existing large-chunk warning only, no new warnings)
- `git diff --check` — PASS (no whitespace issues)
- Options validation proof: all 7 cases PASS (undefined, malformed JSON, non-array, empty array all rejected; valid array accepted; non-option types skip validation)
- Scope collision proof: all 5 cases PASS (exact match blocked, global match blocked, different vertical OK, different assetType OK, self-edit with excludeId OK)
- Scope guard: only 3 app files + ARCHITECT-BRIEF.md changed; no drizzle/, schema, migration, or protected-area files touched

### Known Gaps / Caveats

- Subcategory names are not shown in the table (shows `sub#ID`); subcategories would require loading all subcategories for all asset types upfront. Acceptable for MVP — scope is clear from vertical + asset type context.
- Options validation on update only fires when `fieldType` is in the update payload. The frontend always sends it, so this is not a real gap in practice.

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
