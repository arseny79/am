# Crypto / Web3 Layer — Feature Specification
## Acquisitions.Market

> **Design principle:** These features are *additive* — the existing iGaming M&A flow is
> unchanged. Every crypto feature is opt-in at listing and buyer level.
> The platform must NOT look like a DeFi app — clean, professional, institutional.

---

## Implementation Priority Order

| # | Feature | Effort | Value |
|---|---------|--------|-------|
| 1 | Crypto asset type tags + filters | Low | Immediate browse-side value |
| 2 | Strategic asset listings — lightweight lane | Low-Med | Expands supply quickly |
| 3 | Anonymous buyer mandates | Med | Attracts crypto buyers pre-KYC |
| 4 | Control Map — web3 ownership fields | Med | Core differentiator |
| 5 | Deal structure flexibility | Med | Extends deal room |
| 6 | Wallet-linked buyer verification | Med-High | Crypto-native trust layer |
| 7 | Telegram integration | Med | Distribution multiplier |
| 8 | Regulatory perimeter fieldset | Low-Med | Extends existing listing form |
| 9 | Liquidity & distribution scorecard | Low-Med | Extends listing detail |
| 10 | Stablecoin escrow | High | Phase 2 — design now, build later |

---

## Feature 1 — Crypto Asset Type Tags & Filters

**File touchpoints:** `drizzle/schema.ts`, listing router, `client/src/pages/Marketplace.tsx`, listing card component

### New asset type tags (add to existing taxonomy)
```
crypto_casino_b2c
crash_game_platform
sports_prediction_crypto
stablecoin_payment_rails_igaming
crypto_affiliate_media
kol_streamer_traffic
telegram_mini_app_igaming
web3_gaming_protocol
tokenized_loyalty_system
crypto_whitelabel_platform
licensed_entity_crypto_friendly
traffic_arbitrage_crypto
```

### New marketplace filters
- `accepts_stablecoin_closing` (boolean)
- `wallet_verified_seller` (boolean)
- `control_map_available` (boolean)
- `anonymous_seller` (boolean)
- `asset_type` (multi-select from tags above)
- `chain` (multi-select: ethereum | polygon | ton | solana | bnb | other)

### Listing card UI
- Show a small chain/crypto badge (₿ icon or chain logo) on cards where listing is crypto-typed
- Ensure crypto asset type tags are included in full-text search index

---

## Feature 2 — Strategic Asset Listings (Lightweight Lane)

**Purpose:** Lower-friction listing type for smaller crypto-adjacent assets too granular for a full deal room.

**File touchpoints:** `drizzle/schema.ts` (new `listingType` value), new listing creation flow branch, marketplace browse page

### Asset subtypes
```
telegram_community
twitter_x_account
discord_server
domain
player_vip_database
psp_payment_relationship
whitelabel_source_code
kyc_vendor_contract
affiliate_traffic_asset
token_contract
geo_legal_entity_shell
```

### Schema additions
```ts
// listings table — new fields
listingType: enum('business', 'digital_asset', 'strategic_asset')  // add 'strategic_asset'
strategicAssetSubtype: varchar(60)   // from subtypes above
```

### Rules
- **KYC gate:** email verification + basic profile only (no full KYC required to list)
- **Buyer access:** any email-verified buyer can view strategic asset listings — NO NDA gate
  - Must submit an enquiry to receive contact details
- **Success fee options:** flat 5% on assets under €50K, OR listing fee only (seller choice)
- **Dedicated section:** "Strategic Assets" on marketplace browse, filterable by subtype

### Listing form fields (simplified)
1. Asset name
2. Asset type (dropdown from subtypes)
3. Asking price
4. Brief description (max 1000 chars)
5. Proof of ownership (file upload)
6. Preferred contact method

---

## Feature 3 — Anonymous Buyer Mandates

**Purpose:** Crypto-native buyers post acquisition criteria without revealing identity until they choose to engage.

**File touchpoints:** `buyerRequests` schema, buyer mandate UI, deal room mandate display

### Schema additions
```ts
// buyerRequests table — new fields
anonymousMode: boolean (default false)
anonymousHandle: varchar(20)          // e.g. "Verified Buyer #A7F2" — generated on toggle
isCryptoBuyer: boolean (default false)

// New crypto-specific mandate criteria fields
acceptsStablecoinPayment: boolean
dealStructuresConsidered: json  // array: full_acquisition | asset_purchase | revenue_share | token_warrant | acqui_hire
preferredChains: json           // array: ethereum | polygon | ton | solana | bnb | other
minOnChainRevenue: decimal(15,2) nullable
minTvl: decimal(15,2) nullable
```

### Anonymous mode behaviour
- Buyer display name → auto-generated handle (`"Verified Buyer #" + 4 random hex chars`)
- Company name, wallet address, real identity hidden from sellers and other buyers
- Admin panel: always shows real identity behind the handle
- Identity reveal: triggered only when seller accepts engagement AND both parties confirm
- Seller sees when viewing a mandate: handle + verified status + mandate criteria + activity score

### Crypto Buyer tag
- Visible badge on mandate cards indicating comfort with:
  - Stablecoin closing
  - Token-structured deals
  - Asset carve-outs

---

## Feature 4 — Control Map (Web3 Asset Ownership Fields)

**Purpose:** Structured "who controls what" section solving the token ownership ≠ economic ownership problem.

**File touchpoints:** `drizzle/schema.ts` (new `listingControlMap` table), listing detail page, admin listing view

### Visibility rules
- Only shown on listings tagged as web3/crypto asset type
- Gate: NDA must be signed before values are visible
- Pre-NDA: field names shown, values blurred — tease that control map exists
- Admin: can mark individual fields as `disclosed` or `withheld_pending_loi`

### Schema — new table `listing_control_maps`
```ts
id, listingId (FK), createdAt, updatedAt

// Treasury & Token
treasuryWallets: json (array of {address, masked: boolean})
treasuryComposition: json ({usdt_pct, eth_pct, btc_pct, other_pct, other_description})
tokenContractAddress: varchar(100) nullable
tokenVestingSchedule: text nullable
insiderTokenConcentrationPct: decimal(5,2) nullable
hasActiveMarketMaker: boolean nullable
marketMakerCounterparty: varchar(100) nullable

// Governance & Control
multisigSignersCount: int nullable
multisigThreshold: int nullable
governanceMechanism: enum('token_vote','company','hybrid','none') nullable
smartContractUpgradeable: enum('yes','no','immutable') nullable
codeRepoOwner: varchar(200) nullable
codeRepoTransferable: boolean nullable

// Distribution & Access
primaryChains: json (array of chain names)
exchangeListings: json (array of {name, type: 'cex'|'dex', poolSizeUsd: number nullable})
walletIntegrations: json (array of strings)
bridgeExposure: boolean nullable
bridgesNamed: json (array of strings)

// Legal & Regulatory (crypto-specific — complements Feature 10)
cryptoLicenses: json (array of strings)
permittedJurisdictions: json
kycAmlProvider: varchar(200) nullable
sanctionsScreeningInPlace: boolean nullable
bankingRelationshipsTransferable: boolean nullable

// Social & Brand
twitterHandle: varchar(100) nullable
twitterTransferable: boolean nullable
telegramCommunityHandle: varchar(100) nullable
telegramMemberCount: int nullable
telegramTransferable: boolean nullable
discordServerName: varchar(100) nullable
discordMemberCount: int nullable
discordTransferable: boolean nullable
domainsIncluded: json (array of strings)

// Admin disclosure flags
fieldDisclosureStatus: json  // {fieldName: 'disclosed'|'withheld_pending_loi'}
```

---

## Feature 5 — Deal Structure Flexibility

**Purpose:** Support deal structures beyond full acquisition common in crypto/web3 M&A.

**File touchpoints:** `offerHistory` schema, deal room Offer step UI, listing form, buyer mandate form

### Deal structure enum (add to schema)
```ts
enum DealStructure {
  full_acquisition
  asset_purchase        // seller specifies which assets
  revenue_share_transfer
  token_warrant
  acqui_hire
  ip_source_code_sale
  community_social_account_transfer
  treasury_purchase
  strategic_merger      // token swap or earn-out
  other                 // + custom text field
}
```

### Schema additions
```ts
// listings table
acceptedDealStructures: json  // array of DealStructure values

// offerHistory / deal offer step
dealStructure: DealStructure
dealStructureAssets: text nullable  // for asset_purchase — list which assets
dealStructureCustomText: varchar(500) nullable  // for 'other'

// buyerRequests table
preferredDealStructures: json  // array of DealStructure values
```

### Deal room UI
- Display both sides' accepted/preferred structures
- Highlight matches in green, mismatches in amber
- For `token_warrant` or `treasury_purchase`: show a note prompt:
  > "This deal structure involves token-specific documentation. We recommend engaging legal counsel experienced in token transactions before proceeding."

---

## Feature 6 — Wallet-Linked Buyer Verification

**Purpose:** Crypto-native buyers verify identity via wallet signature (SIWE) as alternative/supplement to traditional KYC.

**File touchpoints:** `drizzle/schema.ts`, KYC router, buyer profile page, admin KYC dashboard

### Tech stack
- `wagmi` + `viem` for wallet connection (React)
- Wallets: MetaMask, WalletConnect, Coinbase Wallet (minimum)
- Sign-In With Ethereum (SIWE — EIP-4361) for signing flow

### Signing flow
1. Backend generates a nonce per session (stored temporarily, expires in 10 min)
2. Client constructs SIWE message: domain, address, nonce, issued-at
3. User signs message in wallet — no private key exposure
4. Client sends signature + message to backend
5. Backend verifies signature → confirms wallet ownership
6. Wallet address stored on profile as verified

### Schema additions
```ts
// users table (or new table linked_wallets)
walletAddress: varchar(42) nullable       // checksummed Ethereum address
walletChainId: int nullable               // e.g. 1 = Ethereum mainnet
walletVerifiedAt: timestamp nullable
walletBalanceThresholdMet: boolean nullable  // on-chain balance above configured threshold
walletVerificationNonce: varchar(64) nullable  // ephemeral, cleared after use
```

### Buyer profile badge
- "Wallet Verified" badge shown to sellers **inside deal room only** (not public)
- Optional: show on-chain balance above threshold (e.g. ">$500K on-chain treasury") without exposing full address

### Admin KYC panel additions
- Wallet address column in KYC review table
- Verification status: `wallet_verified` | `document_verified` | `both` | `none`

---

## Feature 7 — Telegram Integration

**Purpose:** Telegram is the primary comms channel for crypto/iGaming — use it as top-of-funnel distribution and notification layer.

**File touchpoints:** new `server/routes/telegram.ts`, user profile schema, notification system, admin listing panel

### Tech
- Telegram Bot API (HTTP-based, no heavy SDK needed)
- Bot name: `@acquisitions_market_bot` (or similar — confirm availability)

### Schema additions
```ts
// users table
telegramChatId: varchar(50) nullable
telegramLinkedAt: timestamp nullable
telegramNotifPrefs: json  // {new_listings: bool, deal_updates: bool, access_requests: bool, mandate_alerts: bool}
```

### User-facing flow
1. User visits profile → clicks "Connect Telegram"
2. System generates a one-time auth token (10 min expiry)
3. User opens bot → sends `/start <token>`
4. Bot confirms link → `telegramChatId` stored on profile
5. User sets notification preferences in profile

### Notification types (bot sends teasers only — no confidential data)
- New listing matching saved search criteria
- Access request notifications
- Deal room updates (new message, stage change, action item due)
- New buyer mandate alerts

### Admin: "Publish to Telegram Channel" button
- Appears on each listing in admin panel
- Sends anonymised teaser to the curated platform Telegram channel
- **Teaser format:**
  ```
  🏢 [Asset Type] | [Price Range - rounded] | [Jurisdiction]
  [1-line description — no business name, no seller identity]
  
  👉 Request Access → [platform URL with listing token]
  ```
- No seller identity or business name in the teaser

---

## Feature 8 — Regulatory Perimeter Fieldset

**Purpose:** Crypto-specific compliance and jurisdictional data essential for evaluating regulated iGaming assets.

**File touchpoints:** `drizzle/schema.ts` (extend listings table or new `listing_regulatory` table), listing detail page, listing creation form

### Visibility
- Section "Regulatory Perimeter" visible after NDA is signed
- Pre-NDA teaser: "Regulatory Perimeter: Available after NDA"

### Schema additions (new table `listing_regulatory_perimeter`)
```ts
id, listingId (FK), updatedAt

cryptoLicenses: json         // e.g. ["VASP registration", "MiCA compliant", "Curaçao crypto gaming"]
permittedJurisdictions: json // array of country codes / names
geoblockedJurisdictions: json
sanctionsScreeningProvider: varchar(200) nullable
kycAmlProvider: varchar(200) nullable
kycAmlIsOnChain: boolean nullable
stablecoinPaymentProcessor: varchar(200) nullable
bankingPartner: varchar(200) nullable
bankingTransferable: boolean nullable
amlPolicyLastUpdated: date nullable
```

---

## Feature 9 — Liquidity & Distribution Scorecard

**Purpose:** Structured scorecard for crypto-native listings — complements revenue/EBITDA with on-chain and distribution metrics.

**File touchpoints:** `drizzle/schema.ts` (new `listing_crypto_scorecard` table), listing detail page

### Visibility
- Visible after NDA, for crypto-typed listings only
- Display as a card grid in listing detail view
- Marketplace filter: "Has scorecard" boolean

### Schema — new table `listing_crypto_scorecards`
```ts
id, listingId (FK), updatedAt

monthlyActiveWallets: int nullable
tokenLiquidity24hVolume: decimal(15,2) nullable
tokenLiquidityVenue: varchar(100) nullable
cexListings: json (array of strings)
dexPoolSizeUsd: decimal(15,2) nullable
walletIntegrations: json (array of strings)
hasAffiliateLoop: boolean nullable
affiliateCommissionPct: decimal(5,2) nullable
kolPartnershipsCount: int nullable
kolEstimatedReach: int nullable
telegramCommunitySize: int nullable
hasApiEmbedIntegrations: boolean nullable
apiIntegrationCount: int nullable
primaryTrafficSource: enum('organic','paid','referral','on_chain','mixed') nullable
```

---

## Feature 10 — Stablecoin Escrow (Phase 2 — Design Now)

**Purpose:** Allow deals to close in USDT/USDC as alternative to fiat escrow.

**File touchpoints:** deal room escrow step, new `deal_stablecoin_escrow` table, admin deal panel

> ⚠️ **Implementation:** Start with Phase 1 (manual multisig). Design schema for Phase 2 (smart contract) now.

### Schema — new table `deal_stablecoin_escrows`
```ts
id, dealId (FK), createdAt, updatedAt

escrowType: enum('fiat','stablecoin')  // toggle in deal room
token: enum('USDT','USDC') nullable
chain: enum('ethereum','polygon') nullable
depositAddress: varchar(42) nullable   // generated per deal
txHash: varchar(66) nullable           // on-chain proof of funding
amount: decimal(20,6) nullable
status: enum('pending_funding','funded','released','dispute','refunded')
feeAddress: varchar(42) nullable       // separate address for platform success fee
feeAmount: decimal(20,6) nullable
feeTxHash: varchar(66) nullable
smartContractAddress: varchar(42) nullable  // Phase 2 only
multisigSigners: json nullable              // Phase 2 only
legalDisclaimerAccepted: boolean
legalDisclaimerAcceptedAt: timestamp nullable
```

### Phase 1 (manual multisig) flow
1. Deal room escrow step: buyer selects "Stablecoin Escrow"
2. System displays: supported tokens, deposit address (unique per deal), instructions
3. Admin/platform monitors via Etherscan/Polygonscan API for incoming transactions
4. On funding confirmed: update status → `funded`, store `txHash`
5. On release: admin triggers release → status → `released`

### Phase 2 (smart contract) — future
- Standard 2-of-3 multisig escrow pattern
- Deploy per deal, address stored in `smartContractAddress`

### API monitoring (Phase 1)
- Etherscan API: `?module=account&action=tokentx&address=<deposit>&contractaddress=<USDT/USDC>`
- Polygonscan API: same endpoint on Polygon
- Run as a background job (add to existing scheduler)

### Legal
Add disclaimer displayed before escrow type selection:
> "Stablecoin escrow is provided as a transactional tool. acquisitions.market does not provide financial, custodial, or regulated exchange services. Parties are responsible for their own tax and regulatory obligations."

---

## Cross-Cutting Notes

### Cookie/session
- Wallet verification nonce must be tied to session, not just IP
- SIWE message must include the platform domain to prevent replay attacks

### Admin visibility
- All "anonymous" features (buyer handles, masked wallets) are always fully visible to admin
- Audit log entries should capture wallet address where relevant

### Search indexing
- Crypto asset type tags, chain names, and scorecard fields should be included in full-text search
- Existing Drizzle-based search queries will need extending

### Environment variables to add (future)
```
ETHERSCAN_API_KEY=
POLYGONSCAN_API_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHANNEL_ID=
WALLET_BALANCE_THRESHOLD_USD=500000
COMING_SOON_KEY=          # already added
```
