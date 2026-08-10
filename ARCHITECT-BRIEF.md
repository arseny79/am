# ARCHITECT-BRIEF — Slice 3C: Admin Approve / Request-Info / Reject / Publish Flow

Date: 2026-08-10
Architect Approval: YES
Branch: `am-igaming-crypto-mvp`
Master plan: `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`
Baseline checkpoint: `32242d0`

## Role and method

You are Bob, Builder in AM's Three Man Team.

- Ruflo-core is enabled. Apply Ruflo/SPARC discipline.
- Read `BUILDER.md`, this brief and `SESSION-CHECKPOINT.md` first.
- Add a concise Builder Plan to this brief, then build immediately because Architect Approval is YES.
- Build only this slice.

## Goal

Complete the admin moderation workflow for seller applications:
- request more information
- approve
- reject
- publish

This slice should use the moderation foundation from 3A and the seller-application flow from 3B. Publication must remain gated behind approval.

## Allowed application files

1. `client/src/pages/admin/tabs/ListingsTab.tsx`
2. `server/routers/adminListingRouter.ts`
3. notification/email helpers only where already configured and already used in the repo
4. one targeted test under `server/` if useful

Plus handoff docs only:
- `ARCHITECT-BRIEF.md`
- `BUILD-LOG.md`
- `REVIEW-REQUEST.md`

## Requirements

### 1. Admin moderation actions

In `server/routers/adminListingRouter.ts`:

Add explicit admin mutations for:
- request more information
- approve
- reject
- publish

Rules:
- only approved listings can be published
- request-more-info must set moderation state to `needs_information`
- reject must set moderation state to `rejected`
- approve must set moderation state to `approved`
- all moderation actions must set `reviewedAt`, `reviewedBy`
- internal notes / rejection reason must stay admin-only in read paths
- do not blur moderation state with listing lifecycle status unless the action truly requires it

For publication:
- publishing should set `isPublished = 1`
- published application should become operationally visible with the correct listing lifecycle state
- if a clear default is needed, publishing may set `status = 'active'`
- publishing must refuse when moderation state is not `approved`

### 2. Audit trail

Use existing audit primitives already present in the repo.

For each moderation/publish action:
- write an admin audit record
- include listing id, action type and concise details

Do not build a brand-new audit subsystem.

### 3. Seller notification

On moderation changes:
- seller must receive an in-app notification even if email is not configured
- if there is already a configured email helper that fits cleanly, use it narrowly
- do not block the action on email availability

### 4. Admin UI

In `client/src/pages/admin/tabs/ListingsTab.tsx`:
- add action controls for request-info / approve / reject / publish
- require rejection reason when rejecting
- allow review notes / request-info note capture where appropriate
- keep the existing tier-management UI working
- keep the UI narrow and practical; do not redesign the page into a huge workflow console

### 5. Safety rules

- seller cannot approve or publish their own listing through any path introduced here
- rejected/internal notes must not appear in public or seller-facing listing responses
- do not weaken any KYC, NDA, deal-room, access-request or payment gate
- no package installs

## Protected areas

Do not modify:
- Create Listing flow
- buyer mandate pages
- public marketplace pages except what is strictly implied by publish flipping existing listing visibility
- listingFieldValues or taxonomy logic
- unrelated admin tabs

Do not commit, push or deploy.

## Verification

Run:
- `pnpm run check`
- `pnpm run build`
- `git diff --check`
- targeted proof that:
  - publish is blocked unless moderation state is `approved`
  - reject requires a reason if you implement it that way
  - seller notifications fire without depending on email
  - moderation actions leave an audit trail
- scope guard proving only allowed files and handoff docs changed

## Acceptance criteria

- admin can request more information, approve, reject and publish
- only approved listings can publish
- seller receives an in-app notification for moderation outcomes
- all transitions leave an audit trail
- existing tier-management UI still works
- no public or seller-facing leakage of internal notes/rejection reason
- typecheck and production build pass

## Completion handoff

- Append Slice 3C to `BUILD-LOG.md` with exact verification.
- Replace `REVIEW-REQUEST.md` with changed files, behavior, verification and any open question.
- Set `Ready for Review: YES`.
