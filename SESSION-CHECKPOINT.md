# SESSION-CHECKPOINT.md
Date: 2026-08-09

## Current State

Arseny approved narrowing AM into a curated private M&A marketplace for crypto-friendly iGaming businesses and assets.

The full implementation plan is:
- `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`

Active branch:
- `am-igaming-crypto-mvp`

Safe rollback point:
- `2449f88` — checkpoint of pre-existing branding/favicon work plus approved MVP plan

## Default Coding Lane

- Application coding: Claude Code only
- Method: Ruflo/SPARC + repository-native Three Man Team
- Hermes: Arch/Architect and independent verifier
- Claude Code Builder run: Bob
- Separate Claude Code review run: Richard
- No push/deploy without Arseny's explicit deployment approval

## Current Slice

Slice 0B — normalize `CLAUDE.md`, `ARCHITECT.md`, `BUILDER.md` and `REVIEWER.md` before application work.

## Known Baseline

- Claude Code authenticated through Claude Pro
- `ruflo-core@ruflo` enabled
- Three Man Team role files present but still contain template placeholders and inconsistent BOB/RICHARD filename references
- previous local typecheck/build passed
- lint and full DB-dependent test suite have pre-existing debt that must be separated from new regressions

## Protected Constraints

- no native custody, escrow, token swaps or token settlement
- no fundraising or token-only marketplace
- no broad refactor or destructive migration
- preserve existing listings and private workflows
- do not commit generated `.claude-flow` runtime state
