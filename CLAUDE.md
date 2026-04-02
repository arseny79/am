# AM — Acquisitions.Market

Multi-vertical M&A marketplace. Started as MSP-only, expanding to iGaming, crypto/web3, land-based gaming, esports, and prediction markets.

## Active branch
`claude/add-gaming-assets-fySko`

## Where we are
Phase 173 (asset tags + filters) is complete. Next: **Phase 174 — Strategic Asset Listings**.

Full roadmap is in `todo.md` (Phases 173–182).
Full crypto/web3 feature specs are in `CRYPTO_WEB3_FEATURE_SPEC.md`.

## Stack
React 19 + TypeScript, Express + tRPC, MySQL + Drizzle ORM, Stripe, SendGrid, AWS S3, DocuSign, Escrow.com

## Key things to know
- Coming-soon gate is live: set `COMING_SOON_KEY` env var on Railway to activate it; bypass via `/?preview=<key>`
- New asset taxonomy is in `shared/mspCategories.ts` — add land-based categories there when research is done (no migration needed, just key/label)
- DB migrations live in `drizzle/` — last one is `0072_asset_categories.sql`
- Run `pnpm dev` to start, `pnpm tsc --noEmit` to type-check
