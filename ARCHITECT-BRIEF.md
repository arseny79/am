# ARCHITECT-BRIEF.md — Phase 1: Taxonomy + Crypto Vertical + Wallet Verification

## Context
AM is a live M&A marketplace at acquisitions.market. Currently hardcoded for MSP (Managed Service Provider) listings. We're pivoting to a configurable marketplace engine for digital-native assets, starting with crypto/web3.

## Critical Constraint
**DO NOT BREAK EXISTING FUNCTIONALITY.** The live site must remain operational throughout. All existing MSP listings, deal flows, and admin features must continue to work. New tables are additive — nullable foreign keys link to the new taxonomy. Old listings keep their hardcoded enums.

## What to Build

### 1. Taxonomy Tables (drizzle/schema.ts additions)

```typescript
// Admin-managed verticals (e.g., "Crypto / Web3", "iGaming", "AI")
verticals: id, name, slug, description, icon, sortOrder, isActive, createdAt, updatedAt

// Asset types within verticals (e.g., "DeFi App", "NFT Collection")
asset_types: id, name, slug, description, icon, sortOrder, isActive, createdAt, updatedAt

// Subcategories within asset types
subcategories: id, assetTypeId (FK), name, slug, description, sortOrder, isActive, createdAt, updatedAt

// Many-to-many: which asset types belong to which verticals
vertical_asset_types: id, verticalId (FK), assetTypeId (FK), createdAt
```

### 2. Link Listings to Taxonomy (additive, nullable)

Add to existing `listings` table:
```typescript
verticalId: int()  // nullable — old listings have null
assetTypeId: int()  // nullable — old listings have null
subcategoryId: int()  // nullable — old listings have null
```

Old MSP listings keep their `primaryServiceCategory` and `industryVertical` enums. New crypto listings use the taxonomy tables. Both coexist.

### 3. Wallet Verification MVP

```typescript
// Admin-managed list of supported blockchain networks
supported_chains: id, name, slug, chainId, rpcUrl, logoUrl, isActive, createdAt, updatedAt

// Wallet verification records (one per listing, or multiple?)
wallet_verifications: id, listingId (FK), walletAddress, chainId (FK to supported_chains), signature, message, verifiedAt, createdAt, updatedAt
```

**Verification flow:**
1. Seller enters wallet address on their listing
2. Seller signs a verification message (e.g., "I verify ownership of this wallet for Acquisitions.market listing #{id}" + timestamp) using their wallet provider (MetaMask, etc.)
3. Backend verifies the signature matches the wallet address
4. Store signature, message, wallet address, chain, verifiedAt
5. Show "Wallet Control Verified" badge on the listing

**For Phase 1 MVP:** The signature verification can be a frontend-only flow (MetaMask `personal_sign`) with backend storage. The backend should validate that the signature recovers to the claimed address before storing. Use `ethers` or `viem` for signature recovery.

### 4. Seed Data

**Verticals:**
- Crypto / Web3 (slug: crypto-web3)
- iGaming (slug: igaming)
- AI (slug: ai)
- SaaS (slug: saas)
- Creator Economy (slug: creator-economy)
- Domains (slug: domains)

**Crypto / Web3 Asset Types:**
- Protocol, Token Project, Telegram Mini App, DeFi App, GameFi / GambleFi, Trading Bot, Wallet / Infrastructure, NFT Collection, DAO, Community, Source Code / Smart Contract, Analytics Tool

**Supported Chains (for wallet verification):**
- Ethereum (chainId: 1)
- Polygon (chainId: 137)
- BSC (chainId: 56)
- Arbitrum (chainId: 42161)
- Base (chainId: 8453)
- Solana (note: different sig scheme — may need separate handling)

### 5. Admin UI

- Manage verticals (CRUD)
- Manage asset types (CRUD)
- Manage supported chains (CRUD)
- Assign asset types to verticals
- View wallet verifications

### 6. Seller UI

- When creating/editing a listing, select vertical → asset type → subcategory
- Wallet verification section: connect wallet, sign message, see verified status
- "Wallet Control Verified" badge displays on listing when verified

### 7. Branding Update

- Update site name/title from MSP-specific to "Acquisitions.market — Digital Assets M&A"
- Update homepage copy to reflect digital-native assets focus
- Keep all existing functionality intact

## tRPC Routes Needed

```
// Taxonomy
admin.taxonomy.createVertical
admin.taxonomy.updateVertical
admin.taxonomy.deleteVertical
admin.taxonomy.createAssetType
admin.taxometry.updateAssetType
admin.taxonomy.deleteAssetType
admin.taxonomy.assignAssetTypeToVertical
admin.taxonomy.createSubcategory
taxonomy.listVerticals  // public
taxonomy.listAssetTypes  // public, filtered by vertical
taxonomy.listSubcategories  // public, filtered by asset type

// Wallet verification
listing.wallet.startVerification  // returns message to sign
listing.wallet.submitSignature  // submit signed message, backend verifies
admin.wallet.listVerifications
admin.wallet.revokeVerification

// Supported chains
admin.chains.create
admin.chains.update
admin.chains.delete
chains.list  // public
```

## File Locations (follow existing patterns)

- Schema: `drizzle/schema.ts` (add new tables at the end)
- Migrations: `drizzle/` (use `pnpm db:generate` then `pnpm db:push`)
- tRPC routers: `server/routers.ts` (add new procedures)
- Admin pages: `client/pages/admin/` (follow existing admin page patterns)
- Seller pages: `client/pages/` (follow existing listing create/edit patterns)
- DB functions: `server/db.ts` (add CRUD functions for new tables)

## Verification Commands

Before reporting done, run:
```bash
pnpm check    # TypeScript — must pass with zero errors
pnpm build    # Vite + esbuild — must succeed
pnpm lint     # ESLint — fix any new errors
```

## What NOT to Do

- Do NOT modify existing MSP enum fields or remove them
- Do NOT migrate existing listings to the new taxonomy (leave them as-is)
- Do NOT change the existing deal workflow, NDA, or KYC systems
- Do NOT refactor the authentication or Stripe payment flows
- Do NOT add tests unless specifically asked (keep scope tight for credit budget)
- Do NOT install new npm packages without checking what's already available

## Packages Already Available

Check package.json before installing anything. The project already has:
- drizzle-orm, drizzle-kit
- @trpc/server, @trpc/client, @trpc/react-query
- All Radix UI components
- react, react-dom
- ethers might not be installed — check first. If not, install `viem` (lighter) for signature recovery
