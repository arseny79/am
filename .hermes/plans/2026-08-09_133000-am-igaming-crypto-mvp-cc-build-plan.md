# AM iGaming + Crypto/Web3 M&A MVP Implementation Plan

> **Default coding lane:** Claude Code only, with `ruflo-core` enabled and the repository-native Three Man Team workflow. Hermes is Arch/Architect and independent verifier. Claude Code runs as Bob/Builder. A fresh Claude Code review run acts as Richard/Reviewer. Hermes does not edit application code directly.

**Goal:** Narrow Acquisitions.market into a curated private M&A marketplace for crypto-friendly iGaming businesses, B2B iGaming technology and iGaming traffic/distribution assets.

**Architecture:** Reuse AM’s existing authentication, admin moderation, taxonomy, dynamic field definitions, visibility engine, NDA, data-room and deal-room capabilities. Hide generic marketplace modules rather than deleting them. Add the smallest additive moderation and taxonomy changes needed for a private concierge marketplace. Keep custody, escrow, token trading, fundraising and payments outside the MVP.

**Tech stack:** React 19, Wouter, Express, tRPC, MySQL/Drizzle, Vite, Tailwind, Vitest, Railway.

---

## Approved business scope

### Public positioning

**Dedicated M&A marketplace for crypto-friendly iGaming businesses and assets.**

Primary calls to action:
- `Submit a Business`
- `Share Your Acquisition Mandate`

### Accepted launch inventory

1. **Operating iGaming businesses**
   - crypto casinos
   - sportsbooks
   - case-opening platforms
   - revenue-producing Web3 gaming products
2. **B2B iGaming technology**
   - casino platforms
   - game studios and game portfolios
   - payment, wallet and compliance products
   - source-code businesses with customers or proven strategic value
3. **Traffic and distribution assets**
   - iGaming affiliate sites
   - comparison portals
   - media businesses
   - brands, domains and communities attached to an operating business

### Transaction structures

- full acquisition
- majority acquisition
- asset/IP acquisition
- acqui-hire where there is transferable product/IP

### Launch range

- intended transaction value: approximately €250k–€20m
- values outside the range require admin review rather than automatic rejection

### Explicitly outside the MVP

- token offerings or token-only OTC sales
- fundraising or minority investment rounds
- native custody, escrow, swaps or token settlement
- standalone meme tokens, NFT collections or social communities
- unrelated AI, SaaS, Creator Economy, Domains or generic Web3 listings
- unlicensed/prohibited-market operators
- trading bots that manage customer funds or promise returns
- raw code with no revenue, customers or strategic evidence

---

## Mandatory Claude Code operating mode

### Ruflo

- `ruflo-core@ruflo` is installed and enabled.
- Every Builder prompt must explicitly request Ruflo/SPARC discipline:
  1. Specification
  2. Pseudocode/flow understanding
  3. Architecture fit
  4. Refinement through tests
  5. Completion report
- Do not run a new Ruflo initialization in the repo. The plugin and `.claude/proven-config.json` already exist.

### Three Man Team

The repo contains:
- `CLAUDE.md` — session router
- `ARCHITECT.md` — Arch role
- `BUILDER.md` — Bob role
- `REVIEWER.md` — Richard role
- `ARCHITECT-BRIEF.md`
- `BUILD-LOG.md`
- `REVIEW-REQUEST.md`
- `REVIEW-FEEDBACK.md`
- `SESSION-CHECKPOINT.md`

Use the repository-native role files even though a separate Three Man Team marketplace plugin is not installed.

### Per-slice cadence

1. Hermes writes the focused `ARCHITECT-BRIEF.md` and marks `Architect Approval: YES`.
2. Claude Code Builder reads `CLAUDE.md`, `BUILDER.md`, `ARCHITECT-BRIEF.md`, `BUILD-LOG.md` and `SESSION-CHECKPOINT.md`.
3. Builder changes only the declared files, runs targeted verification and writes `REVIEW-REQUEST.md`.
4. A separate Claude Code Reviewer reads `REVIEWER.md`, `REVIEW-REQUEST.md` and the listed diff, then writes `REVIEW-FEEDBACK.md` without editing application code.
5. If Reviewer blocks, Builder receives a correction run.
6. Hermes independently reviews the diff and reruns canonical checks.
7. One reviewable commit per cleared slice.
8. No push or production deployment without Arseny’s explicit deployment approval.

---

## Current verified baseline

- repo: `/Users/arseny/Claude/AM`
- production branch: `main`
- Railway source: `arseny79/am`
- latest production lineage: `7913d94`
- Claude Code: installed and authenticated through Claude Pro
- Ruflo: installed and enabled
- Three Man Team: project-native role files present
- known baseline from the last verification:
  - `pnpm run check`: passed
  - `pnpm run build`: passed
  - `pnpm run lint`: one error plus pre-existing warnings
  - full test suite: many DB-dependent failures because no isolated test DB is configured
- current main tree contains pre-existing uncommitted favicon/content work and Ruflo daemon state; establish a clean checkpoint before Builder edits

---

# Phase 0 — Safe checkpoint and team harness

## Slice 0A — Preserve current WIP and create feature branch

**Owner:** Hermes/git operations, no application-code edits.

**Actions:**
- inspect current dirty files
- discard only generated `.claude-flow/daemon-state.json` state
- preserve branding/favicon/content work in a dedicated checkpoint commit or reversible stash
- create branch `am-igaming-crypto-mvp`
- confirm clean working tree before CC starts

**Acceptance:**
- rollback point exists
- `git branch --show-current` is `am-igaming-crypto-mvp`
- `git status --short` is clean before the first Builder run

## Slice 0B — Normalize Three Man Team handoff files

**Files likely to change:**
- `CLAUDE.md`
- `ARCHITECT.md`
- `BUILDER.md`
- `REVIEWER.md`
- `.gitignore`

**Requirements:**
- replace `[Project Name]`, `[Your Name]` and placeholder domain text with AM/Arseny context
- make filenames consistent: `BUILDER.md` and `REVIEWER.md`, not nonexistent `BOB.md`/`RICHARD.md`
- state that Ruflo/SPARC is mandatory for all non-trivial coding slices
- state that `Architect Approval: YES` in the brief means Bob may proceed without waiting interactively
- ignore generated `.claude-flow` runtime state while preserving intentional Ruflo configuration
- do not edit application code

**Verification:**
- all referenced handoff files exist
- no placeholder tokens remain
- no application files changed

---

# Phase 1 — Public scope, brand and navigation

## Slice 1A — Remove placeholder branding and centralize MVP public scope

**Files likely to change:**
- `client/src/const.ts`
- `client/src/config/mvpScope.ts` (create only if it reduces duplicated route/nav rules)
- `client/index.html`
- `client/src/components/PublicHeader.tsx`
- `client/src/components/Footer.tsx`
- `client/src/App.tsx`

**Requirements:**
- fallback brand is `Acquisitions.market`, never `App`
- use the existing site-logo setting, with a non-placeholder fallback
- public desktop and mobile navigation contains only:
  - Marketplace
  - Submit a Business
  - Buyer Mandates
  - How It Works
  - Login/account controls
- remove public links and route registrations for:
  - pricing
  - valuation
  - affiliate
  - professional directory
  - broker programme
  - payment history/success
  - NDA demo
  - test email
- retain source files and internal APIs unless their imports cause security or build problems
- admin and authenticated deal-management routes remain available
- direct visits to hidden public routes return the normal Not Found page, not broken imports

**Protected areas:**
- do not modify auth internals
- do not delete payment, broker, affiliate or professional database tables
- do not modify production environment variables

**Targeted tests:**
- add route/navigation tests for the allowed and hidden public surface
- verify mobile menu has the same scope as desktop

**Acceptance:**
- no visible `App` placeholder
- no public link to excluded modules
- hidden routes do not render their old pages
- admin and deal routes still compile

## Slice 1B — Rewrite public copy for the approved niche

**Files likely to change:**
- `client/src/pages/Home.tsx`
- `client/src/pages/HowItWorks.tsx`
- `client/src/pages/FAQ.tsx`
- `client/src/pages/Contact.tsx`
- `client/src/pages/Login.tsx`
- `client/src/pages/Signup.tsx`
- `client/src/components/Footer.tsx`
- SEO helpers/settings where required

**Required positioning:**
- curated private acquisitions of crypto-friendly iGaming businesses and assets
- verified buyers, confidential listings and iGaming-native diligence
- no claim that AM is the “first” marketplace
- no promise of regulated escrow, guaranteed close, automated valuation or token settlement

**Acceptance:**
- copy consistently explains the concierge sequence: submit → review → teaser/private mandate → qualified buyer → NDA → seller approval → data room → external closing
- all MSP wording is removed from public pages
- all pages are readable on 390px mobile width without horizontal overflow

---

# Phase 2 — iGaming/crypto taxonomy and configurable diligence fields

## Slice 2A — Idempotent MVP taxonomy seed

**Files likely to change:**
- `scripts/ensure-phase1-production.ts` or a narrowly named replacement loaded by the existing start process
- seed tests under `server/` or `scripts/`

**Requirements:**
- preserve old taxonomy rows and listings
- create/activate one public launch vertical for the approved iGaming + crypto/Web3 intersection
- create/activate exactly three launch asset types:
  1. Operating iGaming Business
  2. B2B iGaming Technology
  3. Affiliate / Media / Traffic Asset
- seed useful subcategories without allowing token-only inventory
- deactivate broad non-MVP verticals from public selectors without deleting rows
- seed must be idempotent and safe to run on every Railway start

**Acceptance:**
- rerunning the seed creates no duplicates
- old listings remain readable
- public taxonomy APIs expose only active MVP choices

## Slice 2B — Admin assignment controls for dynamic fields

**Files likely to change:**
- `client/src/pages/admin/tabs/ListingFieldsTab.tsx`
- `server/routers/adminFieldDefinitionsRouter.ts`
- targeted tests

**Requirements:**
- admin can assign a field definition to vertical, asset type and optional subcategory
- existing visibility controls remain the source of truth
- field keys remain unique within the intended scope
- validation prevents malformed option JSON and duplicate keys

**Acceptance:**
- assignment is editable end-to-end
- public/private visibility remains intact
- no regression to old field definitions

## Slice 2C — Seed minimum diligence fields by asset type

**No hardcoded form duplication.** Use the dynamic-field system.

**Common fields:**
- transaction structure
- asking range
- jurisdiction and licenses
- accepted/restricted markets
- annual revenue and EBITDA
- fiat versus crypto revenue/deposit share
- ownership/authority confirmation
- known disputes, regulatory issues or security incidents
- public teaser summary

**Operating iGaming fields:**
- GGR and NGR
- monthly active players
- FTDs
- deposit/withdrawal volume
- traffic source and affiliate concentration
- platform/game/payment providers
- KYC/AML process
- source-code/IP ownership

**B2B technology fields:**
- live clients and recurring revenue
- client concentration
- integrations and certifications
- code ownership
- infrastructure/support obligations

**Affiliate/media fields:**
- verified traffic and GEO mix
- FTDs
- CPA/revenue-share contracts
- operator concentration
- SEO dependency
- compliance history

**Visibility:**
- public: teaser-level category and broad ranges
- registered/NDA/seller approval: sensitive metrics
- admin-only: identity, legal evidence and internal review notes

---

# Phase 3 — Seller intake and admin moderation

## Slice 3A — Add explicit listing moderation state

**Files likely to change:**
- `drizzle/schema.ts`
- new additive migration, expected next number after current migrations
- `server/routers/adminListingRouter.ts`
- `server/db.ts` or focused helper module
- `client/src/pages/admin/tabs/ListingsTab.tsx`
- tests

**Additive model:**
- moderation status: pending review, needs information, approved, rejected
- submitted/reviewed timestamps
- reviewer ID
- private review notes/rejection reason

**Rules:**
- old published listings backfill safely
- seller cannot approve or publish own listing
- rejection/internal notes never appear in public APIs
- status transitions are audited

## Slice 3B — Convert Create Listing into confidential seller application

**Files likely to change:**
- `client/src/pages/CreateListing.tsx`
- `client/src/components/ListingEditForm.tsx`
- `server/routers.ts` listing procedures
- `server/routers/listingFieldValuesRouter.ts`
- DB transaction/helper code
- tests

**Requirements:**
- account login is sufficient to submit; KYC is not required before initial submission
- KYC remains required before approval/publication, protected-data access or transaction progression
- remove listing-tier/Stripe checkout from the submission path
- default listing to draft, unpublished and pending review
- default confidentiality to private/seller approval unless user explicitly chooses a stricter safe option
- render and validate dynamic fields for the selected asset type during initial creation
- save listing and dynamic values atomically or roll back cleanly
- success state says the submission is under review, not live

**Protected areas:**
- do not weaken KYC gates on deal creation, protected data or closing workflows
- do not expose admin-only fields

## Slice 3C — Admin approve/request-info/reject/publish flow

**Files likely to change:**
- `client/src/pages/admin/tabs/ListingsTab.tsx`
- `server/routers/adminListingRouter.ts`
- notification/email helpers only where already configured
- tests

**Acceptance:**
- admin can request more information, approve, reject and publish
- only approved listings can publish
- seller receives an in-app notification even when email is not configured
- all transitions leave an audit trail

---

# Phase 4 — Buyer mandates and public redaction

## Slice 4A — Fix the public Buyer Mandates page

**Files likely to change:**
- `server/routers/buyerRequestRouters.ts`
- `server/db.ts`
- `client/src/pages/BuyAsset.tsx`
- tests

**Requirements:**
- add a dedicated public teaser procedure instead of exposing the current protected `getAll`
- return only published, active, public mandates
- redact buyer ID, name, email, company and any private/internal fields
- keep full and owner-specific procedures protected
- eliminate the current unauthenticated 401/spinner failure

## Slice 4B — Rewrite buyer mandate intake for the niche

**Fields:**
- target asset types
- preferred transaction structure
- budget range
- revenue/EBITDA preference
- target jurisdictions and license tolerance
- crypto exposure requirement
- timeline
- acquisition thesis
- anonymity choice

**Rules:**
- logged-in users may submit a pending mandate without completed KYC
- KYC/KYB and proof of funds are required before confidential introductions/data-room access
- mandate is private by default; admin decides whether to publish an anonymised teaser

**Files likely to change:**
- `client/src/pages/BuyAsset.tsx`
- `client/src/components/BuyerRequestEditForm.tsx`
- `server/routers/buyerRequestRouters.ts`
- `server/routers/adminBuyerRequestsRouter.ts`
- schema only if dynamic mandate fields cannot be represented safely with the current table
- tests

---

# Phase 5 — Curated marketplace and listing presentation

## Slice 5A — iGaming-native browse and empty state

**Files likely to change:**
- `client/src/pages/Marketplace.tsx`
- listing-card components used by Marketplace/Home/Saved Listings
- listing search procedures
- tests

**Requirements:**
- filters use active asset types, transaction structure, jurisdiction/license profile and broad financial ranges
- cards show teaser-safe metrics appropriate to the selected asset type
- never expose exact confidential figures where the field visibility is gated
- zero-inventory state explains private/off-market deal flow and offers both approved CTAs
- remove MSP service mix and industry filters from public UI

## Slice 5B — Listing detail and access path

**Files likely to change:**
- `client/src/pages/ListingDetail.tsx`
- listing-detail tab/components
- `server/routers.ts` listing read path
- visibility helpers
- tests

**Requirements:**
- public teaser contains no seller identity or confidential wallet/legal data
- NDA/seller approval controls are clear
- dynamic fields respect all visibility levels server-side
- gated fields cannot be recovered through secondary APIs, similar listings or saved listings
- seller authority/wallet badges describe exactly what was verified

---

# Phase 6 — Qualification, data room and safe handover

## Slice 6A — Manual buyer qualification

**Reuse:**
- existing KYC/KYB/admin review
- buyer qualification
- proof-of-funds storage/status

**Change:**
- remove Stripe/payment dependency from qualification UX
- support manual pending/approved/rejected states
- require approval before NDA-protected data-room access and introductions
- add source-of-funds/admin notes without public exposure

**Likely files:**
- `server/routers/buyerQualificationRouter.ts`
- existing KYC/admin review routers
- `client/src/pages/BuyerProfile.tsx`
- `client/src/pages/admin/BuyerVerification.tsx`
- `client/src/pages/admin/tabs/KYCReviewTab.tsx`
- tests

## Slice 6B — Asset-type diligence checklists

**Reuse:**
- `listingPreparationItems`
- `dueDiligenceItems`
- listing/deal documents
- milestones/action items

**Templates:**
- operating iGaming
- B2B technology
- affiliate/media

**Checklist areas:**
- corporate authority and cap table
- licenses/jurisdictions
- financial evidence
- traffic/player/client evidence
- contracts/providers
- IP/source code
- AML/KYC and compliance
- crypto wallets/treasury where relevant
- incidents/disputes
- account and credential handover

## Slice 6C — Handover workspace without custody

**Requirements:**
- task/checklist evidence only
- no private-key storage
- no AM-controlled escrow
- no automatic token transfer
- include domains, repos, cloud, vendor accounts, multisig role changes and credential rotation
- parties/counsel/external providers perform the actual transfer

---

# Phase 7 — Verification, SEO, legal and visual QA

## Slice 7A — Targeted regression suite

Must cover:
- public route allowlist/denylist
- seller submission without KYC → pending and unpublished
- no seller self-publication
- admin moderation transitions
- buyer public-teaser redaction
- buyer full-detail protection
- NDA/seller approval visibility
- dynamic field visibility
- hidden routes
- no Stripe dependency in MVP intake

## Slice 7B — Repository verification

Run fresh after the final code edit:
- `pnpm run check`
- `pnpm run build`
- `pnpm run lint`
- targeted Vitest files for every changed flow
- full `pnpm run test` only with an isolated test database or documented baseline separation

Do not claim full green verification if DB-dependent legacy tests remain unconfigured.

## Slice 7C — Live/visual smoke matrix

Desktop and 390px mobile:
- homepage
- marketplace
- seller application
- buyer mandates
- login/signup
- listing teaser
- NDA/access request
- admin moderation

Verify:
- no horizontal overflow
- no placeholder `App`
- no MSP copy
- no excluded public navigation
- no console errors
- correct 401/403/404 behaviour
- legal links resolve
- sitemap/robots contain only intended public pages

## Slice 7D — Legal copy review gate

CC may update product descriptions and disclaimers but must not invent legal conclusions. Any wording about success fees, regulated businesses, KYC/KYB, sanctions or external settlement is marked for human/legal approval.

---

# Phase 8 — Railway deployment and production proof

**No deployment without Arseny approval.**

After approval:
- merge reviewed feature commits only
- run additive migration and idempotent seed inside Railway’s private network
- confirm latest deployment commit/status
- verify `https://acquisitions.market`
- exercise one representative admin moderation action with readback
- exercise one public redacted buyer mandate
- exercise seller submission → pending review
- confirm excluded routes are gone
- confirm no secret values are printed

Rollback:
- keep old tables and source files
- make migration additive
- retain previous successful Railway deployment
- document rollback steps before push

---

## CC invocation templates

### Builder

Use one focused slice per run:

`claude -p "You are Bob, the Builder in AM's Three Man Team. Ruflo-core is enabled: follow SPARC discipline. Read CLAUDE.md, BUILDER.md, ARCHITECT-BRIEF.md, BUILD-LOG.md and SESSION-CHECKPOINT.md. Architect Approval is YES. Build only the approved slice, respect protected areas, run the targeted checks and write REVIEW-REQUEST.md. Do not commit, push or deploy." --allowedTools "Read,Edit,Write,Bash" --max-turns 25 --output-format json`

Split any slice that needs four or more new files into smaller runs.

### Reviewer

`claude -p "You are Richard, the Reviewer in AM's Three Man Team. Read REVIEWER.md, REVIEW-REQUEST.md, ARCHITECT-BRIEF.md and only the changed files/diff listed by Bob. Review spec compliance, drift, security, redaction, authorization and regressions. Do not edit application code. Write REVIEW-FEEDBACK.md and report whether the slice is clear." --allowedTools "Read,Write,Bash" --max-turns 12 --output-format json`

### Correction

Resume Builder or start a new focused run with only the Reviewer’s Must Fix items. Rerun Reviewer afterward.

---

## Global protected areas

Unless the current slice explicitly requires them:
- no production deploy
- no push to `main`
- no secret/env changes
- no destructive migration
- no native escrow/custody/token transfer
- no auth rewrite
- no payment rewrite
- no broad refactor
- no deletion of legacy tables/features
- no unredacted buyer/seller identity in public APIs
- no generated `.claude-flow` runtime files in commits

---

## Completion definition

The build is complete only when:

- the public product is visibly dedicated to iGaming + crypto/Web3 M&A
- only the approved public surface remains
- seller applications and buyer mandates are manually moderated
- public teasers are redacted
- KYC/KYB and proof of funds gate confidential access, not initial lead submission
- the three approved asset types and their diligence fields work end-to-end
- no Stripe, custody, escrow or token-settlement dependency blocks the MVP
- desktop and mobile smoke tests pass
- typecheck/build pass
- targeted security/flow tests pass
- Richard/Reviewer clears each slice
- Hermes independently verifies the final diff and live deployment
