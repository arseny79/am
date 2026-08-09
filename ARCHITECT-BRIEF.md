# ARCHITECT-BRIEF — Slice 0B: Normalize AM Ruflo + Three Man Team Harness

Date: 2026-08-09
Architect Approval: YES
Branch: `am-igaming-crypto-mvp`
Master plan: `.hermes/plans/2026-08-09_133000-am-igaming-crypto-mvp-cc-build-plan.md`

## Role and method

You are Bob, Builder in AM's repository-native Three Man Team.

- Ruflo core is installed and enabled. Use Ruflo/SPARC discipline: specification, flow understanding, architecture fit, refinement and completion.
- Read `CLAUDE.md`, `BUILDER.md`, this brief, `BUILD-LOG.md` and `SESSION-CHECKPOINT.md`.
- `Architect Approval: YES` means you may complete this slice without waiting interactively for Arch.
- Build only this slice.

## Goal

Make the repository-native Three Man Team handoff files internally consistent and specific to Acquisitions.market before application development starts.

## Scope — do only this

Modify only:
- `CLAUDE.md`
- `ARCHITECT.md`
- `BUILDER.md`
- `REVIEWER.md`
- `.gitignore` only if needed to ignore generated Ruflo runtime state
- `BUILD-LOG.md`
- `REVIEW-REQUEST.md`

Requirements:
1. Replace all `[Project Name]`, `[Your Project Name]`, `[Your Name]`, `[your-domain.com]` and similar template placeholders with:
   - Project: Acquisitions.market / AM
   - Owner: Arseny
   - Domain: acquisitions.market
2. Fix role-file references so they use the files that actually exist:
   - `BUILDER.md`, not `BOB.md`
   - `REVIEWER.md`, not `RICHARD.md`
3. State that the default coding mode is Claude Code with Ruflo/SPARC plus Three Man Team.
4. Clarify token optimisation:
   - use Ruflo-core's token optimisation and focused-read discipline
   - do not fail or stop if no separate `token-optimizer` skill file exists
5. In `BUILDER.md`, state that `Architect Approval: YES` means Bob may build the approved slice after writing a concise Builder Plan; no interactive wait is required.
6. Keep the roles Arch, Bob and Richard and preserve their existing responsibilities.
7. Add generated `.claude-flow/daemon-state.json` and comparable runtime-only Ruflo state to `.gitignore` only if this does not ignore intentional project configuration such as `.claude/proven-config.json`.
8. Add a concise BUILD-LOG entry for Slice 0B.
9. Write `REVIEW-REQUEST.md` with `Ready for Review: YES`, exact changed files and confirmation that no application files changed.

## Protected areas

Do not modify:
- any file under `client/`, `server/`, `drizzle/`, `shared/` or `scripts/`
- package files
- production/deployment config
- `.claude/proven-config.json`
- the master implementation plan

Do not commit, push or deploy.

## Verification

Run/read-only checks:
- `git diff --name-only`
- search the four role/router files for unresolved square-bracket placeholders
- confirm every referenced role/handoff filename exists
- confirm no application file changed

## Completion report

Report:
- exact files changed
- placeholders removed
- filename references corrected
- whether `.gitignore` changed and why
- verification result
- path to `REVIEW-REQUEST.md`
