# ARCHITECT-BRIEF.md
*Step 1 — Saved Search Notifications*

---

## Context

When a listing publishes, match it against all saved searches and notify matching buyers via in-app notification + email (if emailAlerts=1).

Existing infrastructure to use:
- `savedSearches` table: buyerId, minRevenue, maxRevenue, minEbitda, maxEbitda, locations (text), emailAlerts (tinyint)
- `notifications` table + `createNotification()` in db.ts
- `emailNotifications.ts` — SendGrid pattern to follow
- `sendEmail()` in `server/lib/emailService.ts`
- Two publish trigger points (see Wiring below)

---

## Step 1 — What to Build

### 1. Matching library: `server/lib/savedSearchMatcher.ts`

Export one function:
```ts
export async function notifyMatchingSavedSearches(listingId: number): Promise<void>
```

Logic:
1. Load the listing by ID. If not found or not active/published, return early.
2. Load all saved searches from DB — add a new db.ts function `getAllSavedSearches()` that returns all rows.
3. For each saved search, check if listing matches:
   - `minRevenue`: listing.annualRevenue >= minRevenue (if set)
   - `maxRevenue`: listing.annualRevenue <= maxRevenue (if set)
   - `minEbitda`: listing.ebitda >= minEbitda (if set)
   - `maxEbitda`: listing.ebitda <= maxEbitda (if set)
   - `locations`: if savedSearch.locations is set, parse as JSON array of strings; match if listing.location is included (case-insensitive). If locations is null/empty, it matches any location.
4. For each match:
   - Load the buyer user record (`getUserById`)
   - Create in-app notification: type=`'new_listing_match'`, title=`'New listing matches your search'`, message=`'"${listing.businessName}" matches your saved search "${search.name}"'`, relatedEntityType=`'listing'`, relatedEntityId=listingId, userId=search.buyerId, isRead=0, emailSent=0
   - If `search.emailAlerts === 1` and buyer has an email: send email via `sendNewListingMatchEmail` (see below), then update the notification's emailSent=1
5. Log errors per-buyer without throwing — one bad email must not block others.

### 2. Email function: add to `server/emailNotifications.ts`

```ts
export async function sendNewListingMatchEmail(params: {
  buyerEmail: string;
  buyerName: string;
  listingName: string;
  listingId: number;
  searchName: string;
  annualRevenue: number | null;
  ebitda: number | null;
}): Promise<boolean>
```

Follow exact same pattern as existing functions in that file. Link to `${FRONTEND_URL}/marketplace/${params.listingId}`.

### 3. New db.ts function

```ts
export async function getAllSavedSearches(): Promise<SavedSearch[]>
```

Simple select all from savedSearches. No filters.

### 4. Wire the trigger — two points

**Point A: `server/stripe/webhook.ts`**
After the block that sets `status: 'active', isPublished: 1` (around line 206), add:
```ts
import { notifyMatchingSavedSearches } from '../lib/savedSearchMatcher';
// fire-and-forget, do not await in webhook response path
notifyMatchingSavedSearches(parseInt(listingId)).catch(err =>
  console.error('[SavedSearch] Notification error:', err)
);
```

**Point B: `server/routers.ts`**
After the standard-tier listing creation sets `status: 'active'` (line ~257), fire the same call using the new listing's ID.

---

## Constraints

- Do not add new DB tables or migrations.
- Do not modify `savedSearches` schema — match on existing fields only.
- The email template must use `escapeHtml` from `emailService.ts` for any user-provided strings rendered in HTML.
- `notifyMatchingSavedSearches` must never throw — wrap top-level in try/catch and log.
- Do not add this to the scheduler — event-driven only.
- `emailSent` update: after sending the email, call `db.updateNotification` if it exists, or use a direct DB update. Flag: **check if `updateNotification` exists in db.ts before writing — do not assume**.

---

## Files to Create/Modify

| File | Action |
|---|---|
| `server/lib/savedSearchMatcher.ts` | Create |
| `server/emailNotifications.ts` | Add `sendNewListingMatchEmail` |
| `server/db.ts` | Add `getAllSavedSearches` |
| `server/stripe/webhook.ts` | Wire trigger |
| `server/routers.ts` | Wire trigger |

---

## Review Request

When done, write `REVIEW-REQUEST.md` listing every file changed and any deviations from this brief.
