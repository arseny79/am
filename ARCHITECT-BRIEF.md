# ARCHITECT-BRIEF.md — Phase 3B: Visibility Controls UI/Admin Slice

## Context
AM Phase 3A backend visibility foundation is already built locally on branch `am-visible-rebrand` and currently passes local typecheck/build. The branch is intentionally still dirty because Phase 3A is not yet committed. Continue on this same branch and do not disturb the existing Phase 3A work.

Current Phase 3A backend foundation already exists in:
- `drizzle/schema.ts`
- `drizzle/0074_phase3_visibility_engine.sql`
- `server/lib/visibility.ts`
- `server/routers.ts`
- `server/routers/listingDocumentRouter.ts`

## Business Goal
Expose the new visibility engine to operators and sellers in a minimal practical way so AM can actually use the Phase 3A backend.

This is a focused UI/admin slice, not a broad redesign.

## Scope — do ONLY this

### 1) Listing create/edit UI: add listing visibility control
Add a seller-facing visibility selector to:
- `client/src/pages/CreateListing.tsx`
- `client/src/components/ListingEditForm.tsx`

Support these listing-level choices in the UI:
- `public`
- `registered_users`
- `nda_required`
- `seller_approval_required`

Do NOT expose these in the seller UI yet:
- `public_preview`
- `specific_buyer_only`
- `admin_only`

Requirements:
- The selected visibility level must be submitted through the existing create/update mutations.
- Keep the old confidentiality model backward-compatible.
- Sync `confidentialityLevel` sensibly from the selected visibility level so old display logic and older surfaces keep working:
  - `public` and `registered_users` -> `public`
  - `nda_required` -> `nda`
  - `seller_approval_required` -> `private`
- Keep `isAnonymous` separate from visibility.
- Add short plain-language helper text so a non-technical seller understands the difference.

### 2) Document vault UI: seller can choose document visibility in the new model
Update:
- `client/src/components/ListingDocumentVault.tsx`

Requirements:
- Keep the existing 3 seller-facing document choices only:
  - `public`
  - `nda_required`
  - `seller_approval_required`
- You may keep the existing internal `accessLevel` API contract if that is the narrowest path, but the UI labels shown to the user should reflect the new visibility language.
- Preserve the current behavior for uploads, edits, badges, and gated downloads.
- Do not redesign the vault.

### 3) Admin field definitions: add field visibility control
Update:
- `client/src/pages/admin/tabs/ListingFieldsTab.tsx`
- `server/routers/adminFieldDefinitionsRouter.ts`
- any small supporting typings/backend glue needed for field definitions

Requirements:
- Add admin control for field-definition visibility level.
- For this slice expose these admin choices:
  - `public`
  - `registered_users`
  - `nda_required`
  - `seller_approval_required`
  - `admin_only`
- Show the chosen visibility in the field definitions table.
- Continue to preserve old `isPublic` behavior by syncing it from visibility:
  - `public` -> `isPublic = 1`
  - everything else -> `isPublic = 0`
- Use the new `visibilityLevel` field as the source of truth going forward.

## What NOT to do
- Do NOT touch Stripe, KYC, escrow, auth, wallet verification, or deal rooms.
- Do NOT redesign marketplace cards or public listing cards in this slice.
- Do NOT do a deploy.
- Do NOT commit.
- Do NOT rewrite large unrelated files.
- Do NOT touch `.claude-flow/*` files.
- Do NOT disturb already-working Phase 3A backend logic unless needed for this UI/admin slice.

## Build Style
Use Ruflo / Three Man Team Builder discipline:
- read only the files needed
- edit narrowly
- preserve existing UI structure and styling
- no broad refactors

## Verification
Before stopping, run:
- `pnpm run check`
- `pnpm run build`

Then report exactly:
- files changed
- whether listing create/edit visibility selection works through existing mutations
- whether admin field-definition visibility is wired end-to-end
- whether document vault labels/controls now reflect the new visibility model
- any remaining gap for a future slice
