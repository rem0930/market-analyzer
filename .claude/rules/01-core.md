# Core Rules (Always Applied)

## Canonical Source

**AGENTS.md is the single source of truth.** All other files defer to it.

## Non-Negotiables

1. **Worktree + DevContainer**: Never work on main directly
2. **DocDD**: No implementation without Spec/Plan/AC
3. **Golden Commands**: Use `./tools/contract` not raw commands
4. **No Breaking Changes**: Preserve existing behavior unless explicitly requested

## Before Any Implementation

1. Read `AGENTS.md`
2. Check for existing Spec in `.specify/specs/<id>/`
3. Understand the acceptance criteria

## Commit Rules

- Format: `<type>(<scope>): <subject>`
- Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`
- Subject: Imperative mood, no period at end

## PR Rules

- Title follows Conventional Commits
- Link to Spec/Plan/ADR in description
- CI must pass before merge
