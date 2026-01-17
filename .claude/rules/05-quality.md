# Quality Rules (Always Applied)

## Golden Commands (MUST use)

```bash
./tools/contract format     # Prettier
./tools/contract lint       # ESLint
./tools/contract typecheck  # TypeScript
./tools/contract test       # Unit tests
./tools/contract build      # Production build
./tools/contract guardrail  # Architecture checks
```

**NEVER run raw `pnpm lint` or `npm test` directly.**

## Fix Order (MUST follow when CI fails)

```text
1. format    → Style issues
2. lint      → Static analysis
3. typecheck → Type errors
4. test      → Broken tests
5. build     → Build issues
```

## Pre-Commit (MUST pass)

- [ ] `./tools/contract format`
- [ ] `./tools/contract lint`
- [ ] `./tools/contract typecheck`
- [ ] `./tools/contract test`

## Code Standards (MUST NOT)

| MUST NOT                        | Why                              |
|---------------------------------|----------------------------------|
| `console.log` in production     | Use structured logger            |
| Commented-out code              | Delete or use feature flags      |
| TODO without issue link         | Track in issue tracker           |
| Magic numbers                   | Use named constants              |

## Detailed Reference

For minimal diff strategy, CI mapping, and troubleshooting:

→ `.claude/skills/quality-gates/SKILL.md`
