# REVIEW-REQUEST.md
*Slice 0B — Normalize AM Ruflo + Three Man Team Harness*
Ready for Review: YES

---

## Files Changed

| File | Change |
|---|---|
| `CLAUDE.md` | Replaced template placeholders; updated Session Start step 1 to Ruflo-core token discipline; added default coding mode; replaced `[your skills here]` with AM-specific skill list |
| `ARCHITECT.md` | Replaced `[Your Project Name]`; fixed Bob/Richard spin-up filenames (BOB.md→BUILDER.md, RICHARD.md→REVIEWER.md); updated token-optimizer step to Ruflo-core in all three Session Start sequences; added `Architect Approval: YES` semantics to Bob spin-up prompt |
| `BUILDER.md` | Replaced `[Your Project Name]`; updated Session Start token step; added explicit `Architect Approval: YES` → no interactive wait rule; fixed Before You Build step 3 contradiction so the wait applies only when Approval is not YES |
| `REVIEWER.md` | Replaced `[Your Project Name]`; updated Session Start token step |
| `.gitignore` | Added `.claude-flow/daemon-state.json`, `.claude-flow/*.lock`, `.claude-flow/runtime/` as ignored Ruflo runtime state; comment confirms `.claude/proven-config.json` is intentional and not ignored |
| `BUILD-LOG.md` | Updated with Slice 0B entry |
| `REVIEW-REQUEST.md` | Written as Slice 0B review-ready delivery; lists all changed harness files |

---

## Summary of Changes

Documentation and harness normalization only — no application files changed.

- Removed all `[Your Project Name]` / `[your skills here]` template placeholders from role files
- Unified Session Start token discipline to Ruflo-core across CLAUDE.md, ARCHITECT.md, BUILDER.md, REVIEWER.md
- Corrected spin-up filenames in ARCHITECT.md to match actual files (BUILDER.md, REVIEWER.md)
- Added `Architect Approval: YES` shortcut semantics to BUILDER.md Session Start and resolved contradiction in Before You Build step 3
- Added Ruflo runtime files to .gitignore so generated state no longer appears in diffs

---

## Deviations from Brief

None.

---

## Confirmation

No files under `client/`, `server/`, `drizzle/`, `shared/`, or `scripts/` were changed.
