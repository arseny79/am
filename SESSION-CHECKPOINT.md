# SESSION-CHECKPOINT.md
Date: 2026-07-13

## Current State

Phase 2 Dynamic Listing Forms is built and committed. Phase 2.5 (public display of dynamic fields on listing detail) is built locally. Phase 3A visibility-engine backend foundation and Phase 3B visibility-controls UI/admin slice are now also built locally on `am-visible-rebrand` and pass local verification.

AM now has:
- Phase 1: digital-assets taxonomy, crypto categories, wallet verification, admin taxonomy controls — LIVE on Railway
- Phase 2: admin-configurable field definitions, listing field values, admin field management UI, seller-side dynamic field rendering — COMMITTED, not yet deployed
- Phase 2.5: public display of dynamic field values on listing detail page (Asset Details card) — BUILT LOCALLY, not yet committed
- Phase 3A: visibility engine backend foundation (new visibility enum model + migration + shared helper + listing/document backend wiring) — BUILT LOCALLY, not yet committed
- Phase 3B: visibility controls UI/admin slice (seller listing visibility controls, document visibility wording, admin field-definition visibility controls) — BUILT LOCALLY, not yet committed

## Latest Verification

- Local `pnpm run check` — PASSED
- Local `pnpm run build` — PASSED
- Railway Phase 1 deployment — still live
- Phase 2 migration NOT yet run on Railway (file: `drizzle/0073_phase2_field_definitions.sql`)
- Phase 3A migration created locally (file: `drizzle/0074_phase3_visibility_engine.sql`) and not yet run anywhere

## Phase 2.5 Files Changed

Modified files:
- `server/db.ts` — added `getPublicListingFieldValues` (joins listing_field_values + field_definitions where isPublic=1, isActive=1, value not empty)
- `server/routers/listingFieldValuesRouter.ts` — added `getPublicForListing` publicProcedure
- `client/src/pages/ListingDetail.tsx` — queries getPublicForListing, renders "Asset Details" card in Overview tab when dynamic fields exist

## Phase 3A Files Changed

Modified/new files:
- `drizzle/schema.ts` — adds `visibilityLevel` to `listings`, `listingDocuments`, and `field_definitions`
- `drizzle/0074_phase3_visibility_engine.sql` — additive migration + backfill from old confidentiality/access fields
- `server/lib/visibility.ts` — shared visibility levels, legacy mappers, and access helper
- `server/routers.ts` — listing create/update now accept visibility level; listing detail confidentiality masking now uses the shared visibility helper with NDA/access fallback
- `server/routers/listingDocumentRouter.ts` — document visibility now resolves via the shared helper; upload/access-level updates keep `visibilityLevel` in sync

## Phase 3B Files Changed

Modified files:
- `client/src/pages/CreateListing.tsx` — seller listing visibility selector added and synced to legacy confidentiality values
- `client/src/components/ListingEditForm.tsx` — seller edit visibility selector added and synced to legacy confidentiality values
- `client/src/components/ListingDocumentVault.tsx` — document vault wording updated to reflect visibility language
- `server/routers/adminFieldDefinitionsRouter.ts` — admin field-definition visibility accepted and synced to `isPublic`
- `client/src/pages/admin/tabs/ListingFieldsTab.tsx` — admin field-definition visibility control + table display added

## Next Step

Hermes should review the combined Phase 2 / 2.5 / 3A / 3B local branch, then:
1. Commit the local work cleanly
2. Run `drizzle/0073_phase2_field_definitions.sql` and `drizzle/0074_phase3_visibility_engine.sql` in the target environment in order
3. Deploy and smoke-test listing detail, confidential listing access, document vault behavior, and admin field-definition visibility

## Active Development Focus

Phase 2 + 2.5 are complete locally. Phase 3A backend foundation and Phase 3B visibility-controls UI/admin slice are complete locally. The next likely lane is either commit/deploy/verify this stack or continue with a narrower public marketplace/display refinement slice.

## Constraints

- Do not break existing listings.
- Do not touch Stripe, KYC, NDA, escrow, or auth.
- Do not deploy or run production migrations from Claude Code.
- Hermes reviews before commit/deploy.
