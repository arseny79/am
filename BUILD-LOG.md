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
