---
description: Quickly fix CI failures with minimal diff
allowed-tools: Bash(./tools/contract:*), Bash(git:*), Read, Edit, Grep, Glob
argument-hint: [error-description]
---

# Fix CI Fast

Diagnose and fix CI failures with minimal changes.

## Error Context

$ARGUMENTS

## Diagnosis Order

1. **Dependencies** - Lock file sync, version mismatches
2. **Configuration** - tsconfig, eslint, env vars
3. **Environment** - Node version, Docker, paths

## Fix Strategy

- **One cause at a time**: Don't fix multiple unrelated issues
- **Minimal diff**: Smallest change that fixes the problem
- **Verify locally**: Run `./tools/contract guardrail` before push

## Commands

```bash
# Check current failures
./tools/contract lint
./tools/contract typecheck
./tools/contract test
```

## Max Iterations: 3

If not fixed in 3 attempts, escalate to human review.
