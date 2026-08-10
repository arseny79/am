# REVIEW-REQUEST — Slice 1B2: Remaining Public Copy Rewrite

Date: 2026-08-10
Builder: Bob (Claude Code)
Branch: am-igaming-crypto-mvp
Ready for Review: YES

---

## Changed Files

### `client/src/pages/HowItWorks.tsx`
Full copy rewrite — layout and component structure preserved, all copy replaced:
- H1 updated from hardcoded "How MSP.Investments Works" to `{APP_TITLE}` (new import added).
- Hero subtitle: iGaming private M&A marketplace framing.
- Three overview cards: Technology Marketplace / Confidential & Private / Direct Introductions.
- Important Notice: `MSP.Investments` → `{APP_TITLE}`.
- Seller flow (4 steps): Submit Business or Asset → Manual Review & Positioning → Buyer Interest & NDA → Diligence & Closing. Removed "Get instant valuation estimate" bullet and "Use Escrow.com" bullet.
- Buyer flow (4 steps): Share Your Mandate → Review Curated Opportunities → Sign NDA & Request Access → Engage Directly & Acquire. Removed MSP-specific search/filter copy.
- Platform Features (6 cards): Curated Listings, Confidential Access Tiers, Buyer Mandates, Deal Rooms, Document Vault, Seller Access Control. Removed Valuation Calculator and Escrow Integration cards entirely.
- Disclaimers: "Industry Specialists" bullet updated from MSP to iGaming M&A/licensing context.
- CTA: "Join MSP.Investments today" → "Browse curated iGaming opportunities or submit your business…"; button label "List Your Business" → "Submit Your Business".
- Removed unused `TrendingUp` import; added `APP_TITLE` import from `@/const`.

### `client/src/pages/FAQ.tsx`
Full FAQ data rewrite — accordion structure and layout unchanged:
- Hero subtitle: "MSP businesses" → "iGaming businesses and assets".
- Removed Fees & Pricing category entirely (no tiers, no success fee, no weekly pricing, no escrow fee disclosure).
- For Sellers (5 Q&A): what AM lists, anonymous submission, what information needed, how review & listing works, how KYC works. Removed MSP listing-cost tier question, removed sale-timeline question.
- For Buyers (5 Q&A): fees for browsing/mandate, how mandates work, public vs after-approval access, NDA & access process, listing accuracy and diligence responsibility. Removed Escrow.com payment question.
- Platform & Process (4 Q&A): no legal/financial advice, AM role in negotiations, confidentiality, what if deal doesn't close. Removed Professional Directory reference.
- Removed unused `useState` and `ChevronDown` imports.

### `ARCHITECT-BRIEF.md`
Builder Plan section appended above completion handoff.

---

## Behavior

- `HowItWorks.tsx` and `FAQ.tsx` consistently present AM as a curated private iGaming M&A marketplace with manual review, seller-controlled access, and NDA gating.
- No public page in scope still references MSP, paid listing tiers, success fees, Escrow.com, automated valuation, Professional Directory, or premium placement.
- `Contact.tsx`, `Login.tsx`, `Signup.tsx`, `Footer.tsx` — no changes required; all already consistent.
- No auth, NDA, listing, mandate, deal room, or backend logic touched.
- No new dependencies or routes added.

---

## Verification Results

| Check | Result |
|---|---|
| `pnpm run check` | PASSED |
| `pnpm run build` | PASSED (pre-existing large-chunk warning only) |
| `git diff --check` | PASSED |
| Grep for prohibited claims across all 6 public files | CONFIRMED — no user-facing MSP/Escrow.com/success-fee/tier/valuation/Professional Directory claims |
| Scope guard — only allowed files changed | CONFIRMED |

---

## Open Questions

None. Brief requirements fully implemented.
