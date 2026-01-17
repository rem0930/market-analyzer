---
description: Start development workflow with worktree and environment setup
allowed-tools: Bash(./tools/*:*), Bash(git:*), Bash(docker:*), Read, Glob
argument-hint: <task-description>
---

# Kickoff Development Workflow

Start a new development task with proper environment setup.

## Task Description

$ARGUMENTS

## Steps

1. Check current environment (worktree status, DevContainer)
2. Create worktree if on main branch
3. Setup DevContainer or CLI mode
4. Load AGENTS.md contract
5. Identify required DocDD artifacts

## Execution

Run environment check:
```bash
git worktree list && pwd
[[ -f "/.dockerenv" ]] || [[ -n "$REMOTE_CONTAINERS" ]] && echo "DEVCONTAINER: true" || echo "DEVCONTAINER: false"
```

Read the contract:
```
{{file:AGENTS.md}}
```
