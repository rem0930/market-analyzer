# Core Rules (Non-negotiables)

These rules are **always loaded** and override any conflicting instructions.

## Workflow

1. **Worktree + DevContainer**: Never work directly on main. Always use `./tools/worktree/spawn.sh`.
2. **DocDD First**: No implementation without Spec/Plan/AC.
3. **Golden Commands Only**: Use `./tools/contract <cmd>`, never raw commands.
4. **No Destructive Changes**: Use diff/append/move, not overwrite.

## Git

- Branch: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`
- Commits: Conventional Commits (`feat(scope): message`)
- PRs: Include DocDD links (Spec/Plan/ADR)

## Quality Gates

- CI must pass before completion
- Docs must be updated with code changes
- Tests must exist before implementation (TDD)
