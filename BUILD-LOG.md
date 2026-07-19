# BUILD-LOG.md

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
