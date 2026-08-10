# ARCHITECT-BRIEF — Slice 5A: iGaming-Native Browse and Empty State

Date: 2026-08-10
Architect Approval: YES
Branch: `am-igaming-crypto-mvp`
Master plan: `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`
Baseline checkpoint: `c113847`

## Role and method

You are Bob, Builder in AM's Three Man Team.

- Ruflo-core is enabled. Apply Ruflo/SPARC discipline.
- Read `BUILDER.md`, this brief and `SESSION-CHECKPOINT.md` first.
- Add a concise Builder Plan to this brief, then build immediately because Architect Approval is YES.
- Build only this slice.

## Goal

Make the public browse experience fit the approved iGaming M&A MVP:
- use launch taxonomy and launch-safe filters
- remove MSP-era service-mix / industry filter language from public browsing
- keep teaser-safe listing presentation
- improve the zero-inventory / low-inventory state so it explains the private deal flow and points to the two approved CTAs

## Allowed application files

1. `client/src/pages/Marketplace.tsx`
2. listing-card components used by Marketplace / Home / Saved Listings if needed
3. listing search procedures only where required to support safe launch filters
4. one targeted test if useful

Plus handoff docs only:
- `ARCHITECT-BRIEF.md`
- `BUILD-LOG.md`
- `REVIEW-REQUEST.md`

## Requirements

### 1. Public browse filters

- use active asset types from the launch taxonomy
- use transaction structure, jurisdiction/license profile and broad financial ranges where already supportable
- remove MSP service-mix and generic industry vertical filters from the public UI
- do not expose exact confidential numbers in filters or cards

### 2. Listing cards and browse copy

- cards should show teaser-safe metrics appropriate to asset type
- do not expose seller identity or confidential diligence values
- make the surrounding copy consistent with curated private iGaming deal flow

### 3. Empty / low-inventory state

- if inventory is empty or effectively empty, explain that AM runs a private / curated / off-market process
- include the two approved CTAs:
  - seller-side CTA
  - buyer-mandate CTA
- keep the UI simple and practical

## Protected areas

Do not modify:
- listing detail page
- access-request / NDA / deal-room logic
- seller or buyer admin flows
- unrelated private pages

Do not commit, push or deploy.

## Verification

Run:
- `pnpm run check`
- `pnpm run build`
- `git diff --check`
- scope guard proving only allowed files and handoff docs changed

## Acceptance criteria

- marketplace browse reflects launch taxonomy and iGaming positioning
- MSP-era public browse language is removed
- teaser-safe listing presentation remains intact
- zero-inventory state explains the private flow and points to the right CTAs
- typecheck and build pass

## Completion handoff

- Append Slice 5A to `BUILD-LOG.md` with exact verification.
- Replace `REVIEW-REQUEST.md` with changed files, behavior, verification and any open question.
- Set `Ready for Review: YES`.
