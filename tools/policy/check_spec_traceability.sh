#!/usr/bin/env bash
#
# check_spec_traceability.sh - Spec のトレーサビリティをチェックする
#
# Usage:
#   ./tools/policy/check_spec_traceability.sh [spec_files...]
#   ./tools/policy/check_spec_traceability.sh .specify/specs/*/spec.md
#
# Exit codes:
#   0 - All checks passed
#   1 - Traceability issues found

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

# Check if referenced file exists
check_file_reference() {
    local base_dir="$1"
    local reference="$2"
    local ref_type="$3"

    # Extract path from markdown link or backtick reference
    local path
    path=$(echo "$reference" | sed -E 's/.*\(([^)]+)\).*/\1/' | sed -E 's/`([^`]+)`.*/\1/')

    # Skip URLs
    if [[ "$path" =~ ^https?:// ]]; then
        return 0
    fi

    # Resolve relative path
    local full_path
    if [[ "$path" =~ ^/ ]]; then
        full_path="$path"
    elif [[ "$path" =~ ^\.\. ]]; then
        full_path="$(cd "$base_dir" && cd "$(dirname "$path")" 2>/dev/null && pwd)/$(basename "$path")" 2>/dev/null || full_path=""
    else
        full_path="$REPO_ROOT/$path"
    fi

    if [[ -n "$full_path" ]] && [[ -e "$full_path" ]]; then
        log_pass "$ref_type reference valid: $path"
        return 0
    else
        log_warn "$ref_type reference not found: $path"
        return 0  # Warning only, not failure
    fi
}

# Check Code Map references
check_code_map_files() {
    local spec_file="$1"
    local spec_dir
    spec_dir="$(dirname "$spec_file")"

    local in_code_map=false
    local checked=0

    while IFS= read -r line; do
        if [[ "$line" =~ ^##\ Code\ Map ]]; then
            in_code_map=true
            continue
        elif [[ "$line" =~ ^## ]] && [[ "$in_code_map" == true ]]; then
            break
        fi

        if [[ "$in_code_map" == true ]]; then
            # Extract file paths from table rows
            if [[ "$line" =~ \`([^\`]+\.(ts|tsx|js|jsx|py|go|rs))\` ]]; then
                local file_path="${BASH_REMATCH[1]}"
                local full_path="$REPO_ROOT/$file_path"

                if [[ -f "$full_path" ]]; then
                    log_pass "Code Map file exists: $file_path"
                else
                    log_warn "Code Map file not found: $file_path (may not be implemented yet)"
                fi
                ((checked++))
            fi
        fi
    done < "$spec_file"

    if [[ "$checked" -eq 0 ]] && [[ "$in_code_map" == true ]]; then
        log_warn "Code Map section exists but no file references found"
    fi
}

# Check Parent Documents references
check_parent_document_references() {
    local spec_file="$1"
    local spec_dir
    spec_dir="$(dirname "$spec_file")"

    local in_parent_docs=false
    local has_prd_ref=false
    local has_identity_ref=false

    while IFS= read -r line; do
        if [[ "$line" =~ ^##\ Parent\ Documents ]] || [[ "$line" =~ ^##\ Parent\ Spec ]]; then
            in_parent_docs=true
            continue
        elif [[ "$line" =~ ^## ]] && [[ "$in_parent_docs" == true ]]; then
            break
        fi

        if [[ "$in_parent_docs" == true ]]; then
            # Check PRD reference
            if [[ "$line" =~ prd\.md ]] || [[ "$line" =~ PRD ]]; then
                has_prd_ref=true
                if [[ -f "$REPO_ROOT/docs/01_product/prd.md" ]]; then
                    log_pass "PRD reference valid"
                else
                    log_warn "PRD file not found"
                fi
            fi

            # Check identity reference
            if [[ "$line" =~ identity\.md ]] || [[ "$line" =~ Identity ]]; then
                has_identity_ref=true
                if [[ -f "$REPO_ROOT/docs/01_product/identity.md" ]]; then
                    log_pass "Identity reference valid"
                else
                    log_warn "Identity file not found"
                fi
            fi

            # Check parent spec reference
            if [[ "$line" =~ \.specify/specs/[^/]+/spec\.md ]]; then
                local parent_spec
                parent_spec=$(echo "$line" | grep -oE '\.specify/specs/[^/]+/spec\.md' | head -1)
                if [[ -f "$REPO_ROOT/$parent_spec" ]]; then
                    log_pass "Parent Spec reference valid: $parent_spec"
                else
                    log_fail "Parent Spec not found: $parent_spec"
                fi
            fi

            # Check ADR reference
            if [[ "$line" =~ adr/[^/]+\.md ]]; then
                local adr_path
                adr_path=$(echo "$line" | grep -oE 'docs/02_architecture/adr/[^)]+\.md' | head -1)
                if [[ -n "$adr_path" ]] && [[ -f "$REPO_ROOT/$adr_path" ]]; then
                    log_pass "ADR reference valid: $adr_path"
                elif [[ -n "$adr_path" ]]; then
                    log_warn "ADR not found: $adr_path"
                fi
            fi
        fi
    done < "$spec_file"

    if [[ "$in_parent_docs" == false ]]; then
        log_warn "No Parent Documents section found"
    fi
}

# Check for companion files (plan.md, tasks.md)
check_companion_files() {
    local spec_file="$1"
    local spec_dir
    spec_dir="$(dirname "$spec_file")"

    # Check plan.md
    if [[ -f "$spec_dir/plan.md" ]]; then
        log_pass "Companion plan.md exists"
    else
        log_warn "No plan.md found (recommended)"
    fi

    # Check tasks.md
    if [[ -f "$spec_dir/tasks.md" ]]; then
        log_pass "Companion tasks.md exists"
    else
        log_warn "No tasks.md found (recommended)"
    fi
}

# Check FR/AC cross-references
check_fr_ac_coverage() {
    local spec_file="$1"

    # Get FR count
    local fr_count
    fr_count=$(grep -oE "FR-[0-9]+" "$spec_file" 2>/dev/null | sort -u | wc -l | tr -d ' ')

    # Get AC count
    local ac_count
    ac_count=$(grep -oE "AC-[0-9]+" "$spec_file" 2>/dev/null | sort -u | wc -l | tr -d ' ')

    if [[ "$fr_count" -gt 0 ]] && [[ "$ac_count" -gt 0 ]]; then
        # Check if AC count is reasonable compared to FR count
        if [[ "$ac_count" -ge "$fr_count" ]]; then
            log_pass "FR/AC coverage looks reasonable ($fr_count FRs, $ac_count ACs)"
        else
            log_warn "More FRs than ACs ($fr_count FRs, $ac_count ACs) - ensure all FRs have AC coverage"
        fi
    elif [[ "$fr_count" -gt 0 ]] && [[ "$ac_count" -eq 0 ]]; then
        log_fail "FRs exist but no ACs defined"
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

    # Check parent document references
    check_parent_document_references "$spec_file"

    # Check companion files
    check_companion_files "$spec_file"

    # Check Code Map file references
    check_code_map_files "$spec_file"

    # Check FR/AC coverage
    check_fr_ac_coverage "$spec_file"
}

# Main
main() {
    local spec_files=("$@")

    echo "╔═══════════════════════════════════════════════════╗"
    echo "║         Spec Traceability Check                   ║"
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
        echo -e "${RED}Traceability check failed.${NC}"
        exit 1
    else
        echo ""
        echo -e "${GREEN}Traceability check passed.${NC}"
        exit 0
    fi
}

main "$@"
