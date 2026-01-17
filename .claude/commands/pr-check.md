---
description: Run PR checks (review, tests, security) before merge
allowed-tools: Bash, Read, Grep, Glob
---

# PR Check

Run quality checks before merge.

## Checks

1. **Quality Gates**
   ```bash
   ./tools/contract lint
   ./tools/contract typecheck
   ./tools/contract test
   ```

2. **Security Review** (via security-auditor agent)
   - Check for hardcoded secrets
   - Review auth/authz changes
   - Scan dependencies

3. **Code Review** (via code-reviewer agent)
   - DocDD compliance
   - Architecture alignment
   - Test coverage

## Target

$ARGUMENTS
