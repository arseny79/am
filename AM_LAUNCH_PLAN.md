# AM Launch Plan — acquisitions.market

**Goal:** Launch AM fast, stable, modular, and AI-enabled.  
**Architect:** Claude  
**Date:** April 2026

---

## Guiding Principles

1. **Ship fast, stay stable** — Complete outstanding half-done work before adding new features
2. **Modular** — Every AI feature, asset type, and UI section must be its own isolated module
3. **AI-first** — AI features are a core differentiator, not add-ons
4. **Dual-crowd** — All copy, UX, and features must serve both legacy M&A and web3/crypto/iGaming audiences
5. **Never break auth, payments, or deal flow** — These are revenue-critical

---

## Phase A: Stability & Completion (Days 1–3)

Complete all half-done work from MSPi before touching anything new.

### A1: Complete Phase 133 Remaining Items
- [ ] Integrate `AdminKYCReviewDashboard` component into Admin Dashboard (KYC Review tab exists in tab config but component not wired)
- [ ] Add verification expiry date display to `/profile` page
- [ ] End-to-end test email verification flow

### A2: Complete Phase 134 — NDA Template System
- [ ] Run `pnpm db:push` to push `ndaTemplates`, `ndaSignings`, `ndaVariableDefinitions` tables
- [ ] Finish `signNDA` and `getNDASigningStatus` procedures in `ndaSigningRouter.ts`
- [ ] Build variable configuration UI in `AdminNDATemplateManager`
- [ ] Build NDA signing modal with clickwrap + signature capture
- [ ] Document vault integration for signed NDAs
- [ ] Write end-to-end tests

### A3: Remaining Backlog Cleanup
- [ ] Phase 122: Decide favicon/logo sync — implement auto-sync or document manual process
- [ ] Smoke test footer links across all pages
- [ ] Verify mobile nav across all pages
- [ ] Fix any TypeScript errors (`pnpm check`)

---

## Phase B: Rebrand to acquisitions.market (Days 3–5)

Replace all MSPi artifacts with AM-appropriate language.

### B1: Domain References
- [ ] Replace all `msp.investments`, `MSPmarket.com`, `MSPdeal.com` with `acquisitions.market`
- [ ] Replace `MSP M&A Marketplace` → `acquisitions.market`
- [ ] Update RSS feed README and API docs
- [ ] Update `client/src/lib/seo.ts` default URLs
- [ ] Update `server/_core/llm.ts` forge URL if hardcoded

### B2: Homepage Copy (client/src/config/homepage.ts)
- [ ] Update hero headline to speak to both crowds: traditional buyers/sellers AND web3/crypto
- [ ] Update trust signals to be asset-agnostic
- [ ] Update feature descriptions to reference broader asset types (not just MSPs)
- [ ] Update CTAs to be inclusive (not "Sell Your MSP")

### B3: Terminology Sweep
- [ ] Search and replace "MSP" in all user-facing strings → "business" or appropriate neutral term
- [ ] Update placeholder text in listing creation forms
- [ ] Update valuation tool copy
- [ ] Update How It Works, FAQ pages
- [ ] Update email templates in `emailService.ts`
- [ ] Update legal document templates (Terms, Privacy — stored in DB, update via admin or seed)
- [ ] Update footer company description

### B4: Listing Category Expansion
- [ ] Add `assetType` enum to `listings` table: `msps` | `saas` | `ecommerce` | `agency` | `web3` | `igaming` | `other`
- [ ] Run `pnpm db:push`
- [ ] Add asset type selector to CreateListing form (first step)
- [ ] Conditionally show relevant metric fields based on asset type:
  - **Traditional (MSP/SaaS/eCommerce):** MRR, EBITDA, client count, churn
  - **Web3/Crypto:** TVL, token holders, daily active wallets, protocol revenue, treasury size
  - **iGaming:** Monthly active players, GGR, license jurisdiction, platform type
- [ ] Update Marketplace filters to include asset type filter
- [ ] Update valuation tool to route to different calculation models by asset type

---

## Phase C: AI Layer (Days 5–10)

Build the three AI modules using existing `invokeLLM` infrastructure.

### C1: AI Support Chat (Global Widget)

**Scope:** Floating chat bubble on all pages. Answers platform questions, guides users.  
**Auth:** Works logged out and logged in. If logged in, personalized context.

**Backend:**
- [ ] Create `server/routers/aiSupportRouter.ts`
  - `chat` mutation (publicProcedure): accepts `message: string`, `context: { page, dealId? }`
  - System prompt: platform overview, how it works, pricing, process
  - No deal-private data exposed in public mode
  - If user is logged in and on a deal page, can answer deal-specific questions
- [ ] Add to `appRouter`

**Frontend:**
- [ ] Create `client/src/components/AISupportChat.tsx`
  - Floating button (bottom-right corner)
  - Slide-up chat panel
  - Streaming or polling response display
  - Passes current page URL as context
- [ ] Add to `App.tsx` globally (renders on all pages)

**System prompt covers:**
- What acquisitions.market is
- How listing/deal/NDA/escrow flow works
- Pricing and fees
- How to get verified
- "I don't know" fallback with link to /contact

---

### C2: AI Success Manager (Per-Deal)

**Scope:** Embedded in DealRoom. Proactive advisor with full deal context.  
**Auth:** Protected — only deal participants and admins.

**Backend:**
- [ ] Create `server/routers/aiDealAdvisorRouter.ts`
  - `getAdvice` mutation (protectedProcedure):
    - Verifies caller is party to the deal
    - Loads: deal stage, messages (last 20), documents list, offer history, milestones, action items
    - Builds context-rich prompt
    - Returns: `{ advice: string, suggestedActions: string[], riskFlags: string[] }`
  - `getDealSummary` query: generates a plain-English summary of deal status for either party
  - `analyzeStall` mutation: detects if deal is stalled, suggests how to unblock
- [ ] Trigger `analyzeStall` automatically via scheduler when deal has no activity for 5 days

**Frontend:**
- [ ] Create `client/src/components/AIDealAdvisor.tsx`
  - Collapsible panel in DealRoom sidebar
  - "Ask AI Advisor" input + response display
  - "Get Deal Summary" button → plain-English status update
  - "What should I do next?" → stage-specific action suggestions
  - Risk flags displayed as badges (e.g., "⚠ Offer expires in 12h", "⚠ No response in 5 days")
- [ ] Integrate into DealRoom page (sidebar or new "AI Advisor" tab)

**AI Advisor persona:**
- Name: "AM Advisor" or "Acquisition Assistant"
- Tone: professional, neutral, doesn't take sides
- Always clarifies it's AI guidance, not legal/financial advice
- Knows deal context but never shares one party's private info with the other

---

### C3: AI Listing Analyzer (Seller Tool)

**Scope:** Embedded in EditListing and optionally CreateListing. Analyzes listing quality.  
**Auth:** Protected — listing owner only.

**Backend:**
- [ ] Add `analyzeListing` mutation to `adminListingRouter.ts` or create `aiListingRouter.ts`
  - Loads listing data
  - Prompts LLM to evaluate: completeness, description quality, pricing clarity, metrics coverage
  - Returns: `{ score: number, strengths: string[], improvements: string[], estimatedTimeToSale: string }`

**Frontend:**
- [ ] Create `client/src/components/AIListingAnalyzer.tsx`
  - "Analyze My Listing" button in EditListing
  - Score badge (e.g., "Listing Quality: 78/100")
  - Expandable suggestions panel
  - One-click "Improve Description" (AI rewrites description, user can accept/reject)

---

## Phase D: Platform Hardening (Days 8–12, parallel with Phase C)

### D1: Modular Architecture Enforcement
- [ ] Ensure every new AI feature is in its own router file — never bloat existing routers
- [ ] All AI components must be lazy-loaded (not blocking page load)
- [ ] AI features must degrade gracefully when LLM is unavailable (show fallback, no crashes)

### D2: Performance
- [ ] AI router responses: stream where possible, use loading states everywhere
- [ ] Add `aiRequestLogs` table to DB for tracking AI usage (prompt tokens, latency, errors)
- [ ] Rate-limit AI endpoints: 20 requests/hour per user to prevent abuse

### D3: Error Resilience
- [ ] Wrap all `invokeLLM` calls in try/catch with fallback messages
- [ ] Add AI feature flags in `siteSettings` DB table (can toggle AI features on/off from admin)
- [ ] Admin dashboard: AI Usage tab showing request volumes, errors, avg latency

---

## Phase E: Launch Readiness (Days 12–14)

### E1: SEO & Meta
- [ ] Update all page titles to reflect acquisitions.market
- [ ] Update `client/src/lib/seo.ts` default og:image, description, siteName
- [ ] Regenerate sitemap via admin
- [ ] Update robots.txt with correct domain
- [ ] Submit sitemap to Google Search Console

### E2: Legal
- [ ] Update Terms of Service for AM (broader asset types, not just MSPs)
- [ ] Add AI disclaimer section to Terms (AI features are guidance only, not legal/financial advice)
- [ ] Update Privacy Policy for AM domain
- [ ] Ensure AI data handling is disclosed (user messages sent to LLM provider)

### E3: Final QA
- [ ] Full user journey test as anonymous visitor
- [ ] Full user journey test as logged-in buyer
- [ ] Full user journey test as logged-in seller
- [ ] Full deal flow test (create listing → create deal → NDA → offer → escrow)
- [ ] Test all AI features with real inputs
- [ ] Test all email notifications
- [ ] Mobile responsiveness check on all public pages

---

## Post-Launch Roadmap (Weeks 3–8)

### PL1: Crypto/Web3 Enhancements
- [ ] Crypto payment options (USDC, ETH) alongside Stripe
- [ ] Web3 wallet connect for buyer verification (alternative to KYC)
- [ ] Token-gated listing access (NFT holders see specific listings)
- [ ] On-chain escrow option for crypto-native deals

### PL2: AI Enhancements
- [ ] AI-powered buyer-seller matching (suggest listings to buyers based on their stated criteria)
- [ ] AI document reviewer (flag missing items in due diligence packages)
- [ ] AI-generated NDA first draft (from asset type + deal size)
- [ ] AI deal scoring (probability of close based on stage + engagement patterns)

### PL3: Community & Trust
- [ ] Verified buyer/seller badges on public profiles
- [ ] Public deal statistics (anonymized: "42 deals closed in last 90 days")
- [ ] Testimonial system with verified deal badge
- [ ] Public API for feed integrations (already built, needs marketing)

---

## Architecture Constraints (Never Violate)

1. **Auth is always checked twice** (component guard + `enabled: isAuthenticated` on hook)
2. **AI features never expose one party's data to another** — all AI prompts are scoped to the requesting user's view
3. **Every new DB table needs a migration** — always `pnpm db:push` after schema changes
4. **Public procedures must be intentional** — default to `protectedProcedure`, downgrade to `publicProcedure` only deliberately
5. **AI feature flags** — all AI features toggleable from admin `siteSettings` table
6. **No MSP-only assumptions** — asset type must always be checked before applying MSP-specific logic

---

## Current Status by Phase

| Phase | Status | ETA |
|---|---|---|
| A: Stability & Completion | Not started | Days 1–3 |
| B: Rebrand to AM | Not started | Days 3–5 |
| C: AI Layer | Not started | Days 5–10 |
| D: Platform Hardening | Not started | Days 8–12 |
| E: Launch Readiness | Not started | Days 12–14 |
| Post-launch: Web3 | Planned | Week 3+ |
| Post-launch: AI++ | Planned | Week 4+ |
