# REVIEW-REQUEST — Slice 1B1: iGaming Homepage + Public Route Lockdown

Date: 2026-08-10
Builder: Bob (Claude Code)
Branch: am-igaming-crypto-mvp
Ready for Review: YES

---

## Changed Files

### `client/index.html`
Lines 12–32 — title, description, OG and Twitter meta updated to iGaming niche. Favicon, canonical, viewport and robots untouched.

### `client/src/config/homepage.ts`
Full rewrite of the `homepageContent` export:
- Hero: headline `Private M&A for Crypto-Friendly iGaming`, subheadline `Curated businesses, technology and traffic assets`, description covers manual review / qualified buyers / seller-controlled access / €250k–€20m range. Primary CTA `Submit a Business → /create-listing`, secondary `Share Your Acquisition Mandate → /buy-asset`.
- Trust signals: `Manual Review / Every Listing`, `Confidential / By Design`, `€250k–€20m / Target Range`.
- Six features: curated iGaming opportunities, qualified buyers only, confidential by design, iGaming-native diligence, direct introductions, external advisors & closing.
- Calculator icon replaced with Users (Calculator implies automated valuation).
- MSP example comment removed.

### `client/src/pages/Home.tsx`
- Removed `PremiumListingHero` function (lines 16–36 in original) and its `PremiumListingCard` + `Loader2` imports; `trpc` import kept (still used for `getSiteSettings`).
- SEO `<SEOHead>` title and description updated to iGaming niche.
- Structured-data WebSite and Organization description fallbacks updated.
- How It Works rewritten to concierge sequence (4 seller steps: submit → manual review → seller-controlled access → qualified introduction; 4 buyer steps: share mandate → review curated → request access → engage directly); no escrow or money handling implied.
- Bottom CTA headline and body updated for iGaming context.
- Admin CMS hero/trust-signal overrides (`settings?.hero*`) fully preserved.

### `client/src/App.tsx`
Removed imports and route registrations for:
- `PaymentSuccess` / `/payment-success`
- `PaymentHistory` / `/payment-history`
- `TestEmail` / `/test-email`
- `NDADemo` / `/nda-demo`

Implementation files and backend APIs untouched. All four paths fall through to the existing catch-all `<Route component={NotFound} />`.

---

## Behavior

- Homepage fallback targets crypto-friendly iGaming M&A. Admin can override via CMS.
- Both primary CTAs point to correct routes (`/create-listing`, `/buy-asset`).
- No premium paid-placement hero on the page.
- No escrow, guaranteed close, automated valuation, token settlement or first-marketplace claim in any homepage/metadata file.
- `/payment-success`, `/payment-history`, `/test-email`, `/nda-demo` render standard Not Found.
- All authenticated deal-management, NDA signing, admin, auth, marketplace, listing, buyer-mandate, FAQ, contact and legal routes intact.

---

## Verification Results

| Check | Result |
|---|---|
| `pnpm run check` | PASSED |
| `pnpm run build` | PASSED (pre-existing large-chunk warning only) |
| `git diff --check` | PASSED |
| Excluded routes/imports absent from App.tsx | CONFIRMED — no matches |
| No MSP/escrow/automated-valuation/paid-tier claims in homepage files | CONFIRMED — no matches |
| Scope guard — only allowed files changed | CONFIRMED |

---

## Open Questions

None. Brief requirements fully implemented.
