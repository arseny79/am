# Hybrid Deal Workflow Design

## Overview
This document outlines the hybrid deal progression system that combines smart workflow automation with flexible milestone tracking. The goal is to maintain structure while allowing fast-moving deals to skip stages when appropriate.

## Current Deal Stages
```
initial_contact → nda_signed → due_diligence → negotiation → escrow → closing → closed/cancelled
```

## Design Principles

### 1. Smart Stage Progression (Automated)
The system automatically advances deals through stages based on concrete actions:
- **initial_contact → nda_signed**: When buyer signs NDA
- **nda_signed → due_diligence**: When first document is uploaded
- **Manual progression** for remaining stages (requires explicit user action)

### 2. Flexible Milestones (Independent Tracking)
Key milestones are tracked independently of stages and can be completed in any order:
- NDA signed
- Financials reviewed
- Offer submitted
- Letter of Intent (LOI) signed
- Final agreement signed
- Escrow funded
- Assets transferred

### 3. Quick Actions (Fast-Track Paths)
Special buttons allow buyers/sellers to skip stages when appropriate:
- **"Accept Asking Price"**: Buyer accepts seller's price → skip negotiation stage
- **"Skip to Escrow"**: Both parties agree → jump directly to escrow
- **"Request Stage Change"**: Either party can request to advance/skip stages

### 4. Conditional Paths
The workflow adapts based on buyer decisions:
- If buyer accepts asking price → skip negotiation → go to LOI/escrow
- If buyer wants to negotiate → follow standard path
- If deal stalls → allow manual stage regression

## Database Schema Changes

### Add Milestones Table
```typescript
export const dealMilestones = mysqlTable("dealMilestones", {
  id: int("id").autoincrement().primaryKey(),
  dealId: int("dealId").notNull(),
  milestoneType: mysqlEnum("milestoneType", [
    "nda_signed",
    "financials_reviewed",
    "offer_submitted",
    "loi_signed",
    "final_agreement_signed",
    "escrow_funded",
    "assets_transferred"
  ]).notNull(),
  completedAt: timestamp("completedAt"),
  completedBy: int("completedBy"), // userId
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
```

### Add Quick Actions to Deals Table
```typescript
// Add to deals table:
acceptedAskingPrice: boolean("acceptedAskingPrice").default(false),
skipNegotiation: boolean("skipNegotiation").default(false),
stageSkipReason: text("stageSkipReason"),
```

## UI Components

### 1. DealWorkflowGuide Enhancement
Add quick action buttons to stage-specific action cards:
- **Initial Contact stage**: "Accept Asking Price" button (buyer only)
- **Negotiation stage**: "Skip to LOI" button (both parties must agree)
- **Any stage**: "Request Stage Change" button

### 2. Milestone Tracker Component
New component showing independent milestone progress:
```
✓ NDA Signed (completed 2 days ago)
✓ Financials Reviewed (completed 1 day ago)
○ Offer Submitted (pending)
○ LOI Signed (pending)
○ Final Agreement Signed (pending)
○ Escrow Funded (pending)
○ Assets Transferred (pending)
```

### 3. Stage Skip Confirmation Dialog
When user clicks quick action button, show confirmation:
- Explain what will happen
- Show which stages will be skipped
- Require both parties to agree (for bilateral actions)
- Log the skip reason in deal activity

## Backend Logic

### Stage Progression Rules
```typescript
// Allow stage skipping if:
1. User is authorized (buyer/seller/admin)
2. Quick action flag is set (acceptedAskingPrice, skipNegotiation)
3. Required milestones are completed
4. Both parties agree (for bilateral skips)

// Prevent stage regression unless:
1. User is admin
2. Deal is in "stalled" status
3. Both parties agree to restart
```

### Milestone Completion
```typescript
// Automatically mark milestones when:
- NDA signed → mark "nda_signed" milestone
- Document uploaded → mark "financials_reviewed" if financial doc
- Offer submitted → mark "offer_submitted"
- LOI uploaded → mark "loi_signed"
- Escrow payment confirmed → mark "escrow_funded"
```

## Implementation Plan

### Phase 1: Database Schema
- Add dealMilestones table
- Add quick action fields to deals table
- Push migration

### Phase 2: Backend Logic
- Create milestone tracking procedures
- Add stage skip validation logic
- Update stage progression to check milestones
- Add quick action handlers

### Phase 3: Frontend Components
- Build MilestoneTracker component
- Add quick action buttons to DealWorkflowGuide
- Create stage skip confirmation dialog
- Update deal room to show milestones

### Phase 4: Testing
- Test "Accept Asking Price" flow
- Test milestone tracking
- Test stage skipping validation
- Test with sample deal (210001)

## Benefits

1. **Flexibility**: Deals can move at their own pace
2. **Structure**: Core milestones ensure nothing is missed
3. **Speed**: Quick actions eliminate unnecessary stages
4. **Transparency**: Activity log shows all skips and reasons
5. **Control**: Admin can override any stage progression
6. **User Experience**: Buyers/sellers see clear progress without rigid constraints

## Example Scenarios

### Scenario 1: Fast-Track Deal
1. Buyer views listing ($500k asking price)
2. Buyer clicks "Accept Asking Price" in deal room
3. System skips negotiation stage → goes to LOI
4. Both parties sign LOI → advance to escrow
5. Milestones tracked: NDA signed, Offer submitted, LOI signed

### Scenario 2: Standard Negotiation
1. Buyer views listing ($500k asking price)
2. Buyer makes offer ($450k) → enters negotiation stage
3. Parties negotiate → agree on $475k
4. Advance to LOI → escrow → closing
5. All stages followed in order

### Scenario 3: Stalled Deal
1. Deal stuck in due_diligence for 30 days
2. Admin can regress stage to nda_signed
3. Or mark deal as "stalled" status
4. Parties can restart negotiation

## Next Steps
1. Implement database schema changes
2. Build backend milestone tracking
3. Add quick action buttons to UI
4. Test complete workflow scenarios
