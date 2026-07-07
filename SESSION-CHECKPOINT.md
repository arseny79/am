# SESSION-CHECKPOINT.md
Date: 2026-04-04

---

## Current State

**Step 1 — Saved Search Notifications**
Status: BUILT + REVIEWED — awaiting deploy go-ahead from Project Owner

Richard has cleared the step. No Must Fix items remain. One open product decision (see below).

---

## What Was Built

When a listing publishes, buyers whose saved searches match are notified via in-app notification and email (if emailAlerts=1).

### Files Changed
| File | Change |
|---|---|
| `server/db.ts` | Added `getAllSavedSearches()`, `markNotificationEmailSent(id)` |
| `server/emailNotifications.ts` | Added `sendNewListingMatchEmail()` + `escapeHtml` import |
| `server/lib/savedSearchMatcher.ts` | New — core matching + dispatch logic |
| `server/stripe/webhook.ts` | Trigger wired after payment publish |
| `server/routers.ts` | Trigger wired after standard-tier listing creation |

### Match criteria (existing schema only)
- minRevenue / maxRevenue → listing.annualRevenue
- minEbitda / maxEbitda → listing.ebitda
- locations (JSON array, case-insensitive substring match) → listing.location
- null criteria = match all

### Trigger points
- Stripe webhook: after `status: active, isPublished: 1` set on payment success
- routers.ts: after `createListing()` when `listingTier === "standard"`
- Both: fire-and-forget, errors logged, never propagate to user

---

## Open Decision (Escalated to Arch)

**Deduplication:** If a buyer has multiple saved searches matching the same listing, they receive multiple in-app notifications and emails — one per matched search. Current behavior is intentional per-search design. Arch recommendation: leave as-is until user feedback warrants it.

**Project Owner needs to confirm:** accept this behavior, or deduplicate per buyer per listing before deploy?

---

## Next Action

1. Project Owner confirms dedup decision
2. Arch gives go-ahead
3. Commit + deploy
4. Update BUILD-LOG.md — step complete
