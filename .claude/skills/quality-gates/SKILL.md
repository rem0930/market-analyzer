---
name: quality-gates
description: Standard quality checks and fix order. Apply before commits, after code changes, or when CI fails. Triggers on "lint", "test", "typecheck", "CI", "build", "format", "quality".
globs:
  - "tools/contract/**"
  - ".github/workflows/**"
alwaysApply: false
---

# Quality Gates

Standard verification sequence for all code changes.

## Golden Commands

Always use `./tools/contract` instead of raw commands:

```bash
./tools/contract format     # Prettier + auto-fix
./tools/contract lint       # ESLint
./tools/contract typecheck  # TypeScript
./tools/contract test       # Vitest/Jest
./tools/contract build      # Production build
./tools/contract guardrail  # Architecture checks
./tools/contract e2e        # Playwright (if applicable)
```

## Fix Order (When Things Break)

Fix in this order to avoid cascading failures:

```
1. format   → Fixes style issues that may cause lint errors
2. lint     → Fixes static analysis issues
3. typecheck → Fixes type errors (often from lint fixes)
4. test     → Fixes broken tests
5. build    → Fixes build issues
6. e2e      → Fixes integration issues
```

## Minimal Diff Strategy

When CI fails:

1. **Identify ONE root cause** (not symptoms)
2. **Make smallest fix** for that cause
3. **Re-run gates** in order
4. **Repeat** if still failing (max 3 iterations)

If not fixed in 3 iterations:
- Document what you tried
- Ask for help
- Don't make random changes

## Pre-Commit Checklist

```markdown
- [ ] `./tools/contract format` - no changes needed
- [ ] `./tools/contract lint` - no errors
- [ ] `./tools/contract typecheck` - no errors
- [ ] `./tools/contract test` - all pass
- [ ] Tests added for new code
- [ ] Docs updated if behavior changed
```

## CI Pipeline Mapping

| Gate | CI Job | Required |
|------|--------|----------|
| format | `lint` | ✅ |
| lint | `lint` | ✅ |
| typecheck | `typecheck` | ✅ |
| test | `test` | ✅ |
| build | `build` | ✅ |
| e2e | `e2e` | Optional |

## See Also

- `prompts/skills/fix_ci_fast.md` for CI troubleshooting
- `prompts/skills/minimize_diff.md` for minimal changes
