# Acquisitions.market (AM) — Claude Code Context

## What is this project?

**Acquisitions.market** is an iGaming M&A marketplace — the domain is `acquisitions.market`.
It is a **fork of MSPi** (the MSP M&A marketplace codebase in this repo), adapted for buying and selling iGaming businesses and assets.

The fork lives at **https://github.com/arseny79/AM** (private repo).
The MSPi source lives at **https://github.com/arseny79/msp-marketplace**.

Development on the initial fork was done on branch: `claude/create-am-igaming-fork-GrOLt`

---

## Tech Stack

Full-stack TypeScript monorepo:
- **Frontend**: React 19, Tailwind CSS 4, Vite 7, tRPC client, TanStack Query
- **Backend**: Express.js, tRPC 11
- **Database**: MySQL 8+ with Drizzle ORM
- **Auth**: Email/password + JWT (no OAuth dependency)
- **Payments**: Stripe (fiat) + crypto (architecture in place, provider TBD)
- **Email**: SendGrid
- **Storage**: AWS S3
- **AI**: OpenAI-compatible API (currently wired for OpenAI, will switch to Claude/Anthropic)

Key commands:
```bash
pnpm dev              # dev server
pnpm build            # production build
pnpm db:push          # run DB migrations
pnpm seed:categories  # seed iGaming categories (run once on new DB)
```

---

## What was built in the initial fork session

### ✅ Done

1. **Branding**
   - `APP_TITLE = "Acquisitions.market"`, domain `acquisitions.market`
   - `AMLogo` component: SVG circle with "AM" text (`client/src/components/AMLogo.tsx`)
   - Logo asset at `client/public/logo.svg`
   - Updated `PublicHeader`, `Footer`, SEO metadata, structured data, email sender

2. **Homepage** (`client/src/config/homepage.ts`)
   - iGaming hero copy, trust signals, 6 feature cards (including AI agents card)

3. **iGaming Categories system** — admin-editable tree
   - DB table: `listingCategories` (id, name, slug, type, businessType, parentId, displayOrder)
   - Two root trees: **Businesses** (B2C + B2B subtrees) and **Assets**
   - Seed data: `shared/igamingCategories.ts`
   - Seed script: `scripts/seedIgamingCategories.ts` (`pnpm seed:categories`)
   - API router: `server/routers/categoriesRouter.ts`

4. **Admin role system** (multi-tier)
   - `users.role` enum expanded: `user | admin | superadmin | sales | support | suspended`
   - `adminRolePermissions` table: fine-grained per-staff permission flags
   - Default permission sets per role (see `server/routers/adminRolesRouter.ts`)
   - tRPC: `adminProcedure` (any staff), `seniorAdminProcedure` (admin+superadmin), `superAdminProcedure`
   - Router: `server/routers/adminRolesRouter.ts`

5. **AI Agents framework**
   - Tables: `aiAgents`, `aiAgentSubscriptions`, `aiAgentDealUsages`, `aiAgentConversations`
   - Pricing models: `subscription` (monthly) | `per_deal` | `both`
   - Agent types: `legal_advisor | success_manager | due_diligence | valuation | compliance | custom`
   - Chat endpoint in `server/routers/aiAgentsRouter.ts` — OpenAI-compatible, uses agent's `systemPrompt` and `modelId`
   - **TODO**: Switch AI provider from OpenAI to Anthropic Claude (see AI section below)

6. **Crypto payments**
   - Table: `cryptoPayments` with full status lifecycle
   - Providers: `coinbase_commerce | btcpay | manual`
   - Admin management router: `server/routers/cryptoPaymentsRouter.ts`
   - **TODO**: Integrate actual Coinbase Commerce or BTCPay SDK (currently creates pending record only)

7. **Listings schema updated**
   - `listingType: 'business' | 'asset'` added
   - `listingCategoryId` foreign key to `listingCategories`
   - MSP-specific enum fields (`primaryServiceCategory`, `industryVertical`) replaced with free-text for migration compatibility

---

## What still needs to be built (priority order)

### 🔴 High priority

- [ ] **Admin: Categories Manager UI** — page in admin panel to add/edit/reorder categories tree. Route: `/admin` → Categories tab. Use `trpc.categories.*` procedures.

- [ ] **Admin: Staff Roles Manager UI** — page to list staff, promote users to roles, edit fine-grained permissions. Use `trpc.adminRoles.*`.

- [ ] **Admin: AI Agents Manager UI** — CRUD for AI agent definitions (name, pricing, system prompt, model). Use `trpc.aiAgents.admin*`.

- [ ] **Admin: Crypto Payments Dashboard** — list all crypto payments, filter by status/provider, manually confirm/update. Use `trpc.cryptoPayments.admin*`.

- [ ] **Create/Edit Listing form** — replace MSP-specific fields with iGaming fields:
  - `listingType` selector (Business or Asset)
  - Dynamic category picker (B2B/B2C subtree based on type)
  - iGaming-specific financial fields: GGR, NGR, MAU (Monthly Active Users), jurisdiction(s)
  - Remove: `primaryRMM`, `primaryPSA`, `serviceMix` (MSP tools)

- [ ] **Marketplace browse page** — update filters to use `listingCategories` instead of MSP enums

- [ ] **AI Agents page** (`/ai-advisors`) — public page listing available AI agents with pricing, subscribe/purchase buttons

### 🟡 Medium priority

- [ ] **AI provider switch**: Change `aiAgentsRouter.ts` from OpenAI SDK to Anthropic Claude SDK. Replace `openai` import with `@anthropic-ai/sdk`. Use model `claude-sonnet-4-6` by default.

- [ ] **Crypto payment provider integration**: Implement Coinbase Commerce or BTCPay in `cryptoPaymentsRouter.ts` `initiate` mutation. User confirmed: **Stripe for fiat (already done), crypto TBD**.

- [ ] **Valuation tool** — iGaming-specific inputs. Current MSP calculator is left as-is for now. Needs new inputs: GGR, NGR, EBITDA, business type, jurisdiction, license type.

- [ ] **HowItWorks page** — rewrite for iGaming M&A context

- [ ] **FAQ page** — rewrite for iGaming audience

- [ ] **Buyer Requests** — update form fields to match iGaming (remove MSP tool preferences)

- [ ] **Listing Detail page** — update display to show iGaming fields (jurisdiction, license, GGR/NGR)

### 🟢 Nice to have / later

- [ ] **AI Success Manager** as an active deal participant — gets added to deal room, proactively nudges parties, sends milestone reminders
- [ ] **AI Legal Advisor** — can draft NDA summaries, flag red flags in due diligence docs
- [ ] **Jurisdiction / license filter** on marketplace
- [ ] **iGaming-specific due diligence checklist templates** (replace generic ones)
- [ ] **RSS feed** — update from MSP to iGaming terminology
- [ ] **Email templates** — full iGaming rebrand of all transactional emails

---

## iGaming Terminology Reference

| MSPi term | AM equivalent |
|---|---|
| MSP / Managed Service Provider | iGaming business / operator |
| Service category | Business type / Asset type |
| Monthly Recurring Revenue (MRR) | GGR / NGR / Monthly Revenue |
| Client count | Monthly Active Users (MAU) |
| Client retention rate | Player retention rate |
| Primary RMM / PSA | Gaming platform / Software stack |
| Service mix | Product mix (casino / sports / poker etc.) |
| Industry vertical | Jurisdiction / License type |

---

## Categories Tree (initial seed)

```
Businesses
├── B2C Businesses
│   ├── Online Casino
│   ├── Sportsbook
│   ├── Poker Room
│   ├── Bingo & Lottery
│   ├── Crypto Casino
│   ├── Fantasy Sports
│   └── Esports Betting
└── B2B Businesses
    ├── iGaming Platform / Software
    ├── White Label Provider
    ├── Affiliate Network
    ├── Payment Provider
    ├── Game Studio / Content Provider
    ├── iGaming Marketing Agency
    └── Compliance & Consulting

Assets
├── Gaming License
├── Domain & Brand
├── Player Database
├── Software / Platform
├── Game Portfolio
├── White Label Solution
├── Payment Integration
├── Affiliate Program
└── SEO & Content Assets
```

Admins can add/edit/reorder via the admin panel (UI still to be built).

---

## Admin Role Permissions Matrix

| Permission | superadmin | admin | sales | support |
|---|:---:|:---:|:---:|:---:|
| Approve KYC | ✅ | ✅ | ❌ | ❌ |
| Publish listings | ✅ | ✅ | ❌ | ❌ |
| Manage users | ✅ | ✅ | ❌ | ❌ |
| Manage payments (fiat) | ✅ | ❌ | ❌ | ❌ |
| Manage crypto payments | ✅ | ❌ | ❌ | ❌ |
| Manage AI agents | ✅ | ❌ | ❌ | ❌ |
| Manage categories | ✅ | ✅ | ❌ | ❌ |
| View analytics | ✅ | ✅ | ✅ | ❌ |
| View deal pipeline | ✅ | ✅ | ✅ | ✅ |
| Contact users | ✅ | ✅ | ✅ | ✅ |
| Manage admins/staff | ✅ | ❌ | ❌ | ❌ |

---

## AI Agents

### Planned agents (to be created via admin panel)
1. **Legal Advisor** — advises on legal aspects of the deal, reviews NDA, flags risks
2. **Deal Success Manager** — independent party, keeps deal moving, sends nudges
3. **Due Diligence Assistant** — helps buyer structure and track DD checklist
4. **Valuation Advisor** — provides iGaming-specific valuation guidance

### Pricing model
- Monthly subscription (access to agent across all deals)
- Per-deal purchase (one-time access for a specific deal)
- Superadmin can configure both price points per agent

### AI provider
- Currently wired for OpenAI-compatible API
- **TODO**: Switch to Anthropic Claude (`claude-sonnet-4-6` default)
- System prompt and capabilities are stored per-agent in DB

---

## Payments

### Fiat (Stripe) — already set up from MSPi
- Listing fees, subscription tiers, AI agent subscriptions, success fees
- `STRIPE_SECRET_KEY` env var required

### Crypto — architecture in place, integration pending
- Table: `cryptoPayments` with provider enum `coinbase_commerce | btcpay | manual`
- Admin can manually confirm payments (for manual/OTC)
- **TODO**: Integrate Coinbase Commerce API or BTCPay Server
- Admin dashboard: full payment list with filter/status management

---

## Key files changed from MSPi

| File | What changed |
|---|---|
| `package.json` | name → `acquisitions-market`, added `seed:categories` script |
| `drizzle/schema.ts` | New tables (categories, AI agents, crypto, admin permissions), expanded role enum, updated listings fields |
| `shared/igamingCategories.ts` | **New** — iGaming category seed data |
| `shared/mspCategories.ts` | Kept for reference, not used in AM |
| `client/src/const.ts` | APP_TITLE, APP_DOMAIN, APP_LOGO updated |
| `client/src/config/homepage.ts` | Full iGaming rewrite |
| `client/src/lib/seo.ts` | All MSP → AM domain/copy |
| `client/src/components/AMLogo.tsx` | **New** — SVG logo component |
| `client/public/logo.svg` | **New** — static logo asset |
| `client/src/components/PublicHeader.tsx` | Uses AMLogo, supports all admin roles |
| `client/src/components/Footer.tsx` | iGaming tagline + disclaimer |
| `server/_core/trpc.ts` | New procedures: `superAdminProcedure`, `seniorAdminProcedure`; `adminProcedure` expanded |
| `server/routers.ts` | Wired in 4 new routers |
| `server/emailNotifications.ts` | Domain/branding updated |
| `server/routers/categoriesRouter.ts` | **New** |
| `server/routers/aiAgentsRouter.ts` | **New** |
| `server/routers/cryptoPaymentsRouter.ts` | **New** |
| `server/routers/adminRolesRouter.ts` | **New** |
| `scripts/seedIgamingCategories.ts` | **New** |

---

## Environment Variables needed (same as MSPi + additions)

```env
# Existing (from MSPi)
DATABASE_URL=
JWT_SECRET=
STRIPE_SECRET_KEY=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@acquisitions.market
SENDGRID_FROM_NAME=Acquisitions.market
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
VITE_APP_URL=https://acquisitions.market
VITE_FRONTEND_URL=https://acquisitions.market
VITE_APP_TITLE=Acquisitions.market
VITE_APP_DOMAIN=acquisitions.market

# New for AM
ANTHROPIC_API_KEY=        # for AI agents (switch from OpenAI)
# OPENAI_API_KEY=         # or keep OpenAI temporarily
COINBASE_COMMERCE_API_KEY= # for crypto payments (when integrated)
```

---

## Deployment

- Platform: to be set up on Railway (same as MSPi)
- Domain: `acquisitions.market`
- On first deploy run: `pnpm db:push && pnpm seed:categories`

---

## Repo info

- **AM repo**: https://github.com/arseny79/AM (private)
- **MSPi source**: https://github.com/arseny79/msp-marketplace
- **Initial fork branch**: `claude/create-am-igaming-fork-GrOLt`
