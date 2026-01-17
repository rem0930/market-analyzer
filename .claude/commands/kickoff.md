---
description: Start development with parallel subagent exploration
allowed-tools: Bash, Read, Grep, Glob
---

# Kickoff Development

Start a new task with parallel exploration.

## Task

$ARGUMENTS

## Workflow

1. **Parallel Exploration** (background agents)
   - repo-explorer: Find relevant files
   - security-auditor: Identify security concerns
   - code-reviewer: Review related code

2. **Read Contract**
   - Load AGENTS.md
   - Check DocDD requirements

3. **Report** findings and next steps

## Environment Check

```bash
git worktree list
pwd
```

## Contract Reference

Read `AGENTS.md` for repository rules.
