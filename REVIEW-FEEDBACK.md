# Review Feedback — Step 1
Date: 2026-04-04
Ready for Builder: YES (re-review of Should Fix items — both resolved)

---

## Must Fix

None.

---

## Should Fix

**1. `server/lib/savedSearchMatcher.ts` L72 — JSON.parse result not validated as array**

`locationList = JSON.parse(search.locations)` assumes the result is a `string[]`. If the stored value parses to a non-array (string, object, number), calling `.some()` on it throws a TypeError. The per-buyer try/catch will catch it — but silently: that buyer gets no notification. The match is skipped without any indication of why.

Fix: add an `Array.isArray` guard after parse.

```ts
locationList = JSON.parse(search.locations);
if (!Array.isArray(locationList)) {
  locationList = [];
}
```

**2. `server/lib/savedSearchMatcher.ts` L43–44 — Type inconsistency on annualRevenue / ebitda**

Line 43: `annualRevenue: listing.annualRevenue ?? null` — the `?? null` implies Bob believes these fields may be null at runtime. But `matchesSearch()` signature (L61) declares them as `number` (non-null). If the Drizzle-inferred type is nullable, the comparisons on L64–67 receive null silently — JS will coerce and produce wrong match results (`null < 5000` evaluates to `true`). If the type is genuinely non-null, `?? null` is dead code and should be removed to avoid confusion.

Fix: check the inferred type of `getListingById`. If nullable — add null guards in `matchesSearch` and update the signature. If non-null — remove the `?? null` on L43–44 and the nullable union from `sendNewListingMatchEmail` params.

---

## Escalate to Architect

**Deduplication: multiple matches per buyer**

If a buyer has two saved searches that both match the same listing, they receive two in-app notifications and two emails. The code is correct per the brief (per-search, not per-buyer-per-listing), but the brief does not address this case. At low saved-search volume this is harmless. At higher volume it looks like a bug to the buyer.

Decision needed: deduplicate notifications and emails per buyer per listing (one notification regardless of how many searches matched), or keep per-search behavior and accept duplicates?

---

## Cleared

All five files reviewed. Spec compliance confirmed — no drift, no added scope. Security patterns followed: `escapeHtml` applied to all user-provided strings in HTML output; email subject correctly uses raw string (plain text, not HTML rendered). Fire-and-forget triggers placed correctly at both publish points. `db.ts` additions follow established project patterns. `markNotificationEmailSent` correctly modeled after existing `markNotificationAsRead`. The two open questions Bob raised (nullable name fallback, locations format) are acceptable as-is for this step.
