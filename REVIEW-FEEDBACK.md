# Review Feedback — Slice 3B: Convert Create Listing into Confidential Seller Application
Date: 2026-08-10
Reviewer: Richard
Ready for Builder: YES

---

## Must Fix

None.

---

## Should Fix

- `server/routers.ts:6` — `kycVerifiedProcedure` is imported but no longer used directly in this file. All remaining `kycVerifiedProcedure` usages live in the sub-routers (`dealRouters.ts`, `buyerRequestRouters.ts`, `accessRequestRouters.ts`). The stale import is harmless (`noUnusedLocals` is not enforced) but is noise. Remove it when convenient; not blocking.

- `.claude-flow/neural/stats.json` — Same issue flagged in the 3A review. Still not gitignored. `SESSION-CHECKPOINT.md` prohibits committing generated `.claude-flow` runtime state. Add `.claude-flow/neural/` to `.gitignore` to close the gap permanently. One careless `git add .` would include it.

- `client/src/pages/CreateListing.tsx` dynamic field renderer — `multi_select` field type falls through to the plain text `<Input>` default. No seeded launch definitions use `multi_select`, so this will not be hit in production. Still, if multi_select fields are seeded later, sellers will see a single-line text input instead of the correct multi-value control. Log in BUILD-LOG for the next seller edit-flow pass.

---

## Escalate to Architect

None.

---

## Cleared

Reviewed `client/src/pages/CreateListing.tsx`, `server/routers.ts`, `server/routers/listingFieldValuesRouter.ts`, and `server/db.ts` against baseline `94d08ec` and ARCHITECT-BRIEF.md Slice 3B.

**KYC gate removal — initial create only.** `listing.create` changed from `kycVerifiedProcedure` to `protectedProcedure`. Comment in code confirms KYC is still required for approval and publication. Verified all other KYC-gated procedures are untouched: `deal.create`, `buyerRequest.create`, and `accessRequest.create` all remain on `kycVerifiedProcedure` in their respective sub-routers. No KYC weakening outside the create path.

**Default review state.** New listings are hard-coded to `status: "draft"`, `isPublished: 0`, `moderationStatus: "pending_review"`, `submittedAt: now`. The old tier-based branching (`listingTier === "standard" ? "active" : "draft"`) is fully removed. `notifyMatchingSavedSearches` call removed from the create path. `paymentStatus` not explicitly set; verified DB default is `'pending'` (schema line 636 — `mysqlEnum(...).default('pending').notNull()`), so the value is correct without an explicit assignment. `listingTier` likewise not set; DB default is `'standard'` (schema line 635), which is acceptable since tier no longer drives any publication logic.

**Confidentiality defaults.** Server-side: `confidentialityLevel` defaults to `"private"`, which maps via `confidentialityToVisibility` to `"seller_approval_required"`. Client-side: form state defaults `visibilityLevel` to `"seller_approval_required"`, which maps via `visibilityToConfidentialityLevel` to `"private"` at submit. Both paths are consistent and correctly restrict initial submissions from public exposure.

**Dynamic field validation.** Server validates submitted `dynamicFields` against seller-visible definitions for the submitted `assetTypeId`/`subcategoryId`. Fetch uses `getFieldDefinitions` with `activeOnly: true`, then filters out `admin_only` before building the allowed-ID set. Any submitted `fieldDefinitionId` not in the allowed set is rejected with a `BAD_REQUEST` TRPC error. Missing `assetTypeId` when `dynamicFields` are present is also rejected. The `.max(200)` cap on the array is present. No admin-only definitions can be submitted through this path.

**Admin_only filter in field values router.** `listDefinitionsForAssetType` now filters `d.visibilityLevel !== 'admin_only'` before returning to the client. Filter is applied post-query on a small seeded dataset — no performance concern. Server-side re-validation is independent of the client-side filter, so the two layers are correctly redundant.

**Atomic create + field values save.** `createListingWithFieldValues` in `server/db.ts` wraps the listing INSERT and the `listingFieldValues` bulk INSERT in a single Drizzle transaction. If field value insert fails, the transaction rolls back and no partial listing is left in the database. This replaces the prior "create then soft-delete on failure" pattern with actual atomicity. The `listingFieldValues` symbol is correctly imported from `drizzle/schema.ts` at line 4 of `server/db.ts`.

**Dynamic field rendering.** Client queries `listingFieldValues.listDefinitionsForAssetType` keyed on `assetTypeId`/`subcategoryId` with `enabled: formData.assetTypeId != null`. Renders only when definitions are returned. Handles `text`, `textarea`, `number`, `currency`, `percentage`, `date`, `boolean`, and `dropdown` field types. `required` comparisons are type-correct (`tinyint` comes back as number; `field.required === 1` and truthiness checks both work). Dropdown `options` null guard (`field.options ? JSON.parse(field.options) : []`) prevents a throw on null. Dynamic field values are accumulated in local state keyed by `fieldDefinitionId` and submitted as `dynamicFields` on form submit.

**MSP legacy cleanup.** `serviceCategory` removed from both server input schema and client form — fully gone from the create path. `industryVertical` removed from client form state and submit call; remains as an optional server input for any residual broker compatibility; column is nullable in schema. `listingTier` accepted as optional input but completely ignored by the application path. `VerificationRequired` component, `useKYCGating` hook, and `GatingModal` all removed from `CreateListing.tsx`. Success toast says "under review" not "live". Page title, description, and breadcrumb all updated to seller-application framing.

**Scope guard.** Changed application files: `client/src/pages/CreateListing.tsx`, `server/routers.ts`, `server/routers/listingFieldValuesRouter.ts`, `server/db.ts`. Plus handoff docs (`ARCHITECT-BRIEF.md`, `BUILD-LOG.md`, `REVIEW-REQUEST.md`, `SESSION-CHECKPOINT.md`). No protected areas touched — public marketplace, admin moderation action flow, buyer mandate pages, payment/Stripe/NDA/access-request/deal-room logic all unchanged.

**Verification.** `pnpm run check`: PASS (zero type errors). `pnpm run build`: PASS (pre-existing chunk size warning only, no new warnings). `git diff --check`: PASS (zero whitespace errors).

Slice 3B is clear. Signal to Arch: Slice 3B passes.
