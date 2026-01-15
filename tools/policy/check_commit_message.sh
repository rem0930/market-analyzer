#!/usr/bin/env bash
# ==============================================================================
# check_commit_message.sh - Conventional Commits Validator
#
# Validates a commit message against Conventional Commits specification.
# Can be used as a standalone script or as a git hook.
#
# Usage:
#   ./check_commit_message.sh "feat: add new feature"
#   ./check_commit_message.sh < .git/COMMIT_EDITMSG
#
# Exit Codes:
#   0 - Valid commit message
#   1 - Invalid commit message
# ==============================================================================
set -euo pipefail

# Read commit message from argument or stdin
if [[ $# -gt 0 ]]; then
  commit_msg="$1"
else
  commit_msg=$(cat)
fi

# Skip merge commits
if [[ "${commit_msg}" =~ ^Merge ]]; then
  echo "Merge commit detected, skipping validation."
  exit 0
fi

# Conventional Commits pattern
# Format: <type>(<scope>): <subject>
# - type: required, one of the allowed types
# - scope: optional, in parentheses
# - subject: required, starts after ": "
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .+"

# Get the first line (header)
header=$(echo "${commit_msg}" | head -n 1)

echo "Validating commit message: ${header}"

if [[ ! "${header}" =~ ${pattern} ]]; then
  echo ""
  echo "ERROR: Invalid commit message format."
  echo ""
  echo "Expected format: <type>(<scope>): <subject>"
  echo ""
  echo "Allowed types:"
  echo "  feat     - New feature"
  echo "  fix      - Bug fix"
  echo "  docs     - Documentation only"
  echo "  style    - Code style (no logic change)"
  echo "  refactor - Refactoring"
  echo "  perf     - Performance improvement"
  echo "  test     - Tests"
  echo "  build    - Build system / dependencies"
  echo "  ci       - CI configuration"
  echo "  chore    - Other changes"
  echo "  revert   - Revert commit"
  echo ""
  echo "Examples:"
  echo "  feat: add new feature"
  echo "  fix(auth): resolve null pointer"
  echo "  docs: update README"
  exit 1
fi

# Check header length (should be <= 100)
if [[ ${#header} -gt 100 ]]; then
  echo ""
  echo "WARNING: Commit header is too long (${#header} > 100 characters)."
  echo "Consider shortening the subject."
fi

# Check for trailing period
if [[ "${header}" =~ \\.$ ]]; then
  echo ""
  echo "WARNING: Commit subject should not end with a period."
fi

echo "Commit message is valid."
