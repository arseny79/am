# Acquisitions.market — Configurable Marketplace Engine Roadmap

## Vision
Transform AM from a hardcoded MSP marketplace into a configurable marketplace engine for digital-native assets. Admin can create verticals, asset types, listing fields, workflows, and fee structures without code changes.

## Current State
- Live at acquisitions.market, deployed on Railway
- Hardcoded for MSP listings (primaryServiceCategory, industryVertical enums)
- Working: listings, valuations, NDAs, KYC, Stripe, deal rooms, saved searches, admin panel
- Stack: React 19, Express, tRPC, MySQL/Drizzle, Vite, Tailwind

## Phases

### Phase 1 — Taxonomy Foundation + Crypto Vertical + Wallet Verification
**Goal:** Add admin-managed taxonomy tables alongside existing hardcoded schema. Seed crypto/web3 vertical. Add wallet verification MVP. No breaking changes to existing MSP listings.

**Scope:**
1. New tables: `verticals`, `asset_types`, `subcategories`, `vertical_asset_types`
2. Seed data: 6 verticals (Crypto/Web3, iGaming, AI, SaaS, Creator Economy, Domains)
3. Seed Crypto/Web3 asset types (Protocol, Token Project, Telegram Mini App, DeFi App, GameFi/GambleFi, Trading Bot, Wallet/Infrastructure, NFT Collection, DAO, Community, Source Code/Smart Contract, Analytics Tool)
4. Link listings to taxonomy (nullable foreign keys — old MSP listings keep working)
5. Wallet verification: `wallet_verifications` table, `supported_chains` admin table
6. Seller can add wallet address + sign verification message
7. Backend verifies signature, stores verified_at timestamp
8. "Wallet control verified" badge on listings
9. Admin UI: manage verticals, asset types, chains
10. Update site branding from MSP to digital assets M&A

**Acceptance criteria:**
- Existing MSP listings still work unchanged
- Admin can create new verticals and asset types
- Seller can verify a wallet on supported chains
- Build passes, no TypeScript errors
- No database migration breaks existing tables

### Phase 2 — Dynamic Listing Forms
**Goal:** Admin-defined field definitions replace hardcoded listing fields.

**Scope:**
1. `field_definitions` table (type, required, placeholder, validation, options, visibility, filterable, sortable, show_on_card)
2. `listing_field_values` table (dynamic values per listing)
3. Field types: text, textarea, rich_text, markdown, number, currency, percentage, dropdown, multi_select, radio, checkbox, boolean, date, url, file, image, wallet_address, contract_address, json
4. Admin UI: create/edit field definitions per asset type
5. Seller form: renders dynamically from field definitions
6. Public listing: shows only public fields
7. Backward compat: existing hardcoded fields remain for old listings

### Phase 3 — Listing Visibility Engine
**Goal:** Granular visibility at listing, field, and file level.

**Scope:**
1. Visibility levels: public, public_preview, registered_users, nda_required, seller_approval_required, specific_buyer_only, admin_only
2. Apply at listing, field, and file level
3. Backend filters hidden data before API responses
4. Access request flow for restricted listings

### Phase 4 — Buyer Inquiries + Admin Matching
**Goal:** Buyers submit acquisition mandates; admin matches them to listings.

**Scope:**
1. `buyer_inquiries`, `buyer_inquiry_targets`, `buyer_inquiry_field_values` tables
2. Buyer identity/contact never shown publicly
3. Admin matching workspace: view inquiries, find relevant listings, create matches
4. Match notifications to buyer and seller
5. Create dealrooms from matches

### Phase 5 — Configurable Dealroom Workflows
**Goal:** Admin-defined workflow templates and stages.

**Scope:**
1. `workflow_templates`, `workflow_stages` tables
2. Default workflows: Digital Asset Sale, Crypto/Web3 Asset Sale, iGaming Asset Sale
3. Dealroom stages configurable per workflow template
4. Migrate existing deal workflow to configurable system

### Phase 6 — Documents + Fees + Escrow
**Goal:** Admin-managed document templates, fee rules, escrow providers.

**Scope:**
1. Document templates admin-managed, visibility levels
2. Fee rules configurable (seed: 3% up to $10M, 2% $10M-$100M, 1% above $100M)
3. Escrow providers configurable (seed: Escrow.com, Crypto Escrow, Direct Close)

### Phase 7 — Dynamic Browse
**Goal:** Filters and listing cards generated from field definitions.

**Scope:**
1. Filters generated from `field_definitions` marked filterable
2. Listing cards from `card_configurations`
3. No hardcoded category-specific card fields

## Rules for All Phases
- Never break existing listings or live site
- Each phase ships independently and deploys
- Old hardcoded paths remain until dynamic path is proven
- Run `pnpm check` and `pnpm build` before reporting done
- Update BUILD-LOG.md and SESSION-CHECKPOINT.md after each phase
