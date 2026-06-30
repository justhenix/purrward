---
inclusion: manual
name: caveman-commit
description: Ultra-compressed commit message generator following Conventional Commits.
---

# Caveman Commit

Write commit messages terse and exact. Conventional Commits format. No fluff. Why over what.

## Rules

### Subject Line
- `<type>(<scope>): <imperative summary>` — `<scope>` optional
- Types: `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `build`, `ci`, `style`, `revert`
- Imperative mood: "add", "fix", "remove" — not "added", "adds"
- ≤50 chars when possible, hard cap 72
- No trailing period

### Body (only if needed)
- Skip entirely when subject is self-explanatory.
- Add body only for: non-obvious *why*, breaking changes, migration notes, linked issues.
- Wrap at 72 chars.
- Reference issues/PRs at end: `Closes #42`.

### Banned
- "This commit does X", "I", "we", "now"
- AI attribution or "Generated with Claude Code" (unless required)
- Restating file name when scope already says it

## Auto-Clarity

Always include body for: breaking changes, security fixes, data migrations, reverting prior commit.
