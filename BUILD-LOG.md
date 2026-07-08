# BUILD-LOG.md

## Phase 1 — Taxonomy + Crypto Vertical + Wallet Verification
Status: LIVE on Railway
Started: 2026-07-07
Deployed: 2026-07-08

### Result
AM now has the first digital-assets M&A foundation live:
- Digital asset taxonomy/category foundation
- Crypto/Web3 asset types and subcategories
- Wallet verification foundation
- Admin controls for verticals, asset types, chains, and wallet verification
- Seller-side taxonomy selection and wallet verification UI
- “Digital Assets M&A” positioning

### Verification
- Local `pnpm run check` — passed
- Local `pnpm run build` — passed
- Local `pnpm run lint` — passed with warnings only
- Railway deployment — success
- Railway production database setup — success
- Smoke checks — homepage/create/admin routes return 200

## Phase 2 — Dynamic Listing Forms
Status: READY FOR CLAUDE CODE BUILDER
Started: 2026-07-08
Architect: Hermes
Builder: Claude Code with Ruflo/SPARC, Builder role where available
Reviewer: Hermes

### Goal
Move AM toward configurable marketplace forms so each asset type can have its own seller fields without rebuilding the platform each time.

### Current CC Task
Implement the Phase 2 foundation only:
- admin-defined field definitions
- listing field values
- basic admin UI to manage fields
- seller create/edit support for dynamic fields
- keep all existing flows working

### Rules
- Do not break existing MSP listings or current seller/deal flow
- Keep Phase 2 additive and reversible
- Do not deploy or run production migrations from Claude Code
- Run `pnpm run check` and `pnpm run build` before reporting done
