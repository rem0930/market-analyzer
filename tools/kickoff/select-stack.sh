#!/usr/bin/env bash
#
# Select and apply a stack
#
# Usage: ./tools/kickoff/select-stack.sh <stack_id>
#
# エージェントがユーザーとの対話で決定したスタックを適用する際に使用
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${REPO_ROOT}"

stack_id="${1:-}"

if [[ -z "${stack_id}" ]]; then
  echo "Usage: ./tools/kickoff/select-stack.sh <stack_id>"
  echo ""
  echo "Available stacks:"
  for dir in stacks/*/; do
    if [[ -d "${dir}" ]] && [[ -f "${dir}manifest.yaml" ]]; then
      name=$(basename "${dir}")
      label=$(grep "^label:" "${dir}manifest.yaml" | cut -d'"' -f2 2>/dev/null || echo "")
      echo "  ${name}: ${label}"
    fi
  done
  exit 2
fi

# Validate stack exists
if [[ ! -d "stacks/${stack_id}" ]]; then
  echo "ERROR: Stack not found: ${stack_id}"
  exit 2
fi

# Set active stack
echo "${stack_id}" > .repo/active-stack
echo "✓ Selected stack: ${stack_id}"

# Run auto-scaffold
exec "${REPO_ROOT}/tools/kickoff/auto-scaffold.sh"
