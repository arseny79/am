# BUILD-LOG.md

## Phase 1 — Taxonomy + Crypto Vertical + Wallet Verification
Status: IN PROGRESS
Started: 2026-07-07
Architect: Hermes
Builder: Claude Code (three-man-team + ruflo)
Reviewer: Claude Code (three-man-team) + Hermes

### Task
Add admin-managed taxonomy (verticals, asset_types, subcategories), seed crypto/web3 vertical, add wallet verification MVP, update branding. See ARCHITECT-BRIEF.md for full spec.

### Rules
- Do NOT break existing MSP listings or live functionality
- All new tables are additive with nullable FKs to existing tables
- Run pnpm check + pnpm build before reporting done
- Update this file with what was built

### Phase 1 Deliverables — COMPLETE (verified 2026-07-08)

**Schema (drizzle/schema.ts):**
- Tables: `verticals`, `asset_types`, `subcategories`, `vertical_asset_types`
- Tables: `supported_chains`, `wallet_verifications`
- Listings FK fields added: `verticalId`, `assetTypeId`, `subcategoryId` (nullable — backward compat)

**Migration:** `drizzle/0072_phase1_taxonomy_wallet.sql` — handwritten, ready to run

**Server routers (server/routers.ts):**
- `taxonomy` — public listVerticals / listAssetTypes / listSubcategories
- `listing.wallet` — startVerification / submitSignature / getPublicVerification
- `chains` — public list
- `adminTaxonomy` — full CRUD for verticals + asset types + vertical-asset-type assignments
- `adminChains` — full CRUD for supported chains
- `adminWalletVerification` — listVerifications / revokeVerification

**Client:**
- `ListingEditForm.tsx` — cascading taxonomy selectors (vertical → asset type → subcategory)
- `CreateListing.tsx` — same taxonomy selectors
- `WalletVerificationCard.tsx` — connect wallet, sign, submit, show verified status
- `EditListing.tsx` — Wallet Verification tab
- `ListingDetail.tsx` — "Wallet Control Verified" badge
- `AdminDashboardModular.tsx` — VerticalsTab, AssetTypesTab, ChainsTab, WalletVerificationsTab wired

**Seed:** `scripts/seed-taxonomy.ts` — idempotent (onDuplicateKeyUpdate), 6 verticals, 12 crypto asset types, 6 chains

**Verification:**
- `pnpm check` — PASSED (0 TS errors)
- `pnpm build` — PASSED (Vite + esbuild clean)
- `pnpm lint` — 0 errors, Phase 1 warnings: 1 `any` in WalletVerificationsTab (non-blocking), console.log in seed script (intentional)

### Deploy Checklist
- [ ] Run migration: `drizzle/0072_phase1_taxonomy_wallet.sql` on Railway DB
- [ ] Run seed: `node --import tsx scripts/seed-taxonomy.ts`
- [ ] Deploy (git push → Railway CI)
- [ ] Smoke test: create listing with vertical/asset type, verify wallet, check admin tabs

### Previous Work (Pre-Phase 1)
- Step 1 (Saved Search Notifications): BUILT + REVIEWED, awaiting deploy go-ahead
- Platform is live at acquisitions.market on Railway
