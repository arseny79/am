# REVIEW-REQUEST — Slice 3B: Convert Create Listing into Confidential Seller Application

Ready for Review: YES
Date: 2026-08-10
Builder: Bob (Claude Code) + Arch finish after max-turn exit
Branch: am-igaming-crypto-mvp
Baseline: 94d08ec

---

## Changed Files

### `server/routers.ts`
Initial create path reworked into a seller application flow:
- `listing.create` changed from `kycVerifiedProcedure` to `protectedProcedure`
- new submissions now default to:
  - `status = 'draft'`
  - `isPublished = 0`
  - `moderationStatus = 'pending_review'`
  - `submittedAt = now`
- server-side default visibility/confidentiality now falls back to `seller_approval_required` / `private`
- dynamic field submissions are validated against seller-visible definitions for the selected asset type and optional subcategory before insert
- `listingTier` remains accepted as an optional deprecated input only for broker-flow compatibility, but it is ignored by the seller-application path

### `server/db.ts`
Added `createListingWithFieldValues(data, values)` transaction helper:
- creates the listing row and inserts initial dynamic field values in a single DB transaction
- replaces the prior “create then soft-delete on failure” fallback with actual atomicity

### `server/routers/listingFieldValuesRouter.ts`
Seller-facing `listDefinitionsForAssetType` now explicitly filters out `admin_only` definitions before returning fields to the create flow.

### `client/src/pages/CreateListing.tsx`
Create flow updated for confidential seller application semantics:
- removed pre-submit KYC gating UI from the initial seller application page
- default `visibilityLevel` is now `seller_approval_required`
- success toast now clearly says the application is under review
- dynamic diligence fields render when an asset type is selected and submit with the listing
- legacy generic `industryVertical` question removed from this page
- no create-flow listing-tier / paid-placement UX remains in this path

### `ARCHITECT-BRIEF.md`
Builder Plan present for the reviewed slice.

---

## Behavior

- logged-in sellers can submit an initial listing application without pre-submit KYC
- initial submissions no longer auto-publish or auto-activate
- initial submission and dynamic field save are transactional
- only seller-visible field definitions can be submitted through the initial create flow
- existing KYC-gated flows outside initial create remain untouched

---

## Verification

- `pnpm run check` — PASS
- `pnpm run build` — PASS (pre-existing chunk warning only)
- `git diff --check` — PASS
- scope guard — changed application files only:
  - `client/src/pages/CreateListing.tsx`
  - `server/routers.ts`
  - `server/routers/listingFieldValuesRouter.ts`
  - `server/db.ts`
  - plus handoff docs only

---

## Open Questions

1. Broker create-listing still posts deprecated `listingTier`; backend now accepts and ignores it for compatibility. Worth a later cleanup in the broker lane, but not blocking this slice.
2. The broader seller edit flow still contains legacy MSP-era fields and labels; this slice intentionally did not rewrite that path.
