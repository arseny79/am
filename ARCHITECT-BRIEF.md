# ARCHITECT-BRIEF — Slice 1B2: Remaining Public Copy Rewrite

Date: 2026-08-10
Architect Approval: YES
Branch: `am-igaming-crypto-mvp`
Master plan: `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`
Baseline checkpoint: `9528ab3`

## Role and method

You are Bob, Builder in AM's Three Man Team.

- Ruflo-core is enabled. Apply Ruflo/SPARC discipline.
- Read `BUILDER.md`, this brief and `SESSION-CHECKPOINT.md` first.
- Add a concise Builder Plan to this brief, then build immediately because Architect Approval is YES.
- Build only this slice.

## Goal

Rewrite the remaining public-facing MSP-era copy so AM consistently presents as a curated private M&A marketplace for crypto-friendly iGaming businesses and assets.

This slice is copy and positioning only. Do not change backend behavior, auth logic, routes, payments, NDA mechanics or data structures.

## Approved positioning

Use plain business language. The public promise is:

- curated private acquisitions of crypto-friendly iGaming businesses and assets
- operating iGaming businesses, B2B iGaming technology and affiliate/media/traffic assets
- manually reviewed opportunities and buyer mandates
- confidential listings, qualified buyers, NDA and seller-controlled access
- AM is a technology marketplace and introduction layer, not the transaction counterparty

Do not claim AM is the first marketplace. Do not promise paid placement, success fees, regulated escrow, guaranteed closing, automated valuation, token settlement, investment returns or broker-dealer/advisory services.

## Allowed application files

1. `client/src/pages/HowItWorks.tsx`
2. `client/src/pages/FAQ.tsx`
3. `client/src/pages/Contact.tsx`
4. `client/src/pages/Login.tsx`
5. `client/src/pages/Signup.tsx`
6. `client/src/components/Footer.tsx`

Plus handoff docs only:
- `ARCHITECT-BRIEF.md`
- `BUILD-LOG.md`
- `REVIEW-REQUEST.md`

## Requirements

### 1. Rewrite How It Works

In `client/src/pages/HowItWorks.tsx`:

- remove all MSP-specific wording
- remove any promise or feature claim tied to instant valuation, paid tiers, Escrow.com, payment handling, success fees, Professional Directory or other excluded commercial modules
- keep the page as a public explanatory page, but rewrite it to the approved concierge flow:
  seller submits business or asset → AM manual review → teaser/private positioning → qualified buyer interest → NDA/seller approval → diligence/data room access → external closing with advisors
- buyer side should explain mandate sharing, opportunity review, confidential access requests and direct seller engagement once approved
- keep disclaimers truthful and narrow: AM is a technology marketplace, not a broker-dealer, investment adviser or party to the transaction
- preserve reasonable layout and responsiveness; do not introduce complex new UI

### 2. Rewrite FAQ

In `client/src/pages/FAQ.tsx`:

- remove MSP wording entirely
- remove public claims about listing tiers, premium placement, weekly pricing, success fees, Escrow.com, sale timelines, valuation tooling and Professional Directory
- replace them with truthful MVP-safe answers covering:
  - what AM lists
  - who can submit
  - how buyer mandates work
  - confidentiality / NDA / seller approval
  - what buyers can see publicly versus after approval
  - whether AM verifies listings and what diligence remains the buyer's job
  - AM's role boundary in negotiations and closing
- if a fees/pricing section remains, it must not claim any self-serve paid plan or success fee; safest option is to replace that section with access/process questions or remove it
- keep the page readable and structurally similar unless a small cleanup improves clarity

### 3. Light polish on remaining public pages

In these files, only make narrow copy updates if needed to keep positioning consistent:

- `client/src/pages/Contact.tsx`
- `client/src/pages/Login.tsx`
- `client/src/pages/Signup.tsx`
- `client/src/components/Footer.tsx`

Use this rule:
- change copy only where it materially improves niche consistency or removes a misleading public promise
- do not redesign layout or alter working form behavior
- do not add new dependencies or new routes

## Protected areas

Do not modify:
- any file not explicitly allowed above
- `client/src/App.tsx`, homepage files, marketplace/listing detail, buyer mandate logic or admin pages
- `server/`, `drizzle/`, `shared/`, scripts or migrations
- auth, KYC, NDA signing, visibility, listing, mandate or deal logic
- production/Railway configuration

Do not install packages. Do not commit, push or deploy.

## Verification

Run:
- `pnpm run check`
- `pnpm run build`
- `git diff --check`
- static grep across the allowed public files proving there are no remaining user-facing `MSP`, `Escrow.com`, `success fee`, paid-tier, premium-placement or automated-valuation claims
- scope guard proving only allowed files and handoff docs changed

## Acceptance criteria

- Remaining public pages consistently target crypto-friendly iGaming M&A.
- No public page in scope still markets MSP sales, paid tiers, Escrow.com or instant valuation.
- Contact, login, signup and footer stay functional.
- Typecheck and production build pass.
- Scope stays narrow.

## Completion handoff

- Append Slice 1B2 to `BUILD-LOG.md` with exact verification.
- Replace `REVIEW-REQUEST.md` with changed files, behavior, verification and any open question.
- Set `Ready for Review: YES`.
