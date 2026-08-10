# SESSION-CHECKPOINT.md
Date: 2026-08-09

## Current State

Arseny approved narrowing AM into a curated private M&A marketplace for crypto-friendly iGaming businesses and assets.

Master plan:
- `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`

Active branch:
- `am-igaming-crypto-mvp`

## Verified checkpoints:
- `2449f88` — preserved pre-existing branding/favicon work plus approved MVP plan
- `6b1dc5a` — normalized Ruflo + Three Man Team harness, independently cleared by CC Reviewer
- `8341a6f` — launch-safe shell, core navigation, legacy route deactivation, seller tier/Stripe UI removal and lean admin; CC Reviewer passed, fresh check/build passed
- `9528ab3` — homepage, metadata and public route lockdown repositioned to private iGaming M&A; CC Reviewer passed, fresh check/build passed
- `e8d35f3` — remaining public MSP copy removed from How It Works and FAQ; CC Reviewer passed, fresh check/build passed

## Default Coding Lane

- Application coding: Claude Code only
- Method: Ruflo/SPARC + repository-native Three Man Team
- Hermes: Arch/Architect and independent verifier
- Claude Code Builder: Bob
- Separate Claude Code review run: Richard
- No push/deploy without Arseny's explicit deployment approval
- Operating mode: after each independently verified approved slice, Arch should proactively prep and start the next slice unless a real user decision is required

## Current Slice

Slice 2A:
- seed one launch taxonomy vertical for crypto-friendly iGaming
- seed exactly three launch asset types plus useful subcategories
- hide broad legacy taxonomy rows from public selectors without deleting them
- keep old taxonomy rows readable by id for legacy listings

## Baseline

At checkpoint `e8d35f3`:
- Slice 1B2 is committed and independently cleared
- `pnpm run check` passed
- `pnpm run build` passed with only existing large-chunk warning
- live production remains the old MSP site at `https://msp.investments`; no feature-branch code has been pushed or deployed

## Protected Constraints

- no native custody, escrow, token swaps or token settlement
- no fundraising or token-only marketplace
- no destructive migration or broad refactor
- preserve existing listings and private deal workflows
- do not commit generated `.claude-flow` runtime state
