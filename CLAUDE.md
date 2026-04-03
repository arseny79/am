# AM — acquisitions.market

## Project Identity

- **Product:** acquisitions.market
- **Legal entity:** iGacquire OÜ
- **Domain:** acquisitions.market
- **Codebase origin:** Fork/copy of MSPi (MSP.investments) — same tech stack, same architecture
- **Niche:** Broader than MSPi — general business acquisitions marketplace (not MSP-specific)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Vite |
| Backend | Express.js, tRPC |
| Database | MySQL + Drizzle ORM |
| Auth | Email/password + OAuth (JWT, HTTP-only cookies) |
| Payments | Stripe (listings, KYC verification) |
| Email | SendGrid |
| Storage | S3-compatible |
| Escrow | Escrow.com integration |

## Development Branch

Active branch: `claude/review-architecture-YIwQ3`

Always develop on this branch. Push with: `git push -u origin claude/review-architecture-YIwQ3`

## Architecture Overview

```
client/          React frontend (pages, components, lib)
server/          Express backend
  _core/         tRPC setup, middleware (protectedProcedure, adminProcedure, verifiedProcedure)
  routers/       All tRPC routers
  lib/           emailService, escrowService, storage, etc.
  jobs/          Background/scheduled jobs
drizzle/         Schema (schema.ts, brokerSchema.ts) + migration SQL files
shared/          Shared types and config (pricing.ts, etc.)
```

## Key Commands

```bash
pnpm dev          # Start dev server (localhost:3000)
pnpm build        # Production build
pnpm check        # TypeScript check
pnpm test         # Run Vitest tests
pnpm db:push      # Generate + apply migrations
pnpm db:studio    # Drizzle Studio
```

## Current State (as of April 2026)

- **Phase 133 complete** — Email verification, KYC admin dashboard, expiry reminders (some items untested)
- **Phase 134 in progress** — NDA Template system (backend complete, signing procedures + UI pending)
- **521/560 tests passing** (93%) — failures are test harness issues, not production bugs
- **Production-ready** per security audit (Dec 2025)

## Outstanding Work (Priority Order)

### Phase 134: NDA Template System (in progress)
- [ ] Push schema changes (`pnpm db:push`) for ndaTemplates, ndaSignings, ndaVariableDefinitions tables
- [ ] Create `signNDA` and `getNDASigningStatus` tRPC procedures
- [ ] Build variable configuration UI in admin NDA Template Manager
- [ ] Build NDA signing modal with clickwrap + signature capture
- [ ] Document vault integration for signed NDAs
- [ ] End-to-end tests

### Phase 133: Remaining items
- [ ] Test email verification flow end-to-end
- [ ] Integrate KYC Review tab into Admin Dashboard
- [ ] Add expiry date display to user profile page

### Other pending
- [ ] Phase 122: Favicon/logo sync decision
- [ ] Phase 75/76: Complete Simple KYC Gate (`/verify-account` page, admin review tab)
- [ ] Deal page tab navigation (per DEAL_PAGE_TABS_IMPLEMENTATION.md)
- [ ] Mobile nav verification across all pages

## Important Patterns

### Authorization middleware (server/_core/trpc.ts)
- `publicProcedure` — no auth required
- `protectedProcedure` — must be logged in
- `adminProcedure` — must have role='admin'
- `verifiedProcedure` — must be logged in + KYC verified

### Listing confidentiality levels
- `public` — visible to all
- `nda` — financial details hidden until NDA signed
- `private` — access request required, seller must approve

### Pricing model (pricePlans table — dynamic, admin-configurable)
- Free tier: $0 upfront, 3% success fee
- Featured: ~$99/week
- Premium Featured: ~$249/week

### Email/password auth
- Signup → email verification required → KYC gate for sensitive actions
- Stripe Identity ($5) for instant KYC OR manual document upload (free)

## Environment Variables Required

```bash
DATABASE_URL=mysql://...
JWT_SECRET=<strong-random>
OAUTH_SERVER_URL=...
VITE_OAUTH_PORTAL_URL=...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
SENDGRID_API_KEY=...
SENDGRID_FROM_EMAIL=noreply@acquisitions.market
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=...
AWS_S3_BUCKET=...
ESCROW_API_EMAIL=...
ESCROW_API_PASSWORD=...
ESCROW_WEBHOOK_SECRET=...
```

## Relationship to MSPi

AM (acquisitions.market) is a copy of MSPi (MSP.investments). Key differences:
- Different domain and branding
- Potentially broader niche (general acquisitions, not just MSPs)
- Same codebase, same legal entity (iGacquire OÜ)
- Any MSP-specific terminology should be generalized for AM
