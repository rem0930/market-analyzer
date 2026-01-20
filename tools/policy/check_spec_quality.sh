#!/usr/bin/env bash
#
# check_spec_quality.sh - Spec の品質をチェックする
#
# Usage:
#   ./tools/policy/check_spec_quality.sh [spec_files...]
#   ./tools/policy/check_spec_quality.sh .specify/specs/*/spec.md
#
# Exit codes:
#   0 - All checks passed
#   1 - Quality issues found

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=0

log_pass() {
    echo -e "${GREEN}✓${NC} $1"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

log_fail() {
    echo -e "${RED}✗${NC} $1"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

log_info() {
    echo -e "  $1"
}

# Check if a section exists in the spec
check_section() {
    local file="$1"
    local section="$2"
    local required="${3:-true}"

    if grep -q "^## $section" "$file" 2>/dev/null; then
        log_pass "Section '$section' exists"
        return 0
    else
        if [[ "$required" == "true" ]]; then
            log_fail "Missing required section: '$section'"
            return 1
        else
            log_warn "Optional section missing: '$section'"
            return 0
        fi
    fi
}

# Check for placeholder text
check_no_placeholders() {
    local file="$1"
    local placeholders=("TODO" "TBD" "WIP" "FIXME" "XXX" "\[.*\]")
    local found=0

    for placeholder in "${placeholders[@]}"; do
        if grep -qE "$placeholder" "$file" 2>/dev/null; then
            # Skip if it's in a template or example section
            local count
            count=$(grep -cE "$placeholder" "$file" 2>/dev/null || echo "0")
            if [[ "$count" -gt 0 ]]; then
                log_warn "Found placeholder '$placeholder' ($count occurrences)"
                found=1
            fi
        fi
    done

    if [[ "$found" -eq 0 ]]; then
        log_pass "No obvious placeholders found"
    fi
}

# Check AC format (Given/When/Then)
check_ac_format() {
    local file="$1"

    # Extract AC section
    local in_ac=false
    local ac_count=0
    local valid_ac=0

    while IFS= read -r line; do
        if [[ "$line" =~ ^##\ AC- ]] || [[ "$line" =~ ^###\ AC- ]]; then
            in_ac=true
            ((ac_count++))
        elif [[ "$line" =~ ^## ]] && [[ ! "$line" =~ ^###\ AC- ]]; then
            in_ac=false
        elif [[ "$in_ac" == true ]]; then
            if [[ "$line" =~ ^\*\*Given\*\* ]] || [[ "$line" =~ ^\*\*When\*\* ]] || [[ "$line" =~ ^\*\*Then\*\* ]]; then
                ((valid_ac++))
            fi
        fi
    done < "$file"

    if [[ "$ac_count" -eq 0 ]]; then
        log_fail "No Acceptance Criteria (AC) found"
    elif [[ "$valid_ac" -ge "$ac_count" ]]; then
        log_pass "AC sections use Given/When/Then format ($ac_count ACs)"
    else
        log_warn "Some AC sections may not use Given/When/Then format"
    fi
}

# Check for FR/NFR numbering
check_requirements_numbering() {
    local file="$1"

    local fr_count
    fr_count=$(grep -cE "^### FR-[0-9]+" "$file" 2>/dev/null || echo "0")

    if [[ "$fr_count" -gt 0 ]]; then
        log_pass "Functional Requirements found ($fr_count FRs)"
    else
        log_fail "No Functional Requirements (FR-XXX) found"
    fi

    local nfr_count
    nfr_count=$(grep -cE "^### NFR-[0-9]+" "$file" 2>/dev/null || echo "0")

    if [[ "$nfr_count" -gt 0 ]]; then
        log_pass "Non-Functional Requirements found ($nfr_count NFRs)"
    else
        log_warn "No Non-Functional Requirements (NFR-XXX) found"
    fi
}

# Check Metadata section
check_metadata() {
    local file="$1"

    if grep -q "^## Metadata" "$file" 2>/dev/null; then
        local has_id=false
        local has_status=false

        if grep -qE "\*\*ID\*\*:" "$file" 2>/dev/null; then
            has_id=true
        fi
        if grep -qE "\*\*Status\*\*:" "$file" 2>/dev/null; then
            has_status=true
        fi

        if [[ "$has_id" == true ]] && [[ "$has_status" == true ]]; then
            log_pass "Metadata section has ID and Status"
        else
            log_warn "Metadata section incomplete (missing ID or Status)"
        fi
    else
        log_warn "No Metadata section (optional for existing specs)"
    fi
}

# Check Parent Documents section
check_parent_documents() {
    local file="$1"

    if grep -q "^## Parent Documents" "$file" 2>/dev/null || grep -q "^## Parent Spec" "$file" 2>/dev/null; then
        log_pass "Parent Documents section exists"
    else
        log_warn "No Parent Documents section (recommended for traceability)"
    fi
}

# Check Code Map section
check_code_map() {
    local file="$1"

    if grep -q "^## Code Map" "$file" 2>/dev/null; then
        log_pass "Code Map section exists"
    else
        log_warn "No Code Map section (recommended for implementation tracking)"
    fi
}

# Main check function for a single spec
check_spec() {
    local spec_file="$1"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Checking: $spec_file"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [[ ! -f "$spec_file" ]]; then
        log_fail "File not found: $spec_file"
        return 1
    fi

    # Required sections
    check_section "$spec_file" "Overview"

    # Check for FR section (either format)
    if ! grep -q "^## Functional Requirements" "$spec_file" 2>/dev/null; then
        log_fail "Missing required section: 'Functional Requirements'"
    else
        log_pass "Section 'Functional Requirements' exists"
    fi

    # Check for AC section (either format)
    if ! grep -q "^## Acceptance Criteria" "$spec_file" 2>/dev/null; then
        log_fail "Missing required section: 'Acceptance Criteria'"
    else
        log_pass "Section 'Acceptance Criteria' exists"
    fi

    # Recommended sections
    check_section "$spec_file" "Non-Functional Requirements" false
    check_section "$spec_file" "Out of Scope" false
    check_section "$spec_file" "Assumptions" false

    # New recommended sections
    check_metadata "$spec_file"
    check_parent_documents "$spec_file"
    check_section "$spec_file" "Impact Analysis" false
    check_code_map "$spec_file"

    # Content quality checks
    check_requirements_numbering "$spec_file"
    check_ac_format "$spec_file"
    check_no_placeholders "$spec_file"
}

# Main
main() {
    local spec_files=("$@")

    echo "╔═══════════════════════════════════════════════════╗"
    echo "║         Spec Quality Check                        ║"
    echo "╚═══════════════════════════════════════════════════╝"

    # If no files specified, find all specs
    if [[ ${#spec_files[@]} -eq 0 ]]; then
        while IFS= read -r -d '' file; do
            spec_files+=("$file")
        done < <(find "$REPO_ROOT/.specify/specs" -name "spec.md" -print0 2>/dev/null)
    fi

    if [[ ${#spec_files[@]} -eq 0 ]]; then
        echo "No spec files found."
        exit 0
    fi

    for spec_file in "${spec_files[@]}"; do
        check_spec "$spec_file"
    done

    # Summary
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Summary"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "Total checks: $TOTAL_CHECKS"
    echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
    echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
    echo -e "${RED}Failed: $FAILED_CHECKS${NC}"

    if [[ "$FAILED_CHECKS" -gt 0 ]]; then
        echo ""
        echo -e "${RED}Quality check failed.${NC}"
        exit 1
    else
        echo ""
        echo -e "${GREEN}Quality check passed.${NC}"
        exit 0
    fi
}

main "$@"
