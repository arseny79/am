# REVIEW-REQUEST — Slice 3C: Admin Approve / Request-Info / Reject / Publish Flow

Ready for Review: YES
Date: 2026-08-10
Builder: Bob (Claude Code) + Arch finish after usage-limit stop
Branch: am-igaming-crypto-mvp
Baseline: 32242d0

---

## Changed Files

### `server/routers/adminListingRouter.ts`
Added the moderation action mutations and reused existing repo primitives for notifications and audit logging:

- `requestMoreInfo({ listingId, notes })`
  - requires seller note
  - sets `moderationStatus = 'needs_information'`
  - sets `reviewedAt`, `reviewedBy`
  - clears `rejectionReason`
  - forces `isPublished = 0`
  - writes `adminAuditLogs`
  - creates seller in-app notification

- `approve({ listingId, notes? })`
  - sets `moderationStatus = 'approved'`
  - sets `reviewedAt`, `reviewedBy`
  - stores optional `reviewNotes`
  - clears `rejectionReason`
  - writes `adminAuditLogs`
  - creates seller in-app notification

- `reject({ listingId, reason })`
  - requires rejection reason
  - sets `moderationStatus = 'rejected'`
  - sets `reviewedAt`, `reviewedBy`
  - stores `rejectionReason`
  - clears `reviewNotes`
  - forces `isPublished = 0`
  - writes `adminAuditLogs`
  - creates seller in-app notification

- `publish({ listingId })`
  - hard-blocks unless `moderationStatus === 'approved'`
  - sets `isPublished = 1`
  - sets lifecycle `status = 'active'`
  - writes `adminAuditLogs`
  - creates seller in-app notification

Also added two small internal helpers:
- `logListingAdminAction(...)`
- `notifyListingSeller(...)`

### `client/src/pages/admin/tabs/ListingsTab.tsx`
Added the narrow admin moderation UI:
- moderation action dialog state and note/reason state
- mutation wiring for request-info / approve / reject / publish
- inline action buttons in the table
- request-info and reject enforce seller note / rejection reason before submit
- publish button only appears for approved + unpublished listings
- existing tier-management dialog remains intact
- fixed the 5-card stats grid to `grid-cols-2 md:grid-cols-5`

### `BUILD-LOG.md`
Updated to reflect the corrected final 3C slice.

---

## Behavior

- admin can request more information, approve, reject and publish
- only approved listings can publish
- seller receives an in-app notification for moderation outcomes and publication
- moderation and publish transitions leave an audit trail
- internal notes / rejection reason remain admin-surface-only
- existing tier-management flow remains intact

---

## Verification

- `pnpm run check` — PASS
- `pnpm run build` — PASS (pre-existing chunk warning only)
- `git diff --check` — PASS
- scope guard — changed application files only:
  - `server/routers/adminListingRouter.ts`
  - `client/src/pages/admin/tabs/ListingsTab.tsx`
  - plus handoff docs only

---

## Open Questions

None. Claude Code hit its usage cap on this slice, but the final corrected diff now includes the complete moderation actions, notifications and audit logging for review.
