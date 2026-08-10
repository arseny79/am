# ARCHITECT-BRIEF — Slice 1B1: iGaming Homepage + Public Route Lockdown

Date: 2026-08-09
Architect Approval: YES
Branch: `am-igaming-crypto-mvp`
Master plan: `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`
Baseline checkpoint: `8341a6f`

## Role and method

You are Bob, Builder in AM's Three Man Team.

- Ruflo-core is enabled. Apply Ruflo/SPARC discipline.
- Read `BUILDER.md`, this brief and `SESSION-CHECKPOINT.md` first.
- Add a concise Builder Plan to this brief, then build immediately because Architect Approval is YES.
- Build only this slice.

## Goal

Replace the generic digital-asset homepage with the approved narrow positioning for a curated private M&A marketplace for crypto-friendly iGaming businesses and assets. Remove the last public route registrations for excluded payment/demo/test modules.

## Approved positioning

Use plain business language. The public promise is:

- curated private acquisitions of crypto-friendly iGaming businesses and assets
- operating iGaming businesses, B2B iGaming technology and affiliate/media/traffic assets
- manually reviewed opportunities
- confidential listings, qualified buyers, NDA and seller-controlled access
- intended transaction value approximately €250k–€20m, with exceptions manually reviewed

Primary calls to action:
- `Submit a Business` → `/create-listing`
- `Share Your Acquisition Mandate` → `/buy-asset`

Do not claim AM is the first marketplace. Do not promise regulated escrow, guaranteed closing, automated valuation, token settlement or investment returns.

## Allowed application files

1. `client/index.html`
2. `client/src/config/homepage.ts`
3. `client/src/pages/Home.tsx`
4. `client/src/App.tsx`

Plus handoff docs only:
- `ARCHITECT-BRIEF.md`
- `BUILD-LOG.md`
- `REVIEW-REQUEST.md`

## Requirements

### 1. Static metadata

In `client/index.html`, update title, description, Open Graph and Twitter copy to the approved niche. Use:

- title: `Acquisitions.market | Private iGaming M&A Marketplace`
- description: `Curated private acquisitions of crypto-friendly iGaming businesses, B2B technology and traffic assets.`

Preserve favicon, canonical URL, viewport and robots metadata.

### 2. Homepage fallback content

In `client/src/config/homepage.ts`, rewrite all fallback homepage content for the approved niche.

Required hero:
- headline: `Private M&A for Crypto-Friendly iGaming`
- subheadline: `Curated businesses, technology and traffic assets`
- description must explain manual review, qualified buyers and confidential deal flow without hype
- primary CTA: `Submit a Business` → `/create-listing`
- secondary CTA: `Share Your Acquisition Mandate` → `/buy-asset`

Required three trust signals:
- Manual Review
- Confidential by Design
- €250k–€20m Target Range

Required feature themes:
- curated iGaming opportunities
- buyer qualification
- confidentiality and controlled access
- iGaming-native diligence
- direct introductions/messaging
- external advisors and closing

Remove obsolete generic examples/comments that still say MSP.

### 3. Homepage composition and SEO

In `client/src/pages/Home.tsx`:

- update page title, SEO description and structured-data descriptions to the approved niche
- keep admin/CMS hero and trust-signal overrides working
- remove the `PremiumListingHero` component and its premium-listing query/imports; paid placement is outside the MVP
- keep `FeaturedListings` for approved inventory; do not refactor its cards in this slice
- preserve authenticated KYC banner, header, footer and existing responsive layout
- rewrite the seller/buyer process text so it describes the concierge sequence accurately:
  submit or share mandate → manual review → qualified interest → NDA/seller approval → diligence → external closing
- do not imply AM handles money, custody or escrow

### 4. Public route lockdown

In `client/src/App.tsx`, remove imports and route registrations for:
- `/payment-success`
- `/payment-history`
- `/nda-demo`
- `/test-email`

Keep implementation files and backend APIs intact. Old direct URLs must fall through to the normal Not Found route.

Keep all authenticated deal-management, NDA signing, admin, auth, marketplace, listing, buyer-mandate, FAQ, contact and legal routes.

## Protected areas

Do not modify:
- any file not explicitly allowed above
- `server/`, `drizzle/`, `shared/`, scripts or migrations
- auth, KYC, NDA signing, visibility, listing, mandate or deal logic
- Marketplace, BuyAsset, HowItWorks, FAQ, Contact, Login or Signup pages (later slices)
- production/Railway configuration

Do not install packages. Do not commit, push or deploy.

## Verification

Run:
- `pnpm run check`
- `pnpm run build`
- `git diff --check`
- static grep proving the four excluded routes/imports are absent from `App.tsx`
- static grep proving no `MSP`, `Escrow.com`, paid tier, success-fee or automated-valuation claims remain in the three homepage/metadata files
- scope guard proving only allowed files and handoff docs changed

## Acceptance criteria

- Homepage fallback clearly targets crypto-friendly iGaming M&A.
- Both primary CTAs are correct and active.
- No premium paid-placement hero remains.
- No escrow, guaranteed close, automated valuation or token-settlement claim appears on the homepage.
- Four excluded routes render normal Not Found via the catch-all.
- Admin content overrides still compile and function.
- Typecheck and production build pass.

## Completion handoff

- Append Slice 1B1 to `BUILD-LOG.md` with exact verification.
- Replace `REVIEW-REQUEST.md` with changed files, behavior, verification and any open question.
- Set `Ready for Review: YES`.

---

## Builder Plan — Slice 1B1

Date: 2026-08-10
Builder: Bob

### Files

| File | Change |
|---|---|
| `client/index.html` | Swap title, description, OG and Twitter copy to iGaming niche |
| `client/src/config/homepage.ts` | Rewrite all fallback content — hero, 3 trust signals, 6 features; replace Calculator icon with Users; remove MSP example comment |
| `client/src/pages/Home.tsx` | Remove PremiumListingHero function + PremiumListingCard/Loader2 imports; update SEO title/description and structured-data fallbacks; rewrite How It Works to concierge sequence; update CTA section copy |
| `client/src/App.tsx` | Remove imports + routes for PaymentSuccess, PaymentHistory, TestEmail, NDADemo |

### Key decisions

- `trpc` import kept in Home.tsx — still used by `getSiteSettings` query.
- Hero grid loses second column when PremiumListingHero is removed; no CSS change needed (CSS out of scope).
- `statEscrowProtected` DB field name is backend — untouched; fallback value changed to `€250k–€20m` in homepage.ts.
- Calculator icon replaced with Users (no automated-valuation connotation).
