# ARCHITECT.md — MSP M&A Marketplace

This is the Architect's reference document. It captures system design, technical decisions, architectural boundaries, and current project state.

---

## System Purpose

A specialized B2B marketplace for buying and selling Managed Service Provider (MSP) businesses. The platform handles the full M&A lifecycle: discovery → NDA → diligence → negotiation → closing, with supporting infrastructure for brokers, professional services, KYC/verification, and commission management.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│                  React SPA (Vite)                │
│   Wouter routing · TanStack Query · Radix UI     │
└────────────────────┬────────────────────────────┘
                     │ tRPC (HTTPS / JSON)
┌────────────────────▼────────────────────────────┐
│              Express.js Server                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ tRPC API │  │ REST     │  │ Background    │  │
│  │ (53+     │  │ Webhooks │  │ Job Scheduler │  │
│  │ routers) │  │ (Stripe, │  │               │  │
│  │          │  │ DocuSign,│  │               │  │
│  │          │  │ Escrow)  │  │               │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│            MySQL 8  (Drizzle ORM)                │
│         49 tables  ·  6 broker tables            │
│         70+ versioned migrations                 │
└─────────────────────────────────────────────────┘

External Integrations:
  OAuth Server · AWS S3 · Stripe · SendGrid · OpenAI · Google Maps · DocuSign
```

---

## Core Domain Concepts

### Actors
- **Seller** — MSP owner listing a business for sale
- **Buyer** — Individual or firm seeking an acquisition
- **Broker** — Intermediary representing sellers; earns commission
- **Professional** — Service provider (lawyer, accountant, advisor) active in deal rooms
- **Admin** — Platform operator with moderation and override powers

### Verification Tiers
Users move through a progressive trust ladder enforced by tRPC middleware:

```
Anonymous → Registered → Email Verified → KYC Approved → Fully Verified
```

Each tier unlocks additional platform capabilities (e.g., messaging requires email verification; creating a listing requires KYC).

### Listing Confidentiality Tiers
```
Public (teaser data) → NDA Required (financials) → Private (invite-only)
```

### Deal Stages
Defined by templates in `shared/dealStageTemplates.ts`. Stages progress linearly with milestone tracking, action items, and a full activity audit trail.

---

## Key Architectural Decisions

### tRPC over REST
All client-server communication uses tRPC for end-to-end TypeScript type safety. The `appRouter` in `server/routers.ts` aggregates 53+ sub-routers. This eliminates API contract drift and reduces boilerplate. REST is used only for inbound webhooks (Stripe, DocuSign, escrow).

### Drizzle ORM with MySQL
Chosen for type-safe SQL with explicit migrations. Schema lives in `drizzle/schema.ts` (49 tables) and `drizzle/brokerSchema.ts` (6 tables). All migrations are versioned SQL files in `drizzle/`. The `server/db.ts` layer centralizes all database access — routers call `db.*` functions, not raw Drizzle queries.

### Separation of `shared/`
Isomorphic code (types, constants, valuation logic, pricing) lives in `shared/` and is importable from both client and server via the `@shared/*` alias. This prevents duplication and keeps business logic testable in isolation.

### OAuth Delegation
Authentication is delegated to an external OAuth server (`OAUTH_SERVER_URL`). The platform issues its own JWT session cookies after OAuth callback. This decouples identity management from the marketplace and enables SSO across Manus services.

### Radix UI + Tailwind CSS 4
All UI is built on Radix UI primitives (accessibility handled) styled with Tailwind. No component library lock-in — we own the styling. Tailwind 4 uses the new Vite plugin approach (no `tailwind.config.js`).

---

## Critical Files

| File | Role |
|------|------|
| `server/_core/index.ts` | Express app entry point |
| `server/_core/trpc.ts` | tRPC router + all middleware procedures |
| `server/_core/context.ts` | tRPC context (auth, db, req/res) |
| `server/_core/env.ts` | Validated environment variables |
| `server/routers.ts` | Aggregated `appRouter` |
| `server/db.ts` | All database query functions |
| `drizzle/schema.ts` | Canonical DB schema (49 tables) |
| `drizzle/brokerSchema.ts` | Broker DB schema (6 tables) |
| `shared/types.ts` | Shared TypeScript types |
| `shared/const.ts` | Shared constants |
| `client/src/App.tsx` | Client-side route definitions |

---

## Integration Map

| Integration | Purpose | Config |
|-------------|---------|--------|
| Stripe Checkout | Listing upgrades, professional subscriptions | `STRIPE_SECRET_KEY` |
| Stripe Identity | Buyer KYC verification | `STRIPE_SECRET_KEY` |
| Stripe Connect | Broker/affiliate payouts | `STRIPE_SECRET_KEY` |
| Stripe Webhooks | Async payment events | `STRIPE_WEBHOOK_SECRET` |
| SendGrid | Transactional email | `SENDGRID_API_KEY` |
| AWS S3 | Document & media storage | S3-compatible credentials |
| OpenAI | LLM features (content, chat) | `OPENAI_API_KEY` |
| DocuSign | E-signature on NDAs | Webhook-based |
| Escrow.com | Escrow fund management | Webhook-based |
| Google Maps | Location services | Via `server/_core/map.ts` |
| OAuth Server | Authentication | `OAUTH_SERVER_URL` |

---

## Security Model

- **Transport:** HTTPS enforced; secure + httpOnly session cookies
- **Headers:** Helmet.js (CSP, HSTS, X-Frame-Options, referrer policy)
- **Input:** All tRPC inputs validated with Zod 4 schemas; user HTML sanitized via `sanitize-html`
- **Rate Limiting:** `express-rate-limit` globally; messaging endpoints capped at 20 req / 5 min per user
- **Authorization:** Middleware chain on every procedure (public → admin); no client-side enforcement
- **Audit Trails:** `auditLogs` and `adminAuditLogs` tables record sensitive actions
- **Secrets:** All secrets via environment variables; validated at startup in `server/_core/env.ts`

---

## Database Conventions

- UUIDs (`nanoid`) as primary keys
- `createdAt` / `updatedAt` timestamps on all tables
- Soft deletes where data retention matters (listings, deals)
- Foreign keys enforced at DB level via Drizzle relations
- Migrations are append-only; never modify existing migration files
- Run `pnpm db:generate` after schema changes; review generated SQL before applying

---

## Feature Inventory (Current)

| Domain | Status |
|--------|--------|
| Listings & Marketplace | Complete |
| Deal Room (messages, docs, timeline, action items) | Complete |
| Buyer Requests + Proposals | Complete |
| NDA (click-wrap + PDF upload) | Complete |
| KYC / Stripe Identity | Complete |
| Email Verification | Complete |
| Professional Services Directory | Complete |
| Broker Program | Complete |
| Affiliate / Referral System | Complete |
| Stripe Payments (checkout, upgrades, subscriptions) | Complete |
| Admin Dashboard (moderation, KYC review, audit) | Complete |
| Valuation Calculator | Complete |
| SEO (meta tags, sitemap) | Complete |
| Escrow Integration | Research/Partial |
| DocuSign E-signatures | Webhook handler ready |
| Voice Transcription | Infrastructure ready |
| Feed Automation / RSS | Complete |

---

## Known Issues & Backlog

See `BUGS_FOUND.md`, `PRODUCTION_READINESS.md`, `PRODUCTION_READINESS_AUDIT.md`, and `todo.md` for tracked issues and remaining work before production launch.

---

## Development Branch

Active development branch: `claude/review-new-setup-AElNh`

All changes must be committed and pushed to this branch. Do not push to `main` without explicit sign-off.
