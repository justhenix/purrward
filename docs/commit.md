# Conventional Commits

Use this format for every commit:

```text
type(scope): short summary
```

## Core Rules

- Lowercase `type`.
- `scope` optional, but use it when change belongs to clear area.
- Summary in imperative mood.
- Keep summary under 50 chars if possible.
- No trailing period.
- Body optional, but add it when change is not obvious.
- Footer optional, but use it for breaking changes and issue refs.

## Allowed Types

- `feat`: new user-facing feature.
- `fix`: bug fix.
- `docs`: docs only.
- `style`: formatting only, no logic change.
- `refactor`: code change, no feature or bug fix.
- `perf`: performance improvement.
- `test`: add or update tests.
- `build`: build system or dependency change.
- `ci`: CI config or pipeline change.
- `chore`: maintenance, tooling, housekeeping.
- `revert`: revert previous commit.

## Examples

```text
feat(auth): add google oauth callback
fix(api): handle empty session cookie
docs: add deployment notes
refactor(db): split session helpers
chore: bump drizzle version
```

## Breaking Changes

- Mark with `!` after type/scope:

```text
feat(api)!: rename session payload
```

- Or add footer:

```text
BREAKING CHANGE: session payload shape changed
```

## Good Commit Shape

- One commit, one purpose.
- Small diff when possible.
- Do not mix refactor with feature work unless unavoidable.
- Do not hide breaking change in body; make it explicit.
