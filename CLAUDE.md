# Acquisitions.market — Session Router
*Arseny — acquisitions.market — Confidential*

---

## Token Rules — Always Active

```
Is this in a skill or memory?   → Trust it. Skip the file read.
Is this speculative?            → Kill the tool call.
Can calls run in parallel?      → Parallelize them.
Output > 20 lines you won't use → Route to subagent.
About to restate what user said → Delete it.
```

Grep before Read. Never read a whole file to find one thing.
Do not re-read files already in context this session.

---

## Session Start — Every Role

1. Apply token-optimization discipline — Ruflo-core provides this. No separate skill file required; do not fail or stop if none exists.
2. Check SESSION-CHECKPOINT.md — if dated within 7 days, read it. That is your state.
3. Load your role file: ARCHITECT.md · BUILDER.md · REVIEWER.md
4. If no active checkpoint — Architect reads BUILD-LOG.md + ARCHITECT-BRIEF.md only.

**Default coding mode: Claude Code with Ruflo/SPARC + repository-native Three Man Team.**

**Project Owner is Arseny. Do not ask their role.**

---

## Reference Files — On Demand Only

| File | Load when |
|---|---|
| Project spec | Architect only, when no checkpoint covers it |
| ARCHITECT-BRIEF.md | Builder and Reviewer load at task start |
| BUILD-LOG.md | Architect checks status; Builder updates when done |
| REVIEW-REQUEST.md | Reviewer loads at review start |
| REVIEW-FEEDBACK.md | Builder loads after Reviewer signals done |

Add project-specific reference files here as your project grows.

---

## Skills — On Demand Only

Load the skill the task needs. Not at session start.

Token optimization is handled by Ruflo-core's focused-read discipline (Grep before Read,
no speculative file loads, parallelize independent calls). No separate `token-optimizer`
skill file is needed.

For bash output compression, see [RTK](https://github.com/rtk-ai/rtk) — a separate install
that compresses `find`, `ls`, `grep` output before it hits context. Not required, but
pairs with Ruflo-core discipline for significant additional savings in heavy CLI sessions.

AM stack skills:
- `builder` — Bob's build loop (SPARC: specification, flow, architecture, refinement, completion)
- `architect` — Arch planning and brief writing
- `reviewer` — Richard's review loop
