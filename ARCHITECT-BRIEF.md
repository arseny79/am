# ARCHITECT-BRIEF.md — Phase 2: Dynamic Listing Forms

## Context
AM Phase 1 is live on Railway: digital-asset taxonomy, crypto categories, wallet verification, and admin taxonomy controls are deployed. Phase 2 starts the move from a hardcoded MSP listing form toward an admin-configurable digital-assets marketplace engine.

## Business Goal
Let AM support different asset types without rebuilding forms each time. Admin should be able to define fields for each asset type, and sellers should see the right form for the selected asset type.

## Critical Constraint
Do NOT break existing listings, MSP flows, deal rooms, NDA/KYC, Stripe, or current create/edit listing flows. Phase 2 must be additive and backward compatible.

## Phase 2 Scope

### 1. Schema foundation
Add additive tables:
- `field_definitions`
  - belongs to optional vertical / asset type / subcategory
  - field key, label, description/help text
  - field type
  - required/optional
  - options for dropdown/multi-select/radio
  - sort order
  - visibility/display flags: public, show on listing card, filterable, sortable, active
- `listing_field_values`
  - listing ID
  - field definition ID
  - stored value (JSON/text)

### 2. Server/API foundation
Add safe admin and seller routes:
- Admin can list/create/update/deactivate field definitions.
- Seller create/edit listing can save dynamic field values.
- Listing detail can load dynamic field values.

### 3. Admin UI foundation
Add a first simple admin tab/page for “Listing Fields”:
- choose asset type
- add/edit field label/type/required/options/sort order
- deactivate fields instead of hard delete

### 4. Seller UI foundation
In create/edit listing:
- after seller selects asset type, load relevant dynamic fields
- render a basic input for the supported field types
- save those values with the listing
- keep all existing hardcoded fields working

## Field Types for First Build
Keep it practical. Support these first:
- text
- textarea
- number
- currency
- percentage
- url
- dropdown
- multi_select
- boolean
- date
- wallet_address
- contract_address

Do not build every future field type yet.

## What NOT to Do
- Do not remove current MSP fields.
- Do not redesign the whole listing form.
- Do not touch payment, NDA, KYC, escrow, or auth systems.
- Do not make a big marketplace-engine rewrite.
- Do not deploy or run production migrations yourself.
- Do not commit.

## Verification
Before reporting done, run:
- `pnpm run check`
- `pnpm run build`

## Build Style
Use Ruflo/SPARC discipline: small implementation, preserve existing flows, verify, report exact changes. If Three Man Worker / builder role is available, act as Builder. Hermes will review and deploy later.
