# SESSION-CHECKPOINT.md
Date: 2026-08-09

## Current State

Arseny approved narrowing AM into a curated private M&A marketplace for crypto-friendly iGaming businesses and assets.

Master plan:
- `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`

Active branch:
- `am-igaming-crypto-mvp`

Safe checkpoints:
- `2449f88` — pre-existing branding/favicon work plus approved MVP plan
- `6b1dc5a` — normalized Ruflo + Three Man Team harness, independently cleared by CC Reviewer

## Default Coding Lane

- Application coding: Claude Code only
- Method: Ruflo/SPARC + repository-native Three Man Team
- Hermes: Arch/Architect and independent verifier
- Claude Code Builder: Bob
- Separate Claude Code review run: Richard
- No push/deploy without Arseny's explicit deployment approval

## Current Slice

Slice 1A — launch-safe shell:
- correct brand fallback
- hide legacy pricing/valuation/affiliate/professional/broker/escrow routes and navigation
- four core journeys only
- remove Stripe/tier dependency from seller submission UI
- lean admin surface

## Baseline

- previous local `pnpm run check` passed
- previous local `pnpm run build` passed
- lint and full DB-dependent tests contain pre-existing debt; separate baseline debt from regressions

## Protected Constraints

- no native custody, escrow, token swaps or token settlement
- no fundraising or token-only marketplace
- no destructive migration or broad refactor
- preserve existing listings and private deal workflows
- do not commit generated `.claude-flow` runtime state
