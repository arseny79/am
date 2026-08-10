# SESSION-CHECKPOINT.md
Date: 2026-08-09

## Current State

Arseny approved narrowing AM into a curated private M&A marketplace for crypto-friendly iGaming businesses and assets.

Master plan:
- `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`

Active branch:
- `am-igaming-crypto-mvp`

Verified checkpoints:
- `2449f88` — preserved pre-existing branding/favicon work plus approved MVP plan
- `6b1dc5a` — normalized Ruflo + Three Man Team harness, independently cleared by CC Reviewer
- `8341a6f` — launch-safe shell, core navigation, legacy route deactivation, seller tier/Stripe UI removal and lean admin; CC Reviewer passed, fresh check/build passed

## Default Coding Lane

- Application coding: Claude Code only
- Method: Ruflo/SPARC + repository-native Three Man Team
- Hermes: Arch/Architect and independent verifier
- Claude Code Builder: Bob
- Separate Claude Code review run: Richard
- No push/deploy without Arseny's explicit deployment approval

## Current Slice

Slice 1B1:
- iGaming-specific homepage and metadata
- remove premium paid-placement hero
- hide payment return/history, NDA demo and test-email frontend routes

## Baseline

At checkpoint `8341a6f`:
- `pnpm run check` passed
- `pnpm run build` passed with only existing large-chunk warning
- route/nav static assertions passed
- live production remains the old MSP site at `https://msp.investments`; no feature-branch code has been pushed or deployed

## Protected Constraints

- no native custody, escrow, token swaps or token settlement
- no fundraising or token-only marketplace
- no destructive migration or broad refactor
- preserve existing listings and private deal workflows
- do not commit generated `.claude-flow` runtime state
