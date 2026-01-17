# Quality Rules (Always Applied)

## Golden Commands

Always use `./tools/contract` instead of raw commands:

```bash
./tools/contract format     # Prettier
./tools/contract lint       # ESLint
./tools/contract typecheck  # TypeScript
./tools/contract test       # Unit tests
./tools/contract build      # Production build
./tools/contract guardrail  # Architecture checks
```

## Fix Order (When CI Fails)

Fix in this specific order:

```
1. format    → Style issues that cause lint errors
2. lint      → Static analysis issues
3. typecheck → Type errors
4. test      → Broken tests
5. build     → Build issues
```

## Minimal Diff Strategy

When fixing issues:

1. Identify ONE root cause (not symptoms)
2. Make the smallest fix for that cause
3. Re-run quality gates in order
4. Max 3 iterations, then ask for help

## Pre-Commit Checklist

Before every commit:

- [ ] `./tools/contract format` passes
- [ ] `./tools/contract lint` passes
- [ ] `./tools/contract typecheck` passes
- [ ] `./tools/contract test` passes
- [ ] New code has tests
- [ ] Docs updated if behavior changed

## Code Review Standards

- No console.log in production code
- No commented-out code
- No TODO without issue link
- No magic numbers (use constants)
- Error handling is explicit

## Test Requirements

- New features require tests
- Bug fixes require regression tests
- Coverage should not decrease
- Tests must be deterministic
