# BUILD-LOG.md

---

## Step 1 — Saved Search Notifications
**Status:** REVIEWED — cleared by Richard. Awaiting Project Owner go-ahead to deploy.
**Date:** 2026-04-04

### Files Changed
- `server/db.ts` — added `getAllSavedSearches`, `markNotificationEmailSent`
- `server/emailNotifications.ts` — added `sendNewListingMatchEmail`
- `server/lib/savedSearchMatcher.ts` — created (new file)
- `server/stripe/webhook.ts` — wired trigger after payment publish
- `server/routers.ts` — wired trigger after standard-tier listing creation

### Key Decisions
- No new DB tables or migrations — used existing `notifications` and `savedSearches` tables
- Added `markNotificationEmailSent` as a targeted helper (no generic `updateNotification` existed)
- Event-driven trigger at both publish points (Stripe webhook + standard-tier creation)
- All triggers are fire-and-forget — errors logged, never propagate to user-facing response
- Location matching: JSON.parse first, comma-split fallback; null/empty locations matches all

### Known Gaps
- No digest/batching — buyers get one email per matching listing (by design, per Arch decision)
- Saved search criteria limited to revenue, EBITDA, location — schema has no additional fields
- No UI for managing notification preferences beyond the existing `emailAlerts` toggle on saved searches
