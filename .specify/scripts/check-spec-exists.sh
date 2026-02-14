#!/usr/bin/env bash
#
# check-spec-exists.sh - Spec の存在をチェックする
#
# Usage:
#   .specify/scripts/check-spec-exists.sh <feature-id>
#   .specify/scripts/check-spec-exists.sh --list
#
# Exit codes:
#   0 - Spec exists (or --list completed)
#   1 - Invalid arguments
#   2 - Spec not found

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SPECS_DIR="$REPO_ROOT/.specify/specs"
QUALITY_SCRIPT="$REPO_ROOT/tools/policy/check_spec_quality.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

usage() {
  echo "Usage: $0 <feature-id> | --list"
  echo ""
  echo "Arguments:"
  echo "  <feature-id>  Check if spec exists for the given feature"
  echo "  --list         List all specs with their status"
  echo ""
  echo "Exit codes:"
  echo "  0  Spec exists / list completed"
  echo "  1  Invalid arguments"
  echo "  2  Spec not found"
}

# List all specs with status
list_specs() {
  echo "╔═══════════════════════════════════════════════════╗"
  echo "║             Spec Status Overview                  ║"
  echo "╚═══════════════════════════════════════════════════╝"
  echo ""

  if [[ ! -d "$SPECS_DIR" ]]; then
    echo -e "${YELLOW}No specs directory found at $SPECS_DIR${NC}"
    exit 0
  fi

  local count=0
  for spec_dir in "$SPECS_DIR"/*/; do
    [[ -d "$spec_dir" ]] || continue
    local feature_id
    feature_id=$(basename "$spec_dir")
    local spec_file="$spec_dir/spec.md"

    if [[ -f "$spec_file" ]]; then
      # Extract status from metadata
      local status
      status=$(grep -oP '\*\*Status\*\*:\s*\K.*' "$spec_file" 2>/dev/null || echo "Unknown")
      echo -e "${GREEN}✓${NC} ${CYAN}${feature_id}${NC} — ${status}"
    else
      echo -e "${RED}✗${NC} ${CYAN}${feature_id}${NC} — spec.md missing"
    fi
    count=$((count + 1))
  done

  if [[ "$count" -eq 0 ]]; then
    echo "No specs found."
  else
    echo ""
    echo "Total: $count spec(s)"
  fi
}

# Check single spec existence
check_spec() {
  local feature_id="$1"
  local spec_file="$SPECS_DIR/$feature_id/spec.md"

  echo "Checking spec for: $feature_id"
  echo ""

  if [[ ! -f "$spec_file" ]]; then
    echo -e "${RED}✗${NC} Spec not found: $spec_file"
    echo ""
    echo "To create a spec, copy the template:"
    echo "  mkdir -p .specify/specs/$feature_id"
    echo "  cp .specify/templates/spec.md .specify/specs/$feature_id/spec.md"
    echo ""
    echo "For API features, use the API template:"
    echo "  cp .specify/templates/spec-api.md .specify/specs/$feature_id/spec.md"
    exit 2
  fi

  echo -e "${GREEN}✓${NC} Spec found: $spec_file"

  # Delegate to quality check if available
  if [[ -x "$QUALITY_SCRIPT" ]]; then
    echo ""
    echo "Running quality check..."
    "$QUALITY_SCRIPT" "$spec_file"
  elif [[ -f "$QUALITY_SCRIPT" ]]; then
    echo ""
    echo "Running quality check..."
    bash "$QUALITY_SCRIPT" "$spec_file"
  else
    echo -e "${YELLOW}⚠${NC} Quality check script not found: $QUALITY_SCRIPT"
  fi
}

# Main
main() {
  if [[ $# -eq 0 ]]; then
    usage
    exit 1
  fi

  case "$1" in
    --list)
      list_specs
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    -*)
      echo -e "${RED}Unknown option: $1${NC}"
      usage
      exit 1
      ;;
    *)
      check_spec "$1"
      ;;
  esac
}

main "$@"
