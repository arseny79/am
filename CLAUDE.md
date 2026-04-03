# CLAUDE.md — MSP M&A Marketplace

This file provides development guidance for Claude Code and contributors.

## Project Summary

A B2B marketplace platform for buying and selling Managed Service Provider (MSP) businesses. Facilitates end-to-end M&A transactions including listings, deal workflows, KYC/verification, NDA management, escrow, broker programs, and professional services.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5.9, Tailwind CSS 4, Vite 7 |
| Backend | Express.js + tRPC 11, Node.js 22+ |
| Database | MySQL 8+ via Drizzle ORM 0.44 |
| Auth | Custom OAuth + JWT session cookies |
| Storage | AWS S3 |
| Payments | Stripe (checkout, identity, connect) |
| Email | SendGrid |
| AI | OpenAI API |
| Package Manager | pnpm 10.4+ |

## Directory Structure

```
am/
├── client/src/          # React frontend
│   ├── pages/           # 60+ route page components
│   ├── components/      # 100+ reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # React context providers
│   ├── lib/             # Client utilities
│   └── config/          # Client configuration
├── server/              # Express backend
│   ├── _core/           # App bootstrap, tRPC setup, env validation
│   ├── routers/         # 53+ tRPC router files
│   ├── routers.ts       # Aggregated appRouter
│   ├── db.ts            # Database query layer
│   ├── jobs/            # Background job schedulers
│   ├── stripe/          # Stripe integration
│   ├── routes/          # Express REST routes (webhooks, etc.)
│   └── webhooks/        # Stripe, DocuSign, escrow webhook handlers
├── drizzle/             # DB schema + 70+ migration SQL files
│   ├── schema.ts        # 49-table main schema
│   └── brokerSchema.ts  # 6-table broker schema
└── shared/              # Isomorphic code (types, constants, utils)
    ├── types.ts
    ├── const.ts
    ├── valuationCalculator.ts
    └── pricing.ts
```

## Key Commands

```bash
# Development
pnpm dev                 # Start dev server (localhost:3000)
pnpm test                # Run Vitest suite
pnpm check               # TypeScript type check
pnpm lint                # ESLint
pnpm lint:strict         # ESLint (zero warnings)
pnpm format              # Prettier

# Database
pnpm db:migrate          # Apply pending migrations
pnpm db:generate         # Generate migration from schema changes
pnpm db:push             # Generate + apply in one step
pnpm db:studio           # Drizzle Studio GUI
pnpm db:check            # Validate schema consistency

# Production
pnpm build               # Build frontend (Vite) + backend (esbuild)
pnpm start               # Run production server
```

## Required Environment Variables

```bash
DATABASE_URL             # MySQL connection string
JWT_SECRET               # Session cookie signing secret
OAUTH_SERVER_URL         # OAuth server URL
NODE_ENV                 # development | production
VITE_FRONTEND_URL        # Frontend URL (default: http://localhost:3000)
VITE_APP_ID              # Application identifier
VITE_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
SENDGRID_API_KEY
OPENAI_API_KEY
OWNER_OPEN_ID            # Platform owner's OAuth ID
BUILT_IN_FORGE_API_URL
BUILT_IN_FORGE_API_KEY
```

## Path Aliases

```
@/*        → client/src/*
@shared/*  → shared/*
```

## Architecture Patterns

### tRPC Middleware Chain

All API endpoints are tRPC procedures. Use the appropriate procedure type:

| Procedure | Requirement |
|-----------|-------------|
| `publicProcedure` | No auth required |
| `protectedProcedure` | Logged in |
| `emailVerifiedProcedure` | Email verified |
| `kycVerifiedProcedure` | KYC approved |
| `verifiedProcedure` | Fully verified |
| `adminProcedure` | Admin role |

### Adding a New Feature

1. **Schema:** Add tables/columns to `drizzle/schema.ts`, run `pnpm db:generate && pnpm db:migrate`
2. **Server:** Create `server/routers/myFeatureRouter.ts` with tRPC procedures
3. **Register:** Add router to `server/routers.ts` in `appRouter`
4. **Client:** Add page to `client/src/pages/`, register route in `client/src/App.tsx`
5. **Types:** Add shared types to `shared/types.ts` if needed

### Data Mutations (client)

Use tRPC client hooks via TanStack Query:
```typescript
const utils = trpc.useUtils();
const mutation = trpc.myFeature.create.useMutation({
  onSuccess: () => utils.myFeature.getMy.invalidate(),
});
```

### File Uploads

Files go to S3. Use existing patterns from `server/routers/listingDocumentRouter.ts`.

### Email Notifications

Use `server/_core/notification.ts`. SendGrid templates handle formatting.

### Security Rules

- Never skip input validation — all procedures use Zod schemas
- Use `sanitize-html` for any user-generated HTML content
- Rate limiting is enforced on messaging endpoints (20 req / 5 min per user)
- Admin procedures require role check via `adminProcedure`

## Testing

Tests live in `server/**/*.test.ts`. Run with `pnpm test`. Vitest is configured in `vitest.config.ts`. Keep new logic covered — the existing suite covers auth, deals, KYC, NDA, affiliates, buyer requests, and admin functions.

## Code Style

- TypeScript strict mode — no implicit `any`
- Prettier for formatting (run `pnpm format` before committing)
- ESLint enforced — aim for `pnpm lint:strict` clean
- Prefer editing existing files over creating new ones
- No speculative abstractions — implement what's needed, nothing more
