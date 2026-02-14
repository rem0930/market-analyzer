#!/usr/bin/env bash
#
# check_pr_fields.sh - PR body をブランチタイプ別にバリデーション
#
# Usage:
#   tools/policy/check_pr_fields.sh <branch-name> <pr-body-file>
#   tools/policy/check_pr_fields.sh feat/GH-123-auth /tmp/pr-body.md
#
# Branch type rules:
#   feat/* → Spec link + AC checklist required
#   fix/*  → Issue link + Test 追加確認
#   docs/* → No special requirements
#   chore/* → No special requirements
#
# Exit codes:
#   0 - All checks passed
#   1 - Invalid arguments
#   2 - Validation failed

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

log_pass() {
  echo -e "${GREEN}✓${NC} $1"
  PASSED=$((PASSED + 1))
}

log_fail() {
  echo -e "${RED}✗${NC} $1"
  FAILED=$((FAILED + 1))
}

log_warn() {
  echo -e "${YELLOW}⚠${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

usage() {
  echo "Usage: $0 <branch-name> <pr-body-file>"
  echo ""
  echo "Arguments:"
  echo "  <branch-name>    Current branch name (e.g., feat/GH-123-auth)"
  echo "  <pr-body-file>   Path to file containing PR body text"
  echo ""
  echo "Branch type rules:"
  echo "  feat/*  → Spec link + AC checklist required"
  echo "  fix/*   → Issue link + Test confirmation"
  echo "  docs/*  → No special requirements"
  echo "  chore/* → No special requirements"
}

check_feat_branch() {
  local body_file="$1"

  # Check for Spec link
  if grep -qE '\.specify/specs/[a-z0-9-]+/spec\.md' "$body_file" 2>/dev/null; then
    log_pass "Spec link found"
  else
    log_fail "Missing Spec link (expected: .specify/specs/<id>/spec.md)"
  fi

  # Check for AC checklist (at least one checkbox)
  if grep -qE '\- \[(x|X| )\].*AC-' "$body_file" 2>/dev/null; then
    log_pass "AC checklist found"
  elif grep -qiE 'acceptance criteria|AC-[0-9]+' "$body_file" 2>/dev/null; then
    log_warn "AC mentioned but no checklist format (use '- [ ] AC-XXX: ...')"
  else
    log_fail "Missing AC checklist (expected: - [ ] AC-001: ...)"
  fi

  # Check for Plan link (recommended)
  if grep -qE '\.specify/specs/[a-z0-9-]+/plan\.md' "$body_file" 2>/dev/null; then
    log_pass "Plan link found"
  else
    log_warn "No Plan link (recommended: .specify/specs/<id>/plan.md)"
  fi
}

check_fix_branch() {
  local body_file="$1"

  # Check for Issue link
  if grep -qE '(#[0-9]+|GH-[0-9]+|https://github\.com/.*/issues/[0-9]+)' "$body_file" 2>/dev/null; then
    log_pass "Issue link found"
  else
    log_fail "Missing Issue link (expected: #123, GH-123, or GitHub issue URL)"
  fi

  # Check for test confirmation
  if grep -qiE '(test|テスト).*(add|追加|update|更新|fix|修正)' "$body_file" 2>/dev/null; then
    log_pass "Test update confirmed"
  elif grep -qE '\- \[(x|X)\].*[Tt]est' "$body_file" 2>/dev/null; then
    log_pass "Test checkbox checked"
  else
    log_warn "No test addition/update mentioned (recommended for bug fixes)"
  fi
}

# Main
main() {
  if [[ $# -lt 2 ]]; then
    usage
    exit 1
  fi

  local branch_name="$1"
  local body_file="$2"

  if [[ ! -f "$body_file" ]]; then
    echo -e "${RED}Error: PR body file not found: $body_file${NC}"
    exit 1
  fi

  echo "╔═══════════════════════════════════════════════════╗"
  echo "║           PR Fields Validation                    ║"
  echo "╚═══════════════════════════════════════════════════╝"
  echo ""
  echo "Branch: $branch_name"
  echo ""

  # Determine branch type
  case "$branch_name" in
    feat/*|feature/*)
      echo "Type: Feature branch"
      echo ""
      check_feat_branch "$body_file"
      ;;
    fix/*|bugfix/*|hotfix/*)
      echo "Type: Fix branch"
      echo ""
      check_fix_branch "$body_file"
      ;;
    docs/*)
      echo "Type: Documentation branch"
      echo ""
      log_pass "No special requirements for docs branches"
      ;;
    chore/*|build/*|ci/*)
      echo "Type: Maintenance branch"
      echo ""
      log_pass "No special requirements for maintenance branches"
      ;;
    *)
      echo "Type: Unknown branch type"
      echo ""
      log_warn "Unrecognized branch prefix: $branch_name"
      ;;
  esac

  # Summary
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Summary"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo -e "${GREEN}Passed: $PASSED${NC}"
  echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
  echo -e "${RED}Failed: $FAILED${NC}"

  if [[ "$FAILED" -gt 0 ]]; then
    echo ""
    echo -e "${RED}PR fields validation FAILED.${NC}"
    exit 2
  else
    echo ""
    echo -e "${GREEN}PR fields validation PASSED.${NC}"
    exit 0
  fi
}

main "$@"
