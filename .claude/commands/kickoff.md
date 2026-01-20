---
description: Start development with parallel subagent exploration
allowed-tools: Bash, Read, Grep, Glob, Task, AskUserQuestion
---

# Kickoff Development

Start a new task with parallel exploration.

## Task

$ARGUMENTS

## Instructions

Execute the following steps **in order**:

### Step 0: Environment Pre-flight Check (MUST execute first)

**This step is MANDATORY before any other action.**

1. Check current branch and worktree status:
```bash
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
IS_WORKTREE=$([ -f .git ] && echo "yes" || echo "no")
echo "Branch: $CURRENT_BRANCH"
echo "In worktree: $IS_WORKTREE"
echo "Working directory: $(pwd)"
```

2. **If on protected branch (main/master/develop):**
   - STOP and inform user: "You are on '$CURRENT_BRANCH'. Worktree environment required."
   - Use AskUserQuestion to get branch name for the task (suggest based on task description)
   - Create worktree with the following command:
   ```bash
   # Generate branch name from task (kebab-case, max 40 chars)
   BRANCH_NAME="feat/$(echo '$ARGUMENTS' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9 ]//g' | tr ' ' '-' | sed 's/--*/-/g' | cut -c1-40)-$(date +%H%M%S)"
   ./tools/worktree/spawn.sh implementer "$BRANCH_NAME"
   ```
   - After worktree creation, instruct user:
     ```
     Worktree created at: ./worktrees/<branch-name>

     **IMPORTANT: You must now work in the new worktree directory.**

     Next steps:
     1. Open the worktree in VS Code: code ./worktrees/<branch-name>
     2. Or change directory: cd ./worktrees/<branch-name>
     3. Then run /kickoff again from within the worktree

     The kickoff process will continue there with DevContainer support.
     ```
   - **STOP here** - do not proceed to Step 1 until user is in worktree

3. **If already in worktree (IS_WORKTREE=yes) or feature branch:**
   - Proceed to Step 1
   - Optionally check if DevContainer is running:
   ```bash
   # Check for DevContainer marker
   if [ -f /workspace/.dev-ready ] || [ -f ./.dev-ready ]; then
     echo "DevContainer: Ready"
   else
     echo "DevContainer: Not detected (consider running ./tools/contract up)"
   fi
   ```

### Step 1: Parallel Exploration (MUST run in parallel)

**Only proceed if Step 0 confirms safe environment.**

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

### Step 2.5: Check Existing Specs (for change/enhancement tasks)

**If the task involves modifying existing functionality:**

1. Check if related specs exist:
```bash
ls -la .specify/specs/
```

2. If a related spec exists, execute **Skill.Read_Master_Spec**:
   - Read the existing spec to understand current FR/NFR/AC
   - Identify what changes are needed
   - Plan spec updates before implementation

3. Execute **Skill.Impact_Analysis**:
   - Identify affected systems (Frontend/Backend/Database/API)
   - Check for breaking changes
   - Plan required document updates

**If creating a new feature:**
1. Check for related/parent specs
2. Set up parent-child relationships if applicable
3. Use `.specify/templates/spec.md` as the template

### Step 3: Synthesize Results

When all agents complete:
1. Gather their findings
2. Create a TODO list with prioritized tasks
3. Report findings and recommended next steps
4. **Remind user of Golden Commands:**
   - `./tools/contract format` - Format code
   - `./tools/contract lint` - Run linter
   - `./tools/contract typecheck` - Type check
   - `./tools/contract test` - Run tests
   - `./tools/contract build` - Build project

## Environment Check Summary

| Check | Required State | Action if Failed |
|-------|---------------|------------------|
| Branch | NOT main/master/develop | Create worktree |
| Worktree | In worktree directory | Create worktree |
| DevContainer | Running (optional but recommended) | Run `./tools/contract up` |

## Example Task Tool Usage

```
Task(subagent_type: "repo-explorer", prompt: "...", run_in_background: true)
Task(subagent_type: "security-auditor", prompt: "...", run_in_background: true)
Task(subagent_type: "code-reviewer", prompt: "...", run_in_background: true)
```

## Quick Reference

Protected branches that require worktree:
- main
- master
- develop

Worktree creation command:
```bash
./tools/worktree/spawn.sh <agent-type> <branch-name>
```

Agent types: `implementer`, `architect`, `reviewer`, `qa`, `pdm`, `designer`
