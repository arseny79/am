# AM — acquisitions.market — Architect Memory File

## Project Identity

- **Product name:** acquisitions.market
- **Domain:** acquisitions.market
- **Legal entity:** iGacquire OÜ
- **Origin:** Fork/copy of MSPi (MSP.investments) — same codebase, same tech stack
- **Niche:** Broader than MSPi — general business acquisitions (not MSP-specific only)
- **Status:** Production-ready, actively in development

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

## Branding Notes

- Legal entity: **iGacquire OÜ** (appears in footer, Terms, Privacy, Disclaimer)
- Domain in code/docs: some files still say `msp.investments` or `MSPmarket.com` — replace with `acquisitions.market` as encountered
- Homepage copy: all in `client/src/config/homepage.ts` — edit there, not in Home.tsx
- Logo: uploadable via Admin > Content tab → stored in siteSettings DB table
- Legal documents: stored in `platformDocuments` DB table, editable via admin

---

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
