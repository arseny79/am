# REVIEW-REQUEST.md
*Step 1 — Saved Search Notifications*
Ready for Review: YES (re-submit after Richard's Should Fix items)

---

## Files Changed

| File | Lines | Change |
|---|---|---|
| `server/db.ts` | ~435–445, ~614–624 | Added `getAllSavedSearches()` and `markNotificationEmailSent(id)` |
| `server/emailNotifications.ts` | L1–3 (import), L192–237 (function) | Added `escapeHtml` import; added `sendNewListingMatchEmail()` |
| `server/lib/savedSearchMatcher.ts` | 1–87 | New file — `notifyMatchingSavedSearches(listingId)` + `matchesSearch()` |
| `server/stripe/webhook.ts` | L10 (import), ~L212–214 (trigger) | Imported matcher; fire-and-forget call after listing publish |
| `server/routers.ts` | L63 (import), ~L263–268 (trigger) | Imported matcher; fire-and-forget call after standard-tier listing creation |

---

## Summary of Changes

- **`getAllSavedSearches`**: returns all rows from `savedSearches` table with no filter — used by the matcher to fan out to all buyers
- **`markNotificationEmailSent`**: sets `emailSent=1` on a notification row after email delivery confirmed; no `updateNotification` existed, this is a targeted helper
- **`sendNewListingMatchEmail`**: SendGrid email to buyer with listing name, revenue, EBITDA, and link to listing; all user-provided strings escaped with `escapeHtml`
- **`savedSearchMatcher.ts`**: main logic — loads listing, bails if not active/published, loads all saved searches, matches on revenue/EBITDA/location bounds, creates in-app notification then sends email per buyer if `emailAlerts=1`; per-buyer errors caught and logged
- **Webhook trigger**: fires after `status: active, isPublished: 1` update in Stripe checkout session handler; fire-and-forget with `.catch()`
- **Router trigger**: fires after `createListing()` returns when `listingTier === "standard"`; fire-and-forget with `.catch()`

---

## Deviations from Brief

None.

---

## Open Questions for Richard

1. `users.name` is nullable in the schema. The matcher falls back to `buyer.email` if name is null — confirm this is acceptable in the email greeting.
2. `savedSearches.locations` is stored as free-text. The matcher attempts `JSON.parse` first, then falls back to comma-split. If the format is always JSON (set by the tRPC router), the comma-split fallback is dead code. Worth confirming the actual stored format.
