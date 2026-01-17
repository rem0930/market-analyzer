---
description: Start development with parallel subagent exploration
allowed-tools: Bash, Read, Grep, Glob, Task
---

# Kickoff Development

Start a new task with parallel exploration.

## Task

$ARGUMENTS

## Instructions

Execute the following steps:

### Step 1: Parallel Exploration (MUST run in parallel)

Launch these 3 agents **simultaneously in a single message** using the Task tool:

1. **repo-explorer** (run_in_background: true)
   - Prompt: "Explore codebase to find files relevant to: $ARGUMENTS. Report file paths and patterns."

2. **security-auditor** (run_in_background: true)
   - Prompt: "Security review for task: $ARGUMENTS. Check for auth, secrets, injection risks."

3. **code-reviewer** (run_in_background: true)
   - Prompt: "Review code quality for areas related to: $ARGUMENTS. Check DocDD, architecture."

### Step 2: Read Contract

While agents run, read `AGENTS.md` to understand:
- Non-negotiables
- Required artifacts for this change type
- Golden Commands to use

### Step 3: Synthesize Results

When all agents complete:
1. Gather their findings
2. Create a TODO list with prioritized tasks
3. Report findings and recommended next steps

## Environment Check

```bash
git worktree list
pwd
```

## Example Task Tool Usage

```
Task(subagent_type: "repo-explorer", prompt: "...", run_in_background: true)
Task(subagent_type: "security-auditor", prompt: "...", run_in_background: true)
Task(subagent_type: "code-reviewer", prompt: "...", run_in_background: true)
```
