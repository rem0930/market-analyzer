---
description: Audit dependencies for vulnerabilities and updates
allowed-tools: Bash, Read, Grep
---

# Dependency Audit

Check for vulnerable or outdated dependencies.

## Commands

```bash
# Check for known vulnerabilities
pnpm audit

# List outdated packages
pnpm outdated

# Check for unused dependencies
pnpm dlx depcheck
```

## Review Points

1. **Critical CVEs**: Must fix before merge
2. **High CVEs**: Should fix soon
3. **Outdated majors**: Plan upgrade path
4. **Unused deps**: Remove to reduce attack surface

## Output

Report findings with severity and recommended actions.
