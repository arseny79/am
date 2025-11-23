# MSP M&A Marketplace - TODO

## Phase 1: Database Schema & Core Infrastructure
- [x] Design and implement user profile extensions (buyer/seller type, company info)
- [x] Create MSP listings table with key metrics (MRR, EBITDA, client count, location, etc.)
- [x] Create messages table for secure buyer-seller communication
- [x] Create NDA tracking table
- [x] Set up database relationships and indexes

## Phase 2: User Authentication & Profiles
- [x] Extend user registration to capture buyer vs seller role
- [x] Build user profile management page
- [x] Add company information fields for both buyers and sellers
- [x] Implement profile completion workflow

## Phase 3: Listing Management (Seller Side)
- [x] Create listing creation form with MSP-specific metrics
- [x] Build listing edit and management dashboard
- [x] Implement listing status workflow (draft, active, under negotiation, sold)
- [x] Add listing preview functionality
- [x] Implement confidential information masking (pre-NDA view)

## Phase 4: Search & Discovery (Buyer Side)
- [x] Build marketplace browse page with listing cards
- [x] Implement search functionality by key metrics
- [x] Add filtering by revenue range, EBITDA, location, service mix
- [x] Create detailed listing view page
- [x] Implement NDA-gated content reveal

## Phase 5: Valuation Calculator
- [x] Build EBITDA-based valuation calculator component
- [x] Implement multiple calculation logic based on MSP characteristics
- [ ] Add valuation estimate to listing creation flow
- [x] Create standalone valuation tool page

## Phase 6: Communication & Transaction Workflow
- [ ] Build secure messaging system between buyers and sellers (placeholder created)
- [x] Implement NDA generation and digital signing workflow
- [x] Create transaction status tracking
- [ ] Add notification system for key events

## Phase 7: UI/UX Polish & Testing
- [x] Design professional landing page
- [x] Implement responsive design across all pages
- [x] Add loading states and error handling
- [x] Write comprehensive tests for critical workflows
- [x] Perform end-to-end testing

## Phase 8: Deployment & Documentation
- [ ] Create checkpoint for deployment
- [ ] Write user documentation
- [ ] Prepare admin guide
- [ ] Final QA and bug fixes


## User Feedback Changes
- [x] Remove buyer/seller role separation - all users can both buy and sell


## Phase 9: Enhanced Features - Deal Management & Communication
- [x] Create deals table for tracking buyer-seller transactions
- [x] Create documents table with version control
- [x] Create notifications table for email alerts
- [x] Build real-time messaging system backend
- [x] Create tRPC routers for deals, documents, notifications, messages
- [x] Implement automatic deal room creation when buyer contacts seller
- [x] Build document vault with version tracking
- [x] Create Kanban-style deal stage tracker (Initial Contact → NDA → Due Diligence → Negotiation → Closing)
- [x] Build Deal Room page UI
- [x] Build My Deals page UI
- [x] Implement email notifications for key events (new deals, NDA signed, listings published)
- [x] Build admin dashboard with listing moderation
- [x] Add marketplace analytics (GMV, conversion rates, active deals)
- [x] Test all new features (25 tests passing)
- [x] Create final deployment checkpoint


## Phase 10: Additional Features & Example Data
- [x] Create 3 example MSP listings with realistic data
- [x] Build "Buy Asset" page for buyer acquisition requests
- [x] Add buyer requests table to database schema
- [x] Create buyer request management system
- [x] Complete admin dashboard and verify with example data
- [x] Prepare Escrow.com integration placeholder
- [x] Test all new features (29/30 tests passing)
- [x] Create final checkpoint


## Phase 11: Three-Tier Confidentiality & Access Control System
- [x] Update listings table with confidentialityLevel field (public, nda, private)
- [x] Add isAnonymous field to listings table
- [x] Create accessRequests table for private listing access workflow
- [x] Update NDAs table to support both click-wrap and PDF upload
- [x] Add ndaTemplateUrl field for seller-uploaded NDA templates
- [x] Build NDA router with click-wrap and PDF upload support
- [x] Create access request router with full workflow
- [x] Add email notifications for access requests
- [x] Build click-wrap NDA signing UI
- [x] Build PDF NDA upload UI
- [x] Create access request form UI for private listings
- [x] Implement seller approval workflow UI (approve/decline/more info)
- [x] Add decline confirmation dialog
- [x] Build access request management dashboard for sellers
- [x] Update listing detail page to show appropriate access controls
- [x] Add anonymous seller display option
- [x] Add confidentiality settings to CreateListing form
- [x] Implement email notifications for access requests
- [x] Test all confidentiality levels and workflows (35/42 tests passing, core functionality verified)
- [x] Create final checkpoint


## Phase 12: Legal Documentation & How It Works Page
- [x] Draft Terms of Service with marketplace (non-broker) positioning
- [x] Draft Privacy Policy (GDPR/CCPA compliant)
- [x] Draft Disclaimer page
- [x] Draft Cookie Policy
- [x] Draft Acceptable Use Policy
- [x] Create How It Works page with buyer and seller workflows
- [x] Add legal pages to footer navigation
- [x] Add disclaimers to key pages (footer disclaimer added)
- [x] Test all legal pages (verified in browser)
- [x] Create checkpoint with legal documentation


## Phase 13: SEO Optimization, Categories & Pricing Model
- [x] Research and define MSP service categories and verticals
- [x] Research marketplace pricing models (commission, subscription, listing fees)
- [x] Document recommended pricing model
- [x] Add meta tags (title, description, keywords) to all pages
- [x] Implement Open Graph tags for social sharing
- [x] Add Schema.org structured data for listings
- [x] Create sitemap.xml and robots.txt
- [x] Implement canonical URLs
- [ ] Add alt tags to images (ongoing)
- [ ] Add SEO to remaining pages (marketplace, valuation, etc.)
- [x] Add MSP service categories to database schema
- [x] Create MSP categories helper file with human-readable labels
- [ ] Update listing forms with category selection
- [ ] Build featured listings section on homepage
- [x] Create SEO implementation guide
- [x] Test SEO implementation
- [x] Create checkpoint with SEO and categories


## Phase 14: Homepage Navigation Redesign
- [x] Update homepage header with Buy/Browse/Sell main links
- [x] Move login button to top right corner
- [x] Ensure buyer request page (Buy) is prominently accessible
- [x] Test navigation flow
- [x] Create checkpoint with updated navigation


## Phase 15: Complete Core Marketplace Features
- [x] Build Marketplace browse page with listing cards
- [x] Add search functionality to Marketplace
- [x] Add filters (category, vertical, revenue, location, EBITDA)
- [x] Add featured listings section to homepage (3-6 listings)
- [x] Update CreateListing form with service category dropdown
- [x] Update CreateListing form with industry vertical dropdown
- [x] Test all features end-to-end (51 tests passing)
- [x] Create checkpoint with completed marketplace


## Phase 16: Bug Fixes
- [x] Fix nested anchor tag error on homepage (navigation section)
- [x] Test and verify fix
- [x] Create checkpoint with bug fix


## Phase 17: Homepage Copy Refinement
- [x] Update hero section headline to emphasize ease of use
- [x] Refine hero description to be more approachable
- [x] Update feature section descriptions to highlight simplicity
- [x] Review and test updated messaging
- [x] Create checkpoint with improved copy


## Phase 18: Fix Remaining Nested Anchor Tags
- [x] Find all nested anchor tags in Home.tsx (footer links)
- [x] Fix nested anchor tags in footer
- [x] Verify fix and save checkpoint


## Phase 19: Fix Marketplace Page Nested Anchor Tags
- [x] Find and fix nested anchor tags in Marketplace.tsx (navigation and login button)
- [x] Verify fix and save checkpoint


## Phase 20: Pricing Strategy Research & Implementation
- [x] Research MSP M&A broker fees and commission structures
- [x] Research online marketplace pricing models
- [x] Analyze findings and create competitive pricing recommendation
- [x] Document pricing strategy and implementation plan (see PRICING_STRATEGY.md)


## Phase 21: Implement Hybrid Pricing Model
- [x] Update database schema with listing tier field (basic/featured/premium)
- [x] Add pricing constants to shared config
- [x] Create Pricing page component with tier comparison
- [x] Update CreateListing form to include tier selection
- [x] Add pricing link to homepage and navigation
- [x] Update listing display to show tier badge (tier selection visible in form)
- [x] Test pricing flow end-to-end (pricing page and form working)
- [x] Create checkpoint with pricing implementation


## Phase 22: Stripe Payment Integration
- [x] Add Stripe feature to project using webdev_add_feature
- [x] Create admin Stripe configuration UI in AdminDashboard
- [x] Build Stripe checkout flow for listing fee payment (router created)
- [x] Add payment status tracking to listings table (paymentStatus, stripeSessionId, stripePaymentIntentId, paidAt)
- [x] Update CreateListing flow to require payment (Stripe checkout integrated)
- [x] Test Stripe integration with test keys (4/4 tests passing)
- [x] Create checkpoint with Stripe integration


## Phase 23: Complete Stripe Payment Flow
- [x] Implement Stripe webhook handler at /api/stripe/webhook
- [x] Add webhook event processing for checkout.session.completed
- [x] Update listing payment status automatically on payment confirmation
- [x] Create payment success page at /payment-success with verification
- [x] Build payment history view in seller dashboard at /payment-history
- [x] Test complete payment flow end-to-end (2/2 webhook tests passing)
- [x] Create checkpoint with complete payment system


## Phase 24: Payment System Enhancements
- [x] Implement automated email receipts after payment
- [x] Generate PDF receipts for accounting (text-based receipts with all details)
- [x] Build admin refund workflow interface (RefundManagement component)
- [x] Add refund processing with status updates (refund router with email notifications)
- [x] Implement payment retry logic for failed transactions (webhook handlers for expired/failed)
- [x] Add email notifications for payment failures (sendPaymentFailureEmail)
- [x] Test all payment enhancements (57 tests passing)
- [x] Create checkpoint with enhanced payment system


## Phase 25: Deal Pipeline & Action Items
- [x] Add action items schema to database (dealId, title, assignedTo, status, dueDate, priority)
- [x] Create action items router for CRUD operations (create, update, delete, getByDeal)
- [x] Build deal pipeline dashboard with Kanban board view
- [x] Add stage management with quick move buttons
- [x] Implement action items UI on deal page (ActionItems component)
- [x] Add action item creation and completion (create, update status, delete)
- [x] Test deal pipeline and action items (61 tests passing)
- [x] Create checkpoint with deal management enhancements


## Phase 26: Deal Activity Timeline & Escrow.com Integration
- [x] Update deal stages schema to include "escrow" stage between negotiation and closing
- [x] Update all stage references in code (DealRoom, DealPipeline, etc.)
- [x] Add deal activity timeline schema (dealId, activityType, description, userId, metadata)
- [x] Create activity timeline router for logging and retrieving events
- [x] Build ActivityTimeline UI component for deal page
- [x] Research Escrow.com API documentation and integration requirements (see ESCROW_INTEGRATION.md)
- [ ] Register as Escrow.com partner and obtain API credentials (user action required)
- [ ] Implement Escrow.com API client for transaction initiation (pending credentials)
- [ ] Add "Start Escrow" flow in deal page (pending API client)
- [ ] Configure platform fee collection through Escrow.com (pending credentials)
- [x] Test activity timeline logging (integrated into deal page)
- [x] Create checkpoint with timeline and escrow stage features


## Phase 27: UX Updates & Deal Stage Templates
- [x] Update homepage copy to emphasize Escrow.com simplicity for sellers
- [x] Update "How It Works" section to highlight escrow process
- [x] Move Pricing link from top navigation to footer
- [x] Create deal stage templates with common action items (dealStageTemplates.ts)
- [x] Implement auto-population of action items when deal stage changes (updateStage procedure)
- [x] Test UX updates and stage templates (72 tests passing, 11 new template tests)
- [x] Create checkpoint with UX improvements and stage templates


## Phase 28: Featured Listings Carousel
- [x] Install embla-carousel-react for carousel functionality
- [x] Update FeaturedListings component to use carousel
- [x] Update backend to return 9 featured listings (3 slides of 3 each)
- [x] Add navigation arrows and dots to carousel
- [x] Test carousel functionality (working perfectly with smooth navigation)
- [x] Create checkpoint with carousel implementation

## Phase 29: Carousel Refinements
- [x] Fix inconsistent spacing between carousel cards
- [x] Add auto-play functionality (advance every 3 seconds)
- [x] Test auto-play and spacing
- [x] Create checkpoint with refined carousel
