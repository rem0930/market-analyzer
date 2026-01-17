#!/bin/bash
# PostToolUse hook for Write/Edit operations
# Runs format/lint on changed files
#
# Environment variables available:
# - CLAUDE_TOOL_NAME: The tool that was used
# - CLAUDE_TOOL_INPUT: JSON input to the tool
# - CLAUDE_TOOL_OUTPUT: JSON output from the tool

set -euo pipefail

# Parse file path from JSON input
FILE_PATH=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.file_path // .path // empty')

if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Only run on TypeScript/JavaScript files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
  exit 0
fi

# Check if tools/contract exists
if [[ ! -f "./tools/contract" ]]; then
  exit 0
fi

# Run format on the changed file (silent, non-blocking)
# This is a "soft" guardrail - warns but doesn't block
if command -v pnpm &> /dev/null; then
  pnpm exec prettier --write "$FILE_PATH" 2>/dev/null || true
fi

exit 0
