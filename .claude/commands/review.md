---
description: Review code changes with Staff-level perspective
allowed-tools: Bash(git:*), Bash(gh:*), Read, Grep, Glob
argument-hint: [pr-number or branch]
---

# Code Review

Review with DocDD, NFR, and rollback perspectives.

## Target

$ARGUMENTS

## Review Checklist

1. **DocDD Compliance**
   - [ ] Spec/Plan links present
   - [ ] AC coverage verified
   - [ ] Docs updated with code

2. **NFR (Non-Functional Requirements)**
   - [ ] Performance impact assessed
   - [ ] Security implications reviewed
   - [ ] Error handling adequate

3. **Rollback Safety**
   - [ ] Migration reversible
   - [ ] Feature flag present (if applicable)
   - [ ] No breaking changes without version bump

## Current Changes

```bash
git diff main...HEAD --stat
```
