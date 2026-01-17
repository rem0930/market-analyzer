---
description: Run PR checks (review, tests, security) before merge
allowed-tools: Bash, Read, Grep, Glob, Task
---

# PR Check

Run comprehensive quality checks before merge.

## Target

$ARGUMENTS

## Instructions

Execute ALL checks in parallel where possible:

### Step 1: Parallel Checks (run simultaneously)

Launch these agents **in a single message**:

1. **test-runner** (run_in_background: true)
   - Prompt: "Run quality gates in order: lint, typecheck, test, build. Report failures."

2. **security-auditor** (run_in_background: true)
   - Prompt: "Security audit for PR. Check: hardcoded secrets, auth changes, dependency vulnerabilities."

3. **code-reviewer** (run_in_background: true)
   - Prompt: "Code review for PR. Check: DocDD compliance, architecture alignment, test coverage, rollback safety."

### Step 2: Collect Results

When all agents complete, synthesize findings into:

```markdown
## PR Check Results

### Quality Gates
| Gate | Status | Details |
|------|--------|---------|

### Security
- P0 (Blockers): ...
- P1 (Important): ...

### Code Review
- P0 (Blockers): ...
- P1 (Important): ...
- P2 (Suggestions): ...

### Verdict
[ ] Ready to merge
[ ] Needs fixes (see blockers above)
```

### Step 3: Dependency Audit (if needed)

If security-auditor flags dependency issues:
```bash
pnpm audit
pnpm outdated
```
