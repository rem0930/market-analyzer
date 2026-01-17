---
name: minimize-diff
description: Minimize code changes to single root cause with smallest possible diff
tools:
  - Read
  - Edit
  - Bash
  - Grep
  - Glob
user-invocable: true
---

# Skill: Minimize Diff

## Trigger

- CI failing
- Review feedback
- Multiple changes mixed in one PR

## Purpose

Identify **one** root cause and create the **smallest** fix.

## Process

### 1. Reproduce

```bash
./tools/contract lint
./tools/contract typecheck
./tools/contract test
```

### 2. Isolate Root Cause

- Read error messages carefully
- Find the **first** failure (not cascading errors)
- Identify the **single** change needed

### 3. Classify Change Type

| Type | Action |
|------|--------|
| docs-only | Only docs changes |
| fix | Bug fix |
| refactor | Code structure only |
| feature | New functionality |

### 4. Revert Unrelated Changes

```bash
git checkout HEAD -- <unrelated-file>
```

### 5. Split if Needed

One PR = One purpose. Split mixed changes.

## Checklist

- [ ] Single root cause identified
- [ ] Minimal changes only
- [ ] Unrelated changes reverted
- [ ] PR purpose is clear
