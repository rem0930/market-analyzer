---
name: guardrails
description: Run horizontal guardrails to verify architecture constraints
tools:
  - Read
  - Bash
  - Grep
  - Glob
user-invocable: true
---

# Skill: Horizontal Guardrails

## Trigger

- Before commit
- CI failure (guardrail related)
- Code review

## Purpose

Statically verify Clean Architecture + DDD constraints.

## Philosophy

| Guardrail | Verifies | Method |
|-----------|----------|--------|
| Horizontal | How (non-functional) | Static analysis |
| Vertical | What (functional) | Test execution |

## Layer Dependencies

```
presentation → usecase → domain ← infrastructure
                 ↑
            composition (can access all)
```

## Commands

```bash
# ESLint + boundaries
./tools/contract lint

# Custom guardrails
./tools/contract guardrail

# List available guardrails
pnpm guardrail --list
```

## Custom Guards

| ID | Checks |
|----|--------|
| `repository-result` | Repository returns Result<T> |
| `domain-event-causation` | Domain events have causation metadata |
| `openapi-route-coverage` | OpenAPI spec matches implementation |
| `value-object-immutability` | Value Objects are immutable |

## When RED

1. Read error message
2. Check `@what` / `@why` comments
3. Fix root cause (don't disable guardrail)
4. Re-run to confirm GREEN

## Anti-patterns

- Disabling guardrails to commit
- Using `// eslint-disable` to silence
- Adding guardrails without `@what` / `@why`
