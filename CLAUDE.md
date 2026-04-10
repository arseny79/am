# AM — Project Memory for Claude

## What is AM?

- **AM** stands for **acquisitions.market** — that is also the domain for the project.
- AM is the **next iteration of iGacquire.com** — not a copy of it, but an evolution.
- AM's codebase started as a **copy of the MSPi platform code** and is being refactored/extended from there.

---

## Core Concept

A **multi-asset acquisition marketplace** where both **legacy (traditional) businesses** and **crypto/web3/degen assets and businesses** can be bought and sold. It goes beyond MSPs — any type of business or digital asset is in scope.

---

## Key Differences vs. iGacquire / MSPi

### 1. Asset Types
- **Legacy assets & businesses** (traditional M&A: MSPs, SaaS, e-commerce, agencies, etc.)
- **Crypto / Web3 / Degen assets & businesses** (DAOs, DeFi protocols, NFT projects, on-chain businesses, wallets, domains, etc.)

### 2. Multi-Level Admin System
- **Superadmin** — full platform control
- **Lower-level admins** — superadmin can delegate specific functions/permissions to them
- Admin hierarchy is role-based and granular (not just a single "admin" role)

### 3. AI-Enabled Architecture
- AI can be connected via API at **many levels** of the platform
- Architecture must be **modular** so AI features can be plugged in/out independently
- Examples: AI valuation, AI risk scoring, AI matching, AI due diligence assistance

### 4. Superadmin Category Management
- Superadmin can **add, modify, and remove categories** at any time
- Each category can have its **own price structure** configured by the superadmin
- No hardcoded categories — fully dynamic

### 5. Dual Fee Model (by asset type)
| Asset Type | Fee Model |
|---|---|
| **Businesses** | **Percentage fee** on sale (success-based) — can upgrade for more exposure via pre-paid premium services |
| **Assets** (non-business) | **Fixed fee** (pre-paid) |

Premium exposure upgrades for businesses are **pre-paid** (not success-based).

---

## Inherited Platform Context (from MSPi / iGacquire)

The following was already built in the codebase that AM starts from:

- **Tech stack:** React 19, TypeScript, Tailwind CSS 4, Vite (frontend) + Express.js, tRPC (backend) + MySQL + Drizzle ORM
- **Auth:** OAuth, session-based, TOS/Privacy Policy click-wrap on first login
- **Payments:** Stripe (checkout, webhooks, refunds, receipts)
- **Email:** SendGrid
- **Escrow:** Escrow.com webhook integration (API client pending credentials)
- **File storage:** S3-compatible
- **KYC/Verification:** Document upload + Stripe Identity
- **Deal workflow:** Kanban pipeline (Initial Contact → NDA → Due Diligence → Negotiation → Escrow → Closing)
- **NDA system:** Click-wrap, PDF upload, DocuSign columns, custom seller templates
- **Valuation:** Multi-step wizard (EBITDA-based with adjustments for recurring revenue, contract quality, client concentration, YoY growth)
- **Admin dashboard:** KYC review, listing moderation, user management, analytics, refunds, SEO metadata, platform documents manager
- **Buyer request workflow:** Buyers post requests, sellers submit proposals, auto-creates deal
- **Security:** Helmet headers, rate limiting, Zod validation, parameterized queries, ownership checks
- **Legal pages:** Terms of Service, Privacy Policy, Disclaimer, Cookie Policy, AUP (tied to iGAcquire OÜ — needs updating for AM)
- **Company entity used in legacy code:** iGAcquire OÜ (Estonia) — will need to be updated for AM

---

## Strategic Positioning

- **vs. traditional brokers:** Lower cost, automated workflow, transparent pricing, direct buyer access
- **vs. iGacquire:** Broader asset types (crypto/web3), modular AI, dynamic category management, multi-level admin
- **vs. MSPX:** Full business + asset sales (not just contracts), flexible deal structures, higher transaction value

---

## Pre-Launch Mode ("Getting Ready for Launch")

### Requirement
The platform has a **site-wide pre-launch gate**:

- **All regular (non-admin) users** — see only a **"Getting Ready for Launch"** page (coming soon screen). They cannot access any other part of the site.
- **Admin users** — bypass the gate entirely and see the **full platform** (both frontend and backend/admin) as normal, directly on the website.

### Behaviour Rules
- The gate is controlled by a **flag** (e.g., `launchMode: 'pre-launch' | 'live'`) managed by the superadmin.
- When the flag is `pre-launch`: non-admin visitors hit the coming-soon wall; admins see everything.
- When the flag is `live`: everyone sees the full site.
- Auth still works during pre-launch (admins must be able to log in to get past the gate).
- The coming-soon page should be a clean, branded page — no navigation, no listings visible.

### Implementation Notes
- Gate check should happen at the **router/middleware level** (server-side) OR as a top-level React wrapper component that checks user role + launch flag before rendering routes.
- The launch flag should be stored in `siteSettings` (already in DB) and togglable from the admin dashboard.
- No separate domain or subdomain needed — everything is on the same domain.

---

## Launch Plan for acquisitions.market

### Already Built (inherited from MSPi — do NOT rebuild)
- Auth (OAuth, sessions, TOS click-wrap)
- Stripe payments (checkout, webhooks, refunds, receipts)
- SendGrid email (needs API key config)
- Escrow.com webhook integration (needs API credentials)
- KYC + Stripe Identity verification
- Deal workflow (Kanban: Initial Contact → NDA → Due Diligence → Negotiation → Escrow → Closing)
- NDA system (click-wrap, PDF upload, custom seller templates)
- Valuation wizard (multi-step, EBITDA-based)
- Sales Packet / Preparation Wizard (templates, readiness score)
- Buyer Qualification (proof of funds, verification levels)
- Due Diligence Checklist (50-item, Q&A threads, progress tracking)
- Admin dashboard (KYC review, moderation, analytics, refunds, SEO, docs manager)
- Buyer Request workflow (post requests, submit proposals, auto-creates deal)
- Security hardening (Helmet, rate limiting, Zod, parameterized queries)
- Legal pages (need rebrand from iGAcquire OÜ to AM entity)

---

### Phase 0 — Deploy & Gate (Priority: IMMEDIATE, ~3 days)
**Goal:** Get the codebase live on acquisitions.market safely, invisible to public.

- [ ] Point acquisitions.market domain to server (DNS CNAME → Railway)
- [x] Configure minimum environment variables (DATABASE_URL, JWT_SECRET, SESSION_SECRET) ✓
- [ ] Configure remaining env vars when ready (Stripe, SendGrid, S3, Escrow.com)
- [x] Implement pre-launch gate ✓
  - [x] `launchMode` flag added to `siteSettings` DB table ✓
  - [x] Toggle added in admin dashboard (LaunchModeTab) ✓
  - [x] Branded "Getting Ready for Launch" ComingSoon page built ✓
  - [x] Top-level React route guard in App.tsx ✓
- [x] App deployed to Railway and running ✓
- [ ] Set `launchMode = pre_launch` in admin dashboard (currently `live` by DB default)
- [ ] Verify superadmin login works and bypasses gate
- [ ] Create superadmin account

**Outcome:** Platform is live on the real domain. Admins can build/test. Public sees nothing.

---

### Phase 1 — Rebrand: Strip MSPi, Become acquisitions.market (~1 week)
**Goal:** Remove all MSP/iGacquire identity. Platform looks and feels like AM.

- [ ] Replace all "MSP Marketplace", "iGacquire", "MSPi" text with "acquisitions.market" / "AM"
- [ ] Update legal entity across all documents (iGAcquire OÜ → correct AM entity + jurisdiction)
- [ ] Update Terms of Service, Privacy Policy, Disclaimer for AM scope (all businesses + assets, not just MSPs)
- [ ] New logo, color palette, typography for acquisitions.market brand
- [ ] Rewrite homepage copy — hero, features, how it works (broader: any business, any asset)
- [ ] Remove MSP-specific category references from UI (will be replaced with dynamic categories)
- [ ] Update email templates (SendGrid) with AM branding
- [ ] Update meta tags, OG images, favicon

**Outcome:** Platform looks like acquisitions.market. Zero MSP/iGacquire identity remaining.

---

### Phase 2 — Core AM Architecture (~2 weeks)
**Goal:** Implement the three structural AM differences: admin hierarchy, dynamic categories, dual fee model.

#### 2A — Multi-Level Admin System
- [ ] Extend `users` table: add `adminRole` enum (`superadmin | moderator | support | null`)
- [ ] Define permission set per admin role (e.g. moderator can approve listings but not manage categories or fees)
- [ ] Superadmin UI: delegate/revoke admin roles to any user
- [ ] Update all admin route guards to check specific permission, not just `role === admin`
- [ ] Admin dashboard shows only sections the logged-in admin has permission for

#### 2B — Dynamic Category Management
- [ ] Create `categories` table: `id, name, slug, type (business|asset), description, isActive, sortOrder`
- [ ] Create `categoryPriceStructures` table: `categoryId, feeType (percentage|fixed), feeValue, currency, premiumUpgradePrice`
- [ ] Superadmin UI: full CRUD for categories + price structure per category
- [ ] Remove all hardcoded category/MSP-type references from listing forms and filters
- [ ] Listing creation dynamically fetches active categories from DB

#### 2C — Dual Fee Model
- [ ] Listing type field on all listings: `listingType: 'business' | 'asset'`
- [ ] **Business listings:** success-based % fee (configured per category by superadmin) + optional pre-paid premium exposure upgrades
- [ ] **Asset listings:** fixed fee (pre-paid, configured per category by superadmin)
- [ ] Update Stripe checkout to use correct fee model based on `listingType`
- [ ] Update Pricing page to explain both models clearly

**Outcome:** Superadmin controls everything. No hardcoded categories or prices. Both fee models work.

---

### Phase 3 — Crypto/Web3 Asset Support (~2 weeks)
**Goal:** Enable crypto/web3/degen assets to be listed alongside traditional businesses.

- [ ] Add crypto/web3 categories via the new dynamic category system (superadmin seeds them)
- [ ] Extend listing schema with crypto-specific optional fields:
  - `blockchain` (Ethereum, Solana, Base, etc.)
  - `contractAddress`
  - `tokenType` (ERC-20, ERC-721, ERC-1155, etc.)
  - `smartContractAuditUrl`
  - `treasurySize` / `TVL`
  - `daoGovernanceUrl`
  - `discordUrl` / `telegramUrl`
- [ ] Conditional field display in listing form based on category type
- [ ] Crypto asset listings use fixed fee model
- [ ] Valuation approach for crypto assets (different from EBITDA — market cap, TVL, revenue multiples)
- [ ] Due diligence checklist: add crypto-specific template (smart contract audit, multisig setup, token distribution, etc.)

**Outcome:** A DeFi protocol, NFT project, or on-chain business can be listed alongside a traditional SaaS company.

---

### Phase 4 — Modular AI Integration Layer (~1–2 weeks, foundation only)
**Goal:** Build the architectural foundation so AI can be plugged in at any point — not full AI features yet.

- [ ] Create `ai` service module: `server/lib/ai/aiService.ts` — single entry point for all AI calls
- [ ] Pluggable provider interface: `AIProvider` (supports OpenAI, Anthropic, etc., swappable via env var)
- [ ] AI feature flags in `siteSettings`: superadmin can enable/disable each AI feature independently
- [ ] First AI feature (MVP): **AI listing description generator** — seller fills in numbers, AI writes the description
- [ ] Second AI feature (MVP): **AI valuation commentary** — plain-English explanation of the valuation output
- [ ] Architecture ready for future: AI risk scoring, AI buyer-seller matching, AI due diligence assistant

**Outcome:** AI is wired in and working for 2 lightweight features. Infrastructure is ready to expand.

---

### Phase 5 — Missing Workflow Features (~2 weeks)
**Goal:** Fill the remaining critical gaps identified in the iGacquire gap analysis.

- [ ] **LOI (Letter of Intent) Management**
  - LOI template library (customizable)
  - Key terms tracking (price, structure, earn-out, exclusivity, timeline)
  - E-signature integration (DocuSign or HelloSign)
  - Version control + status tracking (draft → sent → signed)
- [ ] **Flexible Deal Structures**
  - Listing-level field: deal type (full sale, partial, merger, earn-out, seller financing)
  - Partial ownership calculator
  - Earn-out terms builder
  - Post-sale employment agreement template
- [ ] **Multiple Offer Comparison Tool**
  - Structured offer submission form
  - Side-by-side comparison matrix
  - Weighted scoring (seller defines priorities)

**Outcome:** Platform matches traditional broker workflow capability end-to-end.

---

### Phase 6 — Beta / Soft Launch (~1 week)
**Goal:** Real users test the platform under controlled conditions before public launch.

- [ ] Invite 10–20 trusted beta users (mix of buyers and sellers, both legacy and crypto)
- [ ] Set `launchMode` to a new `beta` state: gate shows but has an invite code / beta access link
- [ ] Collect structured feedback (deal workflow, categories, fee model, crypto listings)
- [ ] Fix all bugs and friction points surfaced in beta
- [ ] Load test the platform (deal room, search, file uploads)
- [ ] Verify all external integrations work with real credentials (Stripe live mode, SendGrid, Escrow.com)
- [ ] Final security review

---

### Phase 7 — Public Launch
**Goal:** Flip the switch.

- [ ] Superadmin sets `launchMode = live` in admin dashboard
- [ ] Pre-launch gate drops for all users
- [ ] Launch marketing (announcement, social, community outreach in web3 + traditional M&A channels)
- [ ] Monitor: error rates, deal creation rate, listing conversion, support tickets
- [ ] Have support workflow ready (at minimum: email support linked in footer)

---

### Post-Launch Roadmap (after go-live)
In priority order:
1. AI Risk Scoring (per listing — client concentration, revenue trend, churn, contract quality)
2. AI Buyer-Seller Matching (recommend listings to buyers based on stated criteria)
3. Merger Matching (MSP + MSP or web3 project + web3 project)
4. Post-Sale Planning Tools (financial calculator, transition timeline)
5. Peer Community (forum for sellers preparing for sale)
6. Mobile app or PWA

---

## Critical Features Still to Build (summary checklist)

### Blocking launch:
- [x] Pre-launch gate ✓ built
- [ ] Rebrand (acquisitions.market identity)
- [ ] Legal entity update in all docs
- [ ] Multi-level admin system
- [ ] Dynamic category management
- [ ] Dual fee model
- [ ] Crypto/web3 listing fields + categories
- [ ] Modular AI layer (foundation)
- [ ] LOI management
- [ ] Flexible deal structures

### Important but can follow shortly after:
- [ ] Multiple Offer Comparison tool
- [ ] AI risk scoring
- [ ] AI buyer-seller matching
- [ ] Merger matching
- [ ] Mobile/PWA

---

## Deployment — Railway (as of 2026-04-08)

### Status
- **App is LIVE on Railway** — successfully deployed and running.
- Database: **MySQL** plugin inside Railway, connected via `DATABASE_URL` env var.
- Build: **Dockerfile** (node:22-alpine, pnpm@10.4.1 installed via `npm install -g`).
- Start command: `pnpm db:migrate && pnpm start`
- App listens on **port 3000**.

### Railway Setup
- Builder: `DOCKERFILE` (set in `railway.json`) — do NOT use Nixpacks (pnpm PATH issues).
- `railway.json` specifies `"builder": "DOCKERFILE"` and `"dockerfilePath": "Dockerfile"`.
- Railway deploys from the **`main`** branch.
- To add public URL: Railway → service → Networking → Generate Domain → enter port **3000**.
- Custom domain: Railway → Networking → Custom Domain → add `acquisitions.market`, then CNAME your DNS to Railway's hostname.

### Environment Variables (set in Railway service)
Required minimum to boot:
```
NODE_ENV=production
DATABASE_URL=mysql://user:pass@host:port/dbname   # from Railway MySQL plugin
JWT_SECRET=<random-long-string>
SESSION_SECRET=<random-long-string>
```
Add later when ready:
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=SG....
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
S3_BUCKET_NAME=...
ESCROW_API_KEY=...
```

### Migration Fixes Applied (do not revert)
The original Drizzle-generated migrations had two MySQL 8.0 compatibility bugs — both fixed in the migration `.sql` files:

1. **`ER_WRONG_AUTO_KEY` (errno 1075)** — AUTO_INCREMENT columns were missing `PRIMARY KEY` constraints.
   - Fixed in: `0000_busy_unicorn.sql`, `0002_long_impossible_man.sql`, `0057_ambiguous_screwball.sql`, `0062_lonely_sharon_carter.sql`, `0067_giant_the_professor.sql`

2. **`ER_INVALID_DEFAULT` (errno 1067)** — `DEFAULT 'CURRENT_TIMESTAMP'` (quoted string) rejected by MySQL 8.0 strict mode. Must be `DEFAULT CURRENT_TIMESTAMP` (unquoted keyword).
   - Fixed in: `0000_busy_unicorn.sql`, `0002_long_impossible_man.sql`, `0057_ambiguous_screwball.sql`, `0058_many_the_captain.sql`, `0062_lonely_sharon_carter.sql`, `0064_smiling_sleepwalker.sql`, `0067_giant_the_professor.sql`

**Never regenerate these migration files** — the fixes would be lost. If schema changes are needed, add new migration files on top.

### Stripe / Optional Services
- Stripe is **null-safe** — app boots without `STRIPE_SECRET_KEY`. All 9 Stripe client initializations use:
  ```ts
  const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(...) : null;
  ```
- `OAUTH_SERVER_URL` is **not required** — removed from `REQUIRED_ENV_VARS`. App uses its own email/password auth via `emailAuth.login` tRPC endpoint.

### What's Still Needed for Phase 0 Completion
- [ ] Point `acquisitions.market` DNS → Railway (CNAME)
- [ ] Create superadmin account in DB and verify it bypasses the pre-launch gate
- [ ] Confirm pre-launch gate shows ComingSoon to public, full platform to admins

---

## Pre-Launch Gate — Implementation Summary

### What was built
- **`client/src/pages/ComingSoon.tsx`** — dark branded coming-soon page. Animated violet badge, gradient headline, email waitlist form, 3 stat teasers, staff login link bottom-right.
- **`client/src/App.tsx`** — top-level gate logic:
  ```ts
  const isPreLaunch = launchMode === "pre_launch";
  const isAdmin = user?.role === "admin";
  if (isPreLaunch && !isAdmin && !loading && !isLoginPath) return <ComingSoon />;
  ```
- **`drizzle/schema.ts`** — `launchMode varchar(20) DEFAULT 'live'` added to `siteSettings` table.
- **`server/routers/adminRouter.ts`** — `launchMode: z.enum(["pre_launch", "live"])` added to `updateSiteSettings` input.
- **`client/src/pages/admin/tabs/LaunchModeTab.tsx`** — admin UI toggle between pre_launch and live, with colored status card.
- **`client/src/pages/AdminDashboardModular.tsx`** — "Launch Mode" tab added to Settings category with Rocket icon.

### launchMode values
- `"live"` — everyone sees the full site (default in DB schema)
- `"pre_launch"` — public sees ComingSoon, admins see full platform
