# AM — Project Memory for Claude

## What is AM?

- **AM** stands for **acquisition.market** — that is also the domain for the project.
- AM is the **next iteration of iGacquire.com** — not a copy of it, but an evolution.
- AM's codebase started as a **copy of the MSPi platform code** and is being refactored/extended from there.

---

## Core Concept

A **multi-asset acquisition marketplace** where both **legacy (traditional) businesses** and **crypto/web3/degen assets and businesses** can be bought and sold. It goes beyond MSPs — any type of business or digital asset is in scope.

---

## Key Differences vs. iGacquire / MSPi

### 1. Asset Types
- **Legacy assets & businesses** (traditional M&A: MSPs, SaaS, e-commerce, agencies, etc.)
- **Crypto / Web3 / Degen assets & businesses** (DAOs, DeFi protocols, NFT projects, on-chain businesses, wallets, domains, etc.)

### 2. Multi-Level Admin System
- **Superadmin** — full platform control
- **Lower-level admins** — superadmin can delegate specific functions/permissions to them
- Admin hierarchy is role-based and granular (not just a single "admin" role)

### 3. AI-Enabled Architecture
- AI can be connected via API at **many levels** of the platform
- Architecture must be **modular** so AI features can be plugged in/out independently
- Examples: AI valuation, AI risk scoring, AI matching, AI due diligence assistance

### 4. Superadmin Category Management
- Superadmin can **add, modify, and remove categories** at any time
- Each category can have its **own price structure** configured by the superadmin
- No hardcoded categories — fully dynamic

### 5. Dual Fee Model (by asset type)
| Asset Type | Fee Model |
|---|---|
| **Businesses** | **Percentage fee** on sale (success-based) — can upgrade for more exposure via pre-paid premium services |
| **Assets** (non-business) | **Fixed fee** (pre-paid) |

Premium exposure upgrades for businesses are **pre-paid** (not success-based).

---

## Inherited Platform Context (from MSPi / iGacquire)

The following was already built in the codebase that AM starts from:

- **Tech stack:** React 19, TypeScript, Tailwind CSS 4, Vite (frontend) + Express.js, tRPC (backend) + MySQL + Drizzle ORM
- **Auth:** OAuth, session-based, TOS/Privacy Policy click-wrap on first login
- **Payments:** Stripe (checkout, webhooks, refunds, receipts)
- **Email:** SendGrid
- **Escrow:** Escrow.com webhook integration (API client pending credentials)
- **File storage:** S3-compatible
- **KYC/Verification:** Document upload + Stripe Identity
- **Deal workflow:** Kanban pipeline (Initial Contact → NDA → Due Diligence → Negotiation → Escrow → Closing)
- **NDA system:** Click-wrap, PDF upload, DocuSign columns, custom seller templates
- **Valuation:** Multi-step wizard (EBITDA-based with adjustments for recurring revenue, contract quality, client concentration, YoY growth)
- **Admin dashboard:** KYC review, listing moderation, user management, analytics, refunds, SEO metadata, platform documents manager
- **Buyer request workflow:** Buyers post requests, sellers submit proposals, auto-creates deal
- **Security:** Helmet headers, rate limiting, Zod validation, parameterized queries, ownership checks
- **Legal pages:** Terms of Service, Privacy Policy, Disclaimer, Cookie Policy, AUP (tied to iGAcquire OÜ — needs updating for AM)
- **Company entity used in legacy code:** iGAcquire OÜ (Estonia) — will need to be updated for AM

---

## Strategic Positioning

- **vs. traditional brokers:** Lower cost, automated workflow, transparent pricing, direct buyer access
- **vs. iGacquire:** Broader asset types (crypto/web3), modular AI, dynamic category management, multi-level admin
- **vs. MSPX:** Full business + asset sales (not just contracts), flexible deal structures, higher transaction value

---

## Pre-Launch Mode ("Getting Ready for Launch")

### Requirement
The platform has a **site-wide pre-launch gate**:

- **All regular (non-admin) users** — see only a **"Getting Ready for Launch"** page (coming soon screen). They cannot access any other part of the site.
- **Admin users** — bypass the gate entirely and see the **full platform** (both frontend and backend/admin) as normal, directly on the website.

### Behaviour Rules
- The gate is controlled by a **flag** (e.g., `launchMode: 'pre-launch' | 'live'`) managed by the superadmin.
- When the flag is `pre-launch`: non-admin visitors hit the coming-soon wall; admins see everything.
- When the flag is `live`: everyone sees the full site.
- Auth still works during pre-launch (admins must be able to log in to get past the gate).
- The coming-soon page should be a clean, branded page — no navigation, no listings visible.

### Implementation Notes
- Gate check should happen at the **router/middleware level** (server-side) OR as a top-level React wrapper component that checks user role + launch flag before rendering routes.
- The launch flag should be stored in `siteSettings` (already in DB) and togglable from the admin dashboard.
- No separate domain or subdomain needed — everything is on the same domain.

---

## Critical Features Still to Build (from iGacquire gap analysis, still relevant)

1. Sales Packet / Data Room Preparation wizard
2. Buyer Qualification system (proof of funds, intent questionnaire)
3. LOI (Letter of Intent) management
4. Due Diligence checklist & request tracking
5. Flexible deal structures (partial sales, mergers, earn-outs, seller financing)
6. Multiple Offer Comparison tool
7. Multi-level admin permission delegation (AM-specific, new)
8. Crypto/Web3 asset listing category & workflow (AM-specific, new)
9. Dynamic category management UI for superadmin (AM-specific, new)
10. Modular AI integration layer (AM-specific, new)
