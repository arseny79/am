# ARCHITECT-BRIEF — Slice 3B: Convert Create Listing into Confidential Seller Application

Date: 2026-08-10
Architect Approval: YES
Branch: `am-igaming-crypto-mvp`
Master plan: `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`
Baseline checkpoint: `94d08ec`

## Role and method

You are Bob, Builder in AM's Three Man Team.

- Ruflo-core is enabled. Apply Ruflo/SPARC discipline.
- Read `BUILDER.md`, this brief and `SESSION-CHECKPOINT.md` first.
- Add a concise Builder Plan to this brief, then build immediately because Architect Approval is YES.
- Build only this slice.

## Goal

Convert the current create-listing path from the old MSP / listing-tier flow into a confidential seller application flow for the new AM MVP.

This slice should let a logged-in seller submit a listing for review without pre-submit KYC, while preserving all existing KYC gates on publication, protected access and deal progression.

## Allowed application files

1. `client/src/pages/CreateListing.tsx`
2. `client/src/components/ListingEditForm.tsx` if needed for shared field rendering or consistency
3. `server/routers.ts` listing create path only, and narrowly related helpers in the same file
4. `server/routers/listingFieldValuesRouter.ts` if needed for initial-create dynamic field handling
5. `server/db.ts` or a focused helper module if needed for an atomic create + field-values save path
6. one targeted test under `server/` if useful

Plus handoff docs only:
- `ARCHITECT-BRIEF.md`
- `BUILD-LOG.md`
- `REVIEW-REQUEST.md`

## Requirements

### 1. Remove pre-submit KYC requirement from initial submission only

Current state: `listing.create` is still `kycVerifiedProcedure`.

Change this slice so:
- account login is sufficient to submit the initial seller application
- pre-submit KYC is NOT required for that initial submission
- KYC remains required before approval/publication, protected-data access or transaction progression elsewhere in the product
- do not weaken existing KYC-gated procedures outside the initial create flow

### 2. Default new submissions to review state, not live state

On initial create:
- default listing `status` to `draft`
- default `isPublished` to `0`
- default moderation state to `pending_review`
- set `submittedAt`
- do not set the listing live automatically
- do not rely on legacy `listingTier` / payment-status shortcuts to activate listings

### 3. Remove listing-tier / Stripe-style submission assumptions from the create flow

Current create path still carries legacy `listingTier` behavior and MSP-era submission assumptions.

For this slice:
- remove listing-tier / paid-placement logic from the create submission path
- the seller application should be a single review-based submission path
- success state must clearly say the submission is under review, not live
- do not add any new payment behavior

### 4. Dynamic fields must be included at initial creation

The seller must be able to provide the seeded dynamic diligence fields during initial submission for the selected asset type.

Implement this so:
- when the seller chooses asset type (and subcategory if present), the page loads the relevant dynamic field definitions
- the form renders those fields during initial creation
- submitted values are saved together with the listing creation flow
- save must be atomic, or cleanly roll back the listing if dynamic field persistence fails

Important constraint:
- do not expose any admin-only field definitions
- use the current field-definition / listing-field-values system rather than hardcoding new field groups into the page

### 5. Narrow content cleanup in create flow

Within this slice, remove or neutralize create-flow remnants that conflict with the new AM seller-application model, especially:
- old MSP-specific service-category framing in the seller application path
- messaging that implies public listing goes live immediately
- pricing / featured-tier submission assumptions

Do not do a broad form redesign. Keep the change focused on submission semantics and required runtime wiring.

## Protected areas

Do not modify:
- public marketplace pages
- admin listing moderation action flow (next slice)
- buyer mandate pages
- payment, Stripe, NDA, access-request or deal-room logic outside what is strictly required to remove legacy create-flow assumptions
- unrelated KYC-gated flows

Do not commit, push or deploy.

## Verification

Run:
- `pnpm run check`
- `pnpm run build`
- `git diff --check`
- targeted proof that initial create no longer requires KYC while other KYC-gated behavior remains untouched
- targeted proof that listing creation plus dynamic field value save is atomic or rolled back cleanly on failure
- scope guard proving only allowed files and handoff docs changed

## Acceptance criteria

- logged-in seller can submit an initial listing application without pre-submit KYC
- create flow no longer auto-publishes or auto-activates standard listings
- new submission lands as draft, unpublished, pending review, with submittedAt set
- seeded dynamic fields render and save during initial create
- listing + dynamic values save atomically or roll back cleanly
- success state says under review, not live
- existing KYC gates outside initial create remain intact
- typecheck and production build pass

## Completion handoff

- Append Slice 3B to `BUILD-LOG.md` with exact verification.
- Replace `REVIEW-REQUEST.md` with changed files, behavior, verification and any open question.
- Set `Ready for Review: YES`.
