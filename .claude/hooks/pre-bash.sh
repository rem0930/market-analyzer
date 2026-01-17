#!/bin/bash
# PreToolUse hook for Bash commands
# Exit codes: 0 = allow, 2 = block, other = warning
#
# Environment variables available:
# - CLAUDE_TOOL_NAME: The tool being used
# - CLAUDE_TOOL_INPUT: JSON input to the tool

set -euo pipefail

# Parse command from JSON input
COMMAND=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.command // empty')

if [[ -z "$COMMAND" ]]; then
  exit 0
fi

# === Layer B: Defense Guardrails ===

# Block main branch operations
if [[ "$COMMAND" =~ git\ (push|checkout|switch).*main ]] || \
   [[ "$COMMAND" =~ git\ (push|checkout|switch).*master ]]; then
  echo "BLOCKED: Direct operations on main/master branch are forbidden."
  echo "Use worktree and PR workflow instead."
  exit 2
fi

# Block force push
if [[ "$COMMAND" =~ git\ push.*(-f|--force) ]]; then
  echo "BLOCKED: Force push is forbidden."
  exit 2
fi

# Block dangerous rm commands
if [[ "$COMMAND" =~ rm\ -rf\ [./]*$ ]] || \
   [[ "$COMMAND" =~ rm\ -rf\ /[^\ ]* ]]; then
  echo "BLOCKED: Recursive delete of root or current directory."
  exit 2
fi

# Block pipe to shell execution
if [[ "$COMMAND" =~ curl.*\|.*(bash|sh) ]] || \
   [[ "$COMMAND" =~ wget.*\|.*(bash|sh) ]]; then
  echo "BLOCKED: Piping download to shell execution is forbidden."
  exit 2
fi

# Warn about raw commands (should use ./tools/contract)
if [[ "$COMMAND" =~ ^(pnpm|npm|yarn|bun)\ (test|lint|build|format) ]] && \
   [[ ! "$COMMAND" =~ ^pnpm\ (audit|outdated) ]]; then
  echo "WARNING: Use './tools/contract' instead of raw package manager commands."
  echo "Command: $COMMAND"
  # Exit 1 = warning, continues execution
  exit 1
fi

# All checks passed
exit 0
