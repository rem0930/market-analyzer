---
name: repo-conventions
description: Repository-specific conventions and contracts. Apply when starting tasks, creating PRs, or questioning existing patterns. Triggers on "convention", "workflow", "PR", "commit", "branch", "DocDD".
globs:
  - "AGENTS.md"
  - "docs/00_process/**"
  - ".specify/**"
alwaysApply: false
---

# Repository Conventions

Conventions specific to this repository.

## Canonical Source

**AGENTS.md is the single source of truth.** If this skill conflicts with AGENTS.md, follow AGENTS.md.

## Workflow

1. **Worktree First**: Never work on main directly
   ```bash
   ./tools/worktree/spawn.sh <branch-name>
   ```

2. **DocDD**: No implementation without Spec/Plan
   - Spec: `.specify/specs/<id>/spec.md`
   - Plan: `.specify/specs/<id>/plan.md`
   - Tasks: `.specify/specs/<id>/tasks.md`

3. **Golden Commands**: Use `./tools/contract` not raw commands

4. **PR Rules**:
   - Title: Conventional Commits (`feat(scope): message`)
   - Link DocDD artifacts
   - CI must pass

## Branch Naming

```
feat/<issue>-<slug>   # New feature
fix/<issue>-<slug>    # Bug fix
docs/<slug>           # Documentation
chore/<slug>          # Maintenance
```

## Commit Format

```
<type>(<scope>): <subject>

Types: feat, fix, docs, refactor, test, chore, build, ci
```

## Directory Structure

```
projects/
├── apps/           # Applications (api, web)
└── packages/       # Shared packages
    ├── shared/     # Domain utilities
    └── guardrails/ # Architecture checks

docs/
├── 00_process/     # How we work
├── 01_product/     # What we build
├── 02_architecture/ # How it's built
├── 03_quality/     # Quality standards
└── 04_delivery/    # Shipping
```

## When to Question Conventions

Before changing established patterns:

1. **Read existing code** to understand why
2. **Check ADRs** for documented decisions
3. **Propose in PR** with rationale
4. **Don't silently deviate**

## Key Files to Read First

1. `AGENTS.md` - Repository contract
2. `docs/00_process/process.md` - Development process
3. `docs/02_architecture/adr/` - Past decisions

## See Also

- `prompts/skills/read_contract_first.md`
- `prompts/skills/docdd_spec_first.md`
