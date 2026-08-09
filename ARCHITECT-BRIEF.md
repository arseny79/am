# ARCHITECT-BRIEF — Slice 1A: Launch-Safe Product Shell

Date: 2026-08-09
Architect Approval: YES
Branch: `am-igaming-crypto-mvp`
Master plan: `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`

## Role and method

You are Bob, Builder in AM's Three Man Team.

- Apply Ruflo/SPARC discipline.
- Read `BUILDER.md`, this brief and only the files required below.
- Add a concise Builder Plan to this brief, then build immediately because Architect Approval is YES.
- Build only this slice.

## Goal

Make the product shell launch-safe for a curated crypto-friendly iGaming M&A marketplace by removing launch access to legacy monetisation/service-provider features, fixing the default brand and presenting only the four core journeys.

## Approved product surface

Launch navigation must expose only:
1. Marketplace — `/marketplace`
2. Buyer Mandates — `/buy-asset`
3. Sell a Business — `/create-listing`
4. How It Works — `/how-it-works`

Login/user controls and Admin remain available as appropriate.

## Scope

### 1. Brand defaults

File: `client/src/const.ts`

- Default `APP_TITLE` must be `Acquisitions.market`, not `App`.
- Default local logo must be `/favicon-512.png`, not a placeholder.co URL.
- Environment/admin overrides must continue to work.

### 2. Disable legacy launch routes without deleting their implementation

File: `client/src/App.tsx`

Remove imports and route registrations for:
- `/valuation-tool`
- `/valuate`
- `/pricing`
- `/affiliate`
- `/professional-directory`
- `/professionals`
- `/professionals/join`
- `/professionals/edit`
- `/professionals/:id`
- `/broker`
- `/broker/apply`
- `/broker/dashboard`
- `/broker/create-listing`
- `/broker/faq`
- `/broker/how-it-works`
- `/admin/escrow`
- `/admin/price-plans`
- `/admin/brokers`

Old direct URLs should fall through to the existing Not Found route.

Do not delete page files, backend routers, database tables or migrations. This is reversible deactivation for the MVP.

### 3. Public headers

Files:
- `client/src/components/PublicHeader.tsx`
- `client/src/components/StandardHeader.tsx`

Desktop and mobile navigation must use the four approved links and labels exactly:
- Marketplace
- Buyer Mandates
- Sell a Business
- How It Works

Preserve Admin, Login and authenticated user controls. Keep mobile behavior accessible.

### 4. Footer

File: `client/src/components/Footer.tsx`

- Remove Pricing, Professional Directory, Affiliate Program and all broker links/column.
- Brand description: `Curated M&A marketplace for crypto-friendly iGaming businesses and assets.`
- Marketplace links: Browse Deals, Submit a Business, Buyer Mandates.
- Resource links: How It Works, FAQ, Contact.
- Preserve published/fallback legal links and disclaimer.
- Rebalance the grid so it does not leave an empty column.

### 5. Seller intake must not depend on Stripe or paid listing tiers

File: `client/src/pages/CreateListing.tsx`

- Keep the internal `listingTier` submitted as `standard` for backward compatibility.
- Remove the visible Standard/Featured/Premium tier chooser, prices, success-fee copy, valuation-calculator benefit and premium thumbnail upsell.
- Remove the listing-fee Stripe checkout mutation and redirect branch from this page.
- Successful submission should show a clear manual-review message and go to `/my-listings`.
- Keep logo upload, listing details, visibility and other existing form behavior intact.
- Do not alter the Stripe router or delete tier fields from schema in this slice.

### 6. Logged-in dashboard quick actions

File: `client/src/pages/Dashboard.tsx`

- Replace the Valuation quick action with `Post Buyer Mandate` linking to `/buy-asset`.
- Replace the three visible MSP-specific quick-action descriptions with crypto-friendly iGaming M&A language.
- Do not refactor the rest of Dashboard.

### 7. Lean admin surface

File: `client/src/pages/AdminDashboardModular.tsx`

Hide legacy launch tabs and remove now-unused imports/render cases for:
- Affiliates
- Pricing
- Professionals
- Credentials
- Brokers

Keep Users/KYC, Listings, Buyer Requests, taxonomy, listing fields, visibility-supporting controls, content/legal, security, launch mode and analytics tabs.

### 8. Admin content hint

File: `client/src/pages/admin/tabs/ContentTab.tsx`

Replace `/pricing` examples with active launch destinations such as `/marketplace` or `/buy-asset`.

## Protected areas

Do not modify:
- `server/`, `drizzle/`, `shared/` or scripts
- hidden legacy page/component implementations beyond the files explicitly listed
- database schema or migrations
- auth, KYC, NDA, messaging, access-request or visibility logic
- homepage body copy (Slice 1B)
- production/Railway configuration

Do not commit, push or deploy.

## Verification

Run:
- `pnpm run check`
- `pnpm run build`
- `git diff --check`
- grep the active route/nav files to verify disabled route paths are absent
- verify `git diff --name-only` contains only the allowed application files plus handoff docs and generated Ruflo runtime files are not submitted

If lint has a known baseline problem, do not broaden scope; report it separately.

## Acceptance criteria

- No launch navigation or registered frontend route reaches valuation, pricing, affiliate, professional-directory, broker or escrow/price-plan admin pages.
- Core navigation is identical across public headers.
- Create Listing has no price/tier selector and no Stripe redirect dependency.
- Default brand never renders as `App`.
- Typecheck and production build pass.
- No approved existing core flow is deleted.

## Completion handoff

- Update `BUILD-LOG.md` with Slice 1A and verification.
- Replace `REVIEW-REQUEST.md` with Slice 1A changed files, line ranges, behavior changes, verification and open questions.
- Set `Ready for Review: YES`.
