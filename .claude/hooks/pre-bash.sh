#!/bin/bash
# PreToolUse hook for Bash commands
# Exit codes: 0 = allow, 2 = block, other = warning
#
# Input: JSON from stdin with tool_input.command
# Output: stdout message (shown to user if blocked/warned)

set -euo pipefail

# Read JSON from stdin
INPUT=$(cat)

# Parse command from JSON input (supports both env var and stdin)
# Try stdin first, fall back to env var for backwards compatibility
if [[ -n "$INPUT" ]]; then
  COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")
  # Fall back to direct command field
  if [[ -z "$COMMAND" ]]; then
    COMMAND=$(echo "$INPUT" | jq -r '.command // empty' 2>/dev/null || echo "")
  fi
elif [[ -n "${CLAUDE_TOOL_INPUT:-}" ]]; then
  COMMAND=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.command // empty' 2>/dev/null || echo "")
fi

# If jq is not available, try Python as fallback
if [[ -z "${COMMAND:-}" ]] && command -v python3 &>/dev/null; then
  if [[ -n "$INPUT" ]]; then
    COMMAND=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    cmd = data.get('tool_input', {}).get('command', '') or data.get('command', '')
    print(cmd)
except:
    pass
" 2>/dev/null || echo "")
  fi
fi

if [[ -z "${COMMAND:-}" ]]; then
  exit 0
fi

# === Layer B: Defense Guardrails ===

# Block main branch operations
if [[ "$COMMAND" =~ git\ (push|checkout|switch).*main ]] || \
   [[ "$COMMAND" =~ git\ (push|checkout|switch).*master ]]; then
  echo "BLOCKED: Direct operations on main/master branch are forbidden."
  echo "Use worktree and PR workflow instead."
  echo "Reason: AGENTS.md Non-negotiable #1"
  exit 2
fi

# Block force push (all variants)
if [[ "$COMMAND" =~ git\ push.*(-f|--force|--force-with-lease) ]]; then
  echo "BLOCKED: Force push is forbidden."
  echo "Reason: AGENTS.md Autonomy Configuration - safe mode"
  exit 2
fi

# Block hard reset (destructive)
if [[ "$COMMAND" =~ git\ reset\ --hard ]]; then
  echo "BLOCKED: git reset --hard is forbidden."
  echo "Use git stash or git checkout -- instead."
  exit 2
fi

# Block dangerous rm commands
if [[ "$COMMAND" =~ rm\ -rf\ [./]*$ ]] || \
   [[ "$COMMAND" =~ rm\ -rf\ /[^\ ]* ]] || \
   [[ "$COMMAND" =~ rm\ -rf\ \~ ]]; then
  echo "BLOCKED: Recursive delete of root, current, or home directory."
  exit 2
fi

# Block sudo (no privilege escalation)
if [[ "$COMMAND" =~ ^sudo\ ]] || [[ "$COMMAND" =~ \|\ *sudo ]]; then
  echo "BLOCKED: sudo is not allowed."
  exit 2
fi

# Block pipe to shell execution (RCE prevention)
if [[ "$COMMAND" =~ curl.*\|.*(bash|sh|zsh|python|node) ]] || \
   [[ "$COMMAND" =~ wget.*\|.*(bash|sh|zsh|python|node) ]]; then
  echo "BLOCKED: Piping download to shell execution is forbidden."
  echo "Reason: Supply chain security"
  exit 2
fi

# Block secret exfiltration attempts
if [[ "$COMMAND" =~ echo.*\$[A-Z_]*KEY ]] || \
   [[ "$COMMAND" =~ echo.*\$[A-Z_]*SECRET ]] || \
   [[ "$COMMAND" =~ echo.*\$[A-Z_]*TOKEN ]] || \
   [[ "$COMMAND" =~ printenv.*SECRET ]] || \
   [[ "$COMMAND" =~ printenv.*KEY ]] || \
   [[ "$COMMAND" =~ printenv.*TOKEN ]]; then
  echo "BLOCKED: Potential secret exfiltration detected."
  exit 2
fi

# Block reading sensitive files
if [[ "$COMMAND" =~ cat.*\.env ]] || \
   [[ "$COMMAND" =~ cat.*\.pem ]] || \
   [[ "$COMMAND" =~ cat.*\.key ]] || \
   [[ "$COMMAND" =~ cat.*/secrets/ ]]; then
  echo "BLOCKED: Reading sensitive files is not allowed."
  exit 2
fi

# Warn about raw commands (should use ./tools/contract)
if [[ "$COMMAND" =~ ^(pnpm|npm|yarn|bun)\ (test|lint|build|format) ]] && \
   [[ ! "$COMMAND" =~ ^pnpm\ (audit|outdated) ]]; then
  echo "WARNING: Use './tools/contract' instead of raw package manager commands."
  echo "Command: $COMMAND"
  echo "Reason: AGENTS.md Non-negotiable #3"
  # Exit 1 = warning, continues execution
  exit 1
fi

# All checks passed
exit 0
