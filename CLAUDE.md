# AM — acquisitions.market — Architect Memory File

---

## CRITICAL — Working With This User (READ EVERY SESSION)

1. **The user is NOT a developer.** Always give step-by-step plain-English instructions for anything they need to do manually (deploying, setting env vars, clicking in the admin, etc.). Never assume technical knowledge. Never say "just run X" without explaining what it does and where to run it.

2. **Admin dashboard controls everything.** The platform philosophy is: as little as possible should be hardcoded or require code/env changes. Every operational toggle (launch mode, AI on/off, pricing, email settings, etc.) must be controllable from the Admin Dashboard. If a feature requires an env var to function, also expose it as an admin UI setting where possible.

3. **Minimize hardcoded values.** Prefer DB-stored settings (via `siteSettings` table) over env vars for anything the user might want to change at runtime. Env vars are only for secrets and infra-level config (DB URL, API keys).

4. **When giving instructions, be specific:**
   - Tell the user exactly where to click in the admin dashboard
   - Tell the user exactly which file to open and what to look for if needed
   - Number every step
   - Confirm what success looks like

---

## Admin Role Levels (CRITICAL)

Three role levels exist on the platform. Only `superadmin` can manage categories and promote other admins.

| Role | Enum value | Can do |
|---|---|---|
| Regular user | `user` | Browse, list, buy, deal flow |
| Admin | `admin` | Manage listings, users, KYC, deals, content, settings |
| Superadmin | `superadmin` | Everything admin can do + manage categories, promote/demote admins, platform-level destructive actions |

### In code
- `publicProcedure` — no auth
- `protectedProcedure` — logged in
- `adminProcedure` — role = `admin` OR `superadmin`
- `superadminProcedure` — role = `superadmin` only
- `emailVerifiedProcedure`, `kycVerifiedProcedure`, `verifiedProcedure` — as before

### DB: users.role enum
`['user', 'admin', 'superadmin', 'suspended']`

Previously was `['user', 'admin', 'suspended']` — `superadmin` added in Phase B.

---

## Listing Category Architecture (CRITICAL)

### Two top-level groups (hardcoded enum — intentional)
- `business` — operating businesses being sold (generates revenue, has employees/customers)
- `asset` — digital or physical assets (not necessarily operating businesses)

### Categories stored in DB (`listingCategories` table — NOT hardcoded)
Superadmin can add, edit, deactivate, reorder, and move categories between groups from the Admin Dashboard → Categories tab.

#### Default seed categories

**Group: business**
| Slug | Name |
|---|---|
| `msp` | MSP / IT Services |
| `saas` | SaaS |
| `ecommerce` | eCommerce |
| `agency` | Agency / Services |
| `igaming-business` | iGaming Business (licensed casino, sportsbook, poker) |
| `media` | Media & Content |
| `other-business` | Other Business |

**Group: asset**
| Slug | Name |
|---|---|
| `web3-protocol` | Web3 / Crypto Protocol |
| `nft-project` | NFT Project / Collection |
| `defi` | DeFi Platform |
| `dao` | DAO / Community |
| `igaming-license` | iGaming License |
| `crypto-exchange` | Crypto Exchange |
| `domain-digital` | Domain / Digital Property |
| `other-asset` | Other Asset |

### listings table additions
- `assetGroup` enum: `business` | `asset` — top-level group
- `categoryId` int FK → `listingCategories.id` — specific category

### Metrics by category type
Different categories show different metric fields in the listing form:
- **Business (MSP/SaaS/eCommerce/Agency):** MRR, EBITDA, client count, churn, employee count
- **iGaming Business:** GGR (Gross Gaming Revenue), MAU (monthly active players), license jurisdiction, platform type
- **Web3/DeFi/Crypto:** TVL, token holders, daily active wallets, protocol revenue, treasury size, chain
- **NFT Project:** floor price, total volume, holder count, chain
- **iGaming License:** license type, jurisdiction, expiry date, current status
- **Domain/Digital:** monthly traffic, DA score, monetization method

---

## Project Identity

- **Product name:** acquisitions.market
- **Domain:** acquisitions.market
- **Legal entity:** iGacquire OÜ
- **Origin:** Fork/copy of MSPi (MSP.investments) — same codebase, same tech stack
- **Status:** Production-ready, actively in development

## What AM Is — The Vision (CRITICAL — READ THIS FIRST)

**AM is the next iteration of iGacquire.**

The codebase is based on MSPi (MSP.investments) — so the repo still contains MSPi artifacts (MSP-specific copy, seed data, terminology). These need to be generalized/replaced as we build AM.

**AM's core differentiator:** It bridges TWO audiences on one platform:
1. **Legacy/traditional crowd** — business brokers, MSP buyers/sellers, traditional M&A professionals
2. **Web3/crypto/degen/iGaming crowd** — crypto-native buyers, web3 businesses, iGaming assets, NFT projects, degen investors

Both crowds can buy and sell assets on acquisitions.market. The platform must accommodate:
- Traditional business listings (MSPs, SaaS, eCommerce, agencies, etc.)
- Web3/crypto assets (protocols, NFT projects, DAOs, DeFi platforms)
- iGaming assets (gaming platforms, casino licenses, gambling sites)
- Cross-crowd deals (e.g. a crypto buyer acquiring a traditional SaaS)

**Implications for development:**
- Asset types must be flexible — not just MSP metrics (MRR, EBITDA) but also web3 metrics (TVL, token holders, daily active wallets)
- Payment methods may need to include crypto in addition to fiat/Stripe
- Listing creation flow needs to support both asset types without confusing either crowd
- UI/UX language should be neutral enough to not alienate either crowd
- NDA and deal flow must work for both traditional and web3 transactions
- The platform is an **open marketplace**, not a broker — iGacquire OÜ facilitates, not advises

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 19 |
| Language | TypeScript | 5.9 |
| Styling | Tailwind CSS | 4 |
| Bundler | Vite | 7 |
| Backend | Express.js + tRPC | 11.8.0 |
| Database | MySQL + Drizzle ORM | drizzle 0.44 |
| Auth | JWT (jose) + HTTP-only cookies + OAuth | jose 6.1 |
| Payments | Stripe | 20.0 |
| Email | SendGrid (`@sendgrid/mail`) | 8.1 |
| Storage | AWS S3 SDK | 3.693 |
| Escrow | Escrow.com API (custom integration) | — |
| Routing | wouter | 3.3 |
| UI components | shadcn/ui + Radix UI | — |
| Forms | react-hook-form + zod | — |
| Charts | recharts | — |

---

## Repository & Git

- **Repo:** arseny79/am
- **Active dev branch:** `claude/review-architecture-YIwQ3`
- **Always push to:** `git push -u origin claude/review-architecture-YIwQ3`
- **Never push to main without explicit permission**

---

## Project Structure

```
client/
  src/
    pages/          ~60 page components (see full list below)
    components/     Reusable UI components
    config/         homepage.ts — all homepage copy (editable without code changes)
    lib/            trpc.ts, seo.ts, utils
    _core/hooks/    useAuth, etc.

server/
  _core/
    index.ts        Express server entry, webhooks registered, scheduler started
    trpc.ts         tRPC setup + all middleware/procedures
    context.ts      TrpcContext: req, res, user
    env.ts          ENV config + validateEnv()
    sdk.ts          authenticateRequest()
    oauth.ts        OAuth routes
    routers.ts      [does NOT exist — router tree is in server/routers/]
  routers/          All tRPC routers (~50 files)
  lib/              emailService, escrowService, passwordUtils, dbHelpers, storage
  jobs/             scheduler.ts (cron jobs)
  stripe/           webhook.ts, identityWebhook.ts
  webhooks/         escrowWebhook.ts, docusignWebhook.ts
  routes/           templateDownload, uploadImage, uploadDocument (REST, not tRPC)

drizzle/
  schema.ts         Main schema (all tables)
  brokerSchema.ts   Broker-specific tables
  *.sql             Migration files

shared/
  pricing.ts        Pricing config (PRICING_TIERS, calculateSuccessFee, etc.)
  const.ts          Shared constants (UNAUTHED_ERR_MSG, NOT_ADMIN_ERR_MSG)
```

---

## Key Commands

```bash
pnpm dev              # Dev server — localhost:3000
pnpm build            # Production build
pnpm start            # Start production server
pnpm check            # TypeScript type check (tsc --noEmit)
pnpm lint             # ESLint
pnpm test             # Vitest run
pnpm db:push          # Generate + apply DB migrations (drizzle-kit generate + migrate)
pnpm db:studio        # Drizzle Studio (visual DB browser)
pnpm db:generate      # Generate migration SQL only
pnpm db:migrate       # Apply pending migrations only
pnpm db:check         # Check schema consistency
```

---

## Environment Variables

### Required at startup (will fail without these)
```bash
DATABASE_URL=mysql://...
JWT_SECRET=<strong-random>
OAUTH_SERVER_URL=https://...
```

### Required for features
```bash
# Stripe
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@acquisitions.market

# S3 Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...

# Escrow.com
ESCROW_API_EMAIL=...
ESCROW_API_PASSWORD=...
ESCROW_WEBHOOK_SECRET=...

# OAuth
VITE_OAUTH_PORTAL_URL=https://...

# Other
VITE_FRONTEND_URL=https://acquisitions.market
OWNER_OPEN_ID=<admin user's openId>
```

---

## Authorization Middleware (server/_core/trpc.ts)

Five procedure types — use the right one:

| Procedure | Requirement | Use for |
|---|---|---|
| `publicProcedure` | None | Browsing, listing detail, homepage data |
| `protectedProcedure` | Logged in | Profile, saved listings, notifications |
| `adminProcedure` | role='admin' | All admin dashboard operations |
| `emailVerifiedProcedure` | Logged in + email verified | KYC submission gate |
| `kycVerifiedProcedure` | Logged in + KYC approved | Listing create, access requests, deals |
| `verifiedProcedure` | Logged in + verificationStatus='verified' | Legacy — some offer/deal mutations |

---

## Database Schema — Key Tables

`drizzle/schema.ts` — main schema  
`drizzle/brokerSchema.ts` — broker system

### Core tables
- `users` — all user data (auth, KYC fields, verification status, email verification, Stripe Identity)
- `listings` — MSP/business listings (confidentialityLevel, tier, paymentStatus, etc.)
- `deals` — buyer-seller deal rooms
- `messages` — deal-scoped messages (require dealId)
- `documents` — deal documents with access levels
- `listingDocuments` — listing-level document vault
- `ndas` — NDA tracking (click-wrap + PDF upload)
- `ndaTemplates` / `ndaSignings` / `ndaVariableDefinitions` — new NDA template system (Phase 134)
- `accessRequests` — private listing access requests
- `buyerRequests` / `buyerRequestProposals` — buyer acquisition requests + seller proposals
- `actionItems` — deal action items
- `dealActivities` — deal activity timeline
- `milestones` — deal milestone tracking
- `offerHistory` — multi-round negotiation (buyer/seller/counter)
- `notifications` — in-app notifications
- `kycDocuments` — manual KYC uploads
- `buyerVerifications` — $199 verified buyer badge (legacy system)
- `savedListings` — user saved/bookmarked listings
- `siteSettings` — admin-configurable site settings (logo, hero content, analytics IDs, etc.)
- `pricePlans` — dynamic pricing plans (admin-configurable)
- `platformDocuments` — legal docs stored in DB (Terms, Privacy, NDA template)
- `affiliates` / `affiliateTiers` / `referrals` / `affiliateCommissions` — affiliate system
- `professionals` / `professionalReviews` / `dealProfessionals` — professional directory
- `dueDiligenceItems` / `dueDiligenceQuestions` — due diligence checklist
- `buyerQualifications` — buyer qualification badges
- `brokers` / `brokerListings` — broker system (see brokerSchema.ts)
- `adminAuditLogs` — admin action logging

---

## All Routes (App.tsx)

```
/                       Home
/preview                HomePreview (homepage redesign preview)
/signup                 Signup
/login                  Login
/signup-success         SignupSuccess
/verify-email           VerifyEmail
/resend-verification    ResendVerification
/forgot-password        ForgotPassword
/reset-password         ResetPassword
/verify-account         VerifyAccount (KYC document upload)
/how-it-works           HowItWorks
/deal/:id               DealRoom
/deals, /my-deals       MyDeals
/admin, /admin-dashboard  AdminDashboard (old)
/admin/escrow           AdminEscrow
/admin/price-plans      PricePlansManager
/admin/buyer-verification  BuyerVerification
/buyer-dashboard        BuyerDashboard
/buy-asset              BuyAsset (buyer acquisition requests)
/access-requests        AccessRequests
/marketplace, /browse   Marketplace
/listing/:id            ListingDetail
/create-listing         CreateListing
/my-listings            MyListings
/edit-listing/:id       EditListing
/preparation/:listingId Preparation (sales packet / document upload wizard)
/buyer-profile          BuyerProfile
/dashboard              Dashboard
/profile                Profile
/messages               Messages
/valuation-tool, /valuate  ValuationTool
/pricing                Pricing
/payment-success        PaymentSuccess
/payment-history        PaymentHistory
/deal-pipeline          DealPipeline
/my-proposals           MyProposals
/saved-listings         SavedListings
/legal/:slug            LegalDocument (dynamic legal docs from DB)
/affiliate              AffiliateDashboard
/professional-directory, /professionals  ProfessionalDirectory
/test-email             TestEmail
/professionals/join     ProfessionalJoin
/professionals/edit     EditProfessionalProfile
/professionals/:id      ProfessionalProfile
/faq                    FAQ
/contact                Contact
/nda/:dealId/:ndaSigningId  NDASigningPage
/nda-demo               NDADemo
/broker                 BrokerLanding
/broker/apply           BrokerApply
/broker/dashboard       BrokerDashboard
/broker/create-listing  BrokerCreateListing
/admin/brokers          AdminBrokers
/broker/faq             BrokerFAQ
/broker/how-it-works    BrokerHowItWorks
```

---

## Admin Dashboard Tabs (AdminDashboardModular.tsx)

```
Overview
  └── Analytics

Users & Verification
  ├── User Management Hub
  ├── KYC Review
  └── Affiliates

Content & SEO
  ├── SEO
  ├── Content
  └── Documents

Marketplace
  ├── Listings
  ├── Buyer Requests
  ├── Pricing
  ├── Professionals
  ├── Credentials
  └── Brokers

Settings
  ├── API Keys
  └── Email (test)
```

---

## Business Model / Pricing

Defined in `shared/pricing.ts` and DB table `pricePlans` (admin-configurable):

- **Standard (Free):** $0 upfront, 3% success fee at closing
- **Featured:** ~€99/week, same 3% success fee (homepage carousel placement)
- **Premium Featured:** ~€249/week (top carousel, thumbnail image)
- **Broker listings:** 50/50 fee split between platform and broker
- **KYC verification:** $5 via Stripe Identity OR free manual document upload
- **Affiliate program:** 25% revenue share (Level 1, configurable)

---

## Key Features Implemented

### Authentication
- Email/password signup with email verification gate
- OAuth login
- JWT + HTTP-only cookies
- Password reset flow
- KYC gate: must verify before creating listings, deals, offers

### Listings
- 3-tier confidentiality: `public` | `nda` | `private`
- Anonymous display option (hides company name/logo)
- Listing tiers: standard, featured, premium_featured
- Stripe-gated publication
- Sales packet / document upload wizard (`/preparation/:id`)
- Similar listings widget (hidden for premium tier)
- Logo upload to S3

### Deal Flow
- Deal room created when buyer initiates contact
- Kanban stages: initial_contact → nda_signed → due_diligence → offer → negotiation → escrow → closing
- Automatic stage progression (NDA sign → advance, document upload → advance)
- Deal-scoped messaging only (no standalone DMs)
- NDA signing (click-wrap + PDF upload)
- New NDA Template system with variable substitution
- Multi-round offer negotiation with history
- Offer expiration (72hr default countdown)
- Due diligence checklist (50 items, Q&A per item)
- Document vault (deal + listing level)
- Milestone tracking + overdue detection
- Professional directory invitations to deals
- Escrow.com integration (create transaction on accepted offer)

### Broker System
- Brokers can list businesses they don't own (with signed contract upload)
- 50% fee split tracking
- Approval workflow
- Separate broker dashboard + landing pages

### Admin
- Modular dashboard with tabs (see above)
- Listing moderation, user management, KYC review
- Platform documents editor (Terms, Privacy, etc.)
- Analytics, API key config, SEO meta management
- Affiliate management, professional approvals
- Sitemap generator
- Escrow transaction management

### Other
- RSS/JSON feed for listings (`/api/trpc/feed.*`)
- Valuation calculator (EBITDA-based, multi-factor)
- Professional directory with reviews, subscriptions, verified badges
- Affiliate/referral system with commission tracking
- Keyboard shortcuts (Ctrl+K, G+M, G+D, G+H, G+P, ?)
- Notification bell + dropdown
- Profile photo upload
- Breadcrumb navigation

---

## Launch Plan

Full architectural launch plan: **`AM_LAUNCH_PLAN.md`** — read this before starting any new work.

Phases:
- **A** (Days 1–3): Stability — complete Phase 133/134, fix backlog
- **B** (Days 3–5): Rebrand — acquisitions.market terminology, asset type expansion
- **C** (Days 5–10): AI Layer — Support Chat, Deal Advisor, Listing Analyzer
- **D** (Days 8–12): Hardening — AI rate limits, error resilience, admin AI toggles
- **E** (Days 12–14): Launch readiness — SEO, legal, QA

## Outstanding Work (as of April 2026)

### Phase 134 — NDA Template System (in progress, highest priority)
- [ ] `pnpm db:push` — push ndaTemplates, ndaSignings, ndaVariableDefinitions tables
- [ ] `signNDA` and `getNDASigningStatus` tRPC procedures in ndaSigningRouter.ts
- [ ] Variable configuration UI in AdminNDATemplateManager component
- [ ] NDA signing modal with clickwrap + signature capture UI
- [ ] Document vault integration for signed NDAs
- [ ] End-to-end tests

### Phase 133 — Remaining items
- [ ] Test email verification flow end-to-end
- [ ] Integrate KYC Review tab into Admin Dashboard (component exists: AdminKYCReviewDashboard)
- [ ] Add expiry date display to user profile page

### Other backlog
- [ ] Phase 122: Favicon/logo auto-sync with uploaded admin logo
- [ ] Deal page tab navigation (per DEAL_PAGE_TABS_IMPLEMENTATION.md)
- [ ] Mobile nav verification across all pages
- [ ] Footer link smoke test on all updated pages
- [ ] Phase 76 three-tier listing schema (tier/thumbnailUrl) fully wired to Stripe
- [ ] API key validation (Stripe, SendGrid, GA, StatCounter) — backend done, UI incomplete

---

## AI-Enabled Platform (CRITICAL DIFFERENTIATOR)

AM is **AI-enabled** — not just a listing marketplace. The AI layer is a core product differentiator.

### Existing LLM Infrastructure
- `server/_core/llm.ts` — `invokeLLM()` function, Gemini 2.5 Flash via Forge proxy
- Supports: tool calling, structured outputs (JSON schema), multimodal (images, PDFs)
- ENV: `BUILT_IN_FORGE_API_URL` + `BUILT_IN_FORGE_API_KEY`
- `openai` npm package already installed as dependency

### AI Features Planned

#### 1. AI Support Chat (global, all pages)
- Floating chat widget available platform-wide
- Answers platform questions, guides users through processes
- Context-aware: knows current page, user auth status, deal context
- No auth required for basic questions
- Router: `server/routers/aiSupportRouter.ts`
- Component: `client/src/components/AISupportChat.tsx`

#### 2. AI Success Manager (per-deal)
- Embedded in DealRoom — proactive AI advisor for each deal
- Full context: deal stage, messages, documents, offer history, milestone status
- Proactively suggests next steps, flags stalled deals, summarizes status for both parties
- Triggered on: stage changes, deal stalls (inactivity), new documents uploaded
- Router: `server/routers/aiDealAdvisorRouter.ts`
- Component: `client/src/components/AIDealAdvisor.tsx` (embedded in DealRoom)

#### 3. AI Listing Analyzer (seller tool)
- Analyzes listing completeness and quality
- Suggests improvements to listing copy/financials
- Estimates time-to-sale based on listing quality + market data
- Embedded in CreateListing and EditListing flows

#### 4. AI Valuation Enhancement (future)
- AI-enhanced valuation with comparable market data
- Sentiment analysis on deal momentum

---

## Branding Notes

- Legal entity: **iGacquire OÜ** (appears in footer, Terms, Privacy, Disclaimer)
- Domain in code/docs: some files still say `msp.investments` or `MSPmarket.com` — replace with `acquisitions.market` as encountered
- Homepage copy: all in `client/src/config/homepage.ts` — edit there, not in Home.tsx
- Logo: uploadable via Admin > Content tab → stored in siteSettings DB table
- Legal documents: stored in `platformDocuments` DB table, editable via admin

---

## Launch Mode (Coming Soon Gate)

**Decision:** Option A + C — server-side redirect + secret URL param bypass.  
**Controlled from:** Admin Dashboard → Settings → Launch Mode (NOT env vars)

### How it works
1. Admin toggles "Launch Mode" on/off from Admin Dashboard → Settings tab
2. When enabled: all non-admin visitors redirected to `/coming-soon`
3. Admin sets a "Preview Secret" string in the dashboard
4. Visiting `/?preview=<secret>` sets a 7-day cookie → bypasses gate for that browser
5. Admin users (role='admin') always bypass automatically
6. `/coming-soon`, `/api/*`, and static assets always pass through

### DB fields (siteSettings table)
- `launchModeEnabled` — boolean, default false
- `previewSecret` — varchar, the bypass passphrase

### Key files
- `server/_core/launchMode.ts` — Express middleware (reads from DB, checks cookie/admin role)
- `client/src/pages/ComingSoon.tsx` — Public-facing coming soon page
- Route `/coming-soon` in `App.tsx`
- Middleware registered in `server/_core/index.ts` before all other routes
- Admin UI in Admin Dashboard → Settings tab → "Launch Mode" section

### How to use (for the user — non-dev instructions)
1. Go to `https://acquisitions.market/admin`
2. Click the **Settings** tab
3. Find the **Launch Mode** section
4. Enter a **Preview Secret** (any word/phrase you want, e.g. "opensesame")
5. Toggle **Launch Mode ON**
6. Click Save
7. To access the full site yourself: visit `https://acquisitions.market/?preview=opensesame`
8. To let others in: share that URL with them — they get 7-day access
9. To go live: toggle **Launch Mode OFF** and Save

## Important Patterns & Conventions

### Adding a new tRPC route
1. Create `server/routers/myRouter.ts`
2. Register in the main router (check `server/routers/` for the index file or wherever `appRouter` is built)
3. Add to frontend with `trpc.myRouter.procedure.useQuery()`

### Double-guard pattern (protected pages)
All protected pages must check auth twice — once on the component, once on the hook:
```tsx
if (!isAuthenticated) return <redirect to login>
// AND
const { data } = trpc.something.useQuery(undefined, { enabled: isAuthenticated })
```

### DB migrations
Always run `pnpm db:push` after editing `drizzle/schema.ts` or `drizzle/brokerSchema.ts`. Never edit existing migration SQL files.

### Email notifications
Use `server/lib/emailService.ts` → `sendEmail(to, EmailTemplates.TEMPLATE_NAME, data)`. All templates defined in that file.

### File uploads
Use `server/routes/uploadDocument.ts` (REST) or `storageRouter.ts` (tRPC) → stored in S3, URL saved to DB.

### Confidentiality enforcement
Always check `listing.confidentialityLevel` before returning sensitive fields. NDA-gated listings must have `ndas` table check. Private listings must have `accessRequests` approval check.
