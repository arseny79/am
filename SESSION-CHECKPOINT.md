# SESSION-CHECKPOINT.md
Date: 2026-07-13

## Current State

Phase 2 Dynamic Listing Forms is built and committed. Phase 2.5 (public display of dynamic fields on listing detail) is now also built locally. Awaiting Hermes review and Railway deploy.

AM now has:
- Phase 1: digital-assets taxonomy, crypto categories, wallet verification, admin taxonomy controls — LIVE on Railway
- Phase 2: admin-configurable field definitions, listing field values, admin field management UI, seller-side dynamic field rendering — COMMITTED, not yet deployed
- Phase 2.5: public display of dynamic field values on listing detail page (Asset Details card) — BUILT LOCALLY, not yet committed

## Latest Verification

- Local `pnpm run check` — PASSED
- Local `pnpm run build` — PASSED
- Railway Phase 1 deployment — still live
- Phase 2 migration NOT yet run on Railway (file: `drizzle/0073_phase2_field_definitions.sql`)

## Phase 2.5 Files Changed

Modified files:
- `server/db.ts` — added `getPublicListingFieldValues` (joins listing_field_values + field_definitions where isPublic=1, isActive=1, value not empty)
- `server/routers/listingFieldValuesRouter.ts` — added `getPublicForListing` publicProcedure
- `client/src/pages/ListingDetail.tsx` — queries getPublicForListing, renders "Asset Details" card in Overview tab when dynamic fields exist

## Next Step

Hermes reviews Phase 2 + Phase 2.5, then:
1. Run `drizzle/0073_phase2_field_definitions.sql` on Railway production database
2. Commit and deploy

## Active Development Focus

Phase 2 + 2.5 complete. Phase 3 per ROADMAP = Listing Visibility Engine (visibility levels: public, registered_users, nda_required, etc. — applied at listing/field/file level). No Architect brief for Phase 3 yet.

## Constraints

- Do not break existing listings.
- Do not touch Stripe, KYC, NDA, escrow, or auth.
- Do not deploy or run production migrations from Claude Code.
- Hermes reviews before commit/deploy.
