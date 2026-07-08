# SESSION-CHECKPOINT.md
Date: 2026-07-08

## Current State

Phase 1 is live on Railway.

AM now has:
- digital-assets / crypto taxonomy foundation
- wallet verification foundation
- admin taxonomy/chains/wallet controls
- seller taxonomy selection
- digital-assets M&A positioning

Production deploy and database setup succeeded.

## Latest Verification

- Railway service: online
- Latest deployment: successful
- Production database Phase 1 setup: complete
- Public route smoke checks: homepage/create/admin returned 200
- Local `pnpm run check`: passed
- Local `pnpm run build`: passed

## Active Development Focus

Phase 2 — Dynamic Listing Forms.

Business objective: let AM support different digital asset types with admin-configured seller fields, instead of rebuilding the listing form for every new vertical.

## Next Builder Task

Claude Code should implement the Phase 2 foundation:
1. Add field definitions and listing field values.
2. Add admin field-management UI.
3. Add seller create/edit support for dynamic fields.
4. Preserve all old MSP/hardcoded listing fields.
5. Run `pnpm run check` and `pnpm run build`.

## Constraints

- Do not break existing listings.
- Do not touch Stripe, KYC, NDA, escrow, or auth.
- Do not deploy or run production migrations from Claude Code.
- Hermes reviews before commit/deploy.
