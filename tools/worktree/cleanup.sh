#!/usr/bin/env bash
# tools/worktree/cleanup.sh
# Worktree を削除しクリーンアップする
#
# Usage:
#   ./tools/worktree/cleanup.sh <worktree-path>
#   ./tools/worktree/cleanup.sh --merged
#   ./tools/worktree/cleanup.sh --all
#   ./tools/worktree/cleanup.sh --prune

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATE_DIR="${REPO_ROOT}/.worktree-state"

# Source container health check library
source "${SCRIPT_DIR}/lib/container-health.sh"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

show_usage() {
    cat << EOF
Usage: $(basename "$0") [options] [worktree-path]

Arguments:
  worktree-path   Path to worktree to remove

Options:
  --merged        Remove all worktrees whose branches are merged to main
  --all           Remove all worktrees (except main)
  --prune         Only prune orphaned state files and git worktree records
  --force         Force removal without confirmation
  --dry-run       Show what would be done without executing
  -h, --help      Show this help message

Examples:
  $(basename "$0") ../my-repo-feature-a
  $(basename "$0") --merged
  $(basename "$0") --prune
EOF
}

# Stop DevContainer for worktree
stop_devcontainer() {
    local worktree_path="$1"

    if ! command -v docker &> /dev/null; then
        return 0
    fi

    # Get worktree_id from state file
    local state_file="${STATE_DIR}/$(basename "${worktree_path}").yaml"
    local worktree_id=""
    if [[ -f "$state_file" ]]; then
        worktree_id=$(grep "^worktree_id:" "$state_file" 2>/dev/null | awk '{print $2}' | tr -d '"' || echo "")
    fi

    # Multi-strategy container detection
    local container_id=""
    if [[ -n "$worktree_id" ]]; then
        container_id=$(get_container_id_by_worktree "$worktree_id" "$worktree_path" 2>/dev/null || echo "")
    fi

    # Fallback: Try state file container_id field
    if [[ -z "$container_id" && -f "$state_file" ]]; then
        container_id=$(grep "^container_id:" "$state_file" 2>/dev/null | awk '{print $2}' | tr -d '"' || echo "")
        # Verify container still exists
        if [[ -n "$container_id" ]]; then
            if ! docker ps -a --filter "id=${container_id}" --format "{{.ID}}" 2>/dev/null | grep -q .; then
                container_id=""
            fi
        fi
    fi

    if [[ -z "$container_id" ]]; then
        log_info "No container found for ${worktree_path}"
        return 0
    fi

    log_info "Stopping container: $container_id"

    # Graceful stop with timeout
    if stop_container_gracefully "$container_id" 30; then
        log_success "Container stopped gracefully"
    else
        log_warn "Container stop required force kill"
    fi
}

# Remove state file for worktree
remove_state_file() {
    local worktree_path="$1"
    local state_file="${STATE_DIR}/$(basename "${worktree_path}").yaml"

    if [[ -f "$state_file" ]]; then
        rm -f "$state_file"
        log_success "Removed state file: $state_file"
    fi
}

# Remove a single worktree
remove_worktree() {
    local worktree_path="$1"
    local force="$2"
    local dry_run="$3"

    # Resolve to absolute path
    worktree_path=$(cd "$worktree_path" 2>/dev/null && pwd || echo "$worktree_path")

    # Don't remove main worktree
    if [[ "$worktree_path" == "${REPO_ROOT}" ]]; then
        log_warn "Cannot remove main worktree: $worktree_path"
        return 1
    fi

    # Check if it's a valid worktree
    if ! git -C "${REPO_ROOT}" worktree list | grep -q "^${worktree_path} "; then
        log_warn "Not a valid worktree: $worktree_path"
        return 1
    fi

    log_info "Removing worktree: $worktree_path"

    if [[ "$dry_run" == true ]]; then
        log_warn "Dry run - would remove: $worktree_path"
        return 0
    fi

    # Confirm if not forced
    if [[ "$force" != true ]]; then
        read -rp "Are you sure you want to remove this worktree? [y/N] " answer
        if [[ ! "$answer" =~ ^[Yy]$ ]]; then
            log_warn "Aborted"
            return 1
        fi
    fi

    # Stop DevContainer
    stop_devcontainer "$worktree_path"

    # Remove worktree
    if git -C "${REPO_ROOT}" worktree remove --force "$worktree_path" 2>/dev/null; then
        log_success "Worktree removed: $worktree_path"
    else
        # Fall back to manual removal
        log_warn "Git worktree remove failed, trying manual removal..."
        rm -rf "$worktree_path"
        git -C "${REPO_ROOT}" worktree prune
        log_success "Worktree removed manually: $worktree_path"
    fi

    # Remove state file
    remove_state_file "$worktree_path"

    return 0
}

# Remove worktrees with merged branches
remove_merged() {
    local force="$1"
    local dry_run="$2"
    local removed=0

    log_info "Looking for worktrees with merged branches..."

    # Get main branch name
    local main_branch
    main_branch=$(git -C "${REPO_ROOT}" symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@' || echo "main")

    while IFS= read -r line; do
        local worktree_path branch
        worktree_path=$(echo "$line" | awk '{print $1}')
        branch=$(echo "$line" | awk '{print $3}' | sed 's/^\[//' | sed 's/\]$//')

        # Skip main worktree
        if [[ "$worktree_path" == "${REPO_ROOT}" ]]; then
            continue
        fi

        # Check if branch is merged
        if git -C "${REPO_ROOT}" branch --merged "$main_branch" 2>/dev/null | grep -qE "^\s*${branch}$"; then
            log_info "Branch '$branch' is merged to $main_branch"
            if remove_worktree "$worktree_path" "$force" "$dry_run"; then
                removed=$((removed + 1))
            fi
        fi
    done < <(git -C "${REPO_ROOT}" worktree list 2>/dev/null)

    if [[ $removed -eq 0 ]]; then
        log_info "No merged worktrees found"
    else
        log_success "Removed $removed merged worktree(s)"
    fi
}

# Remove all worktrees
remove_all() {
    local force="$1"
    local dry_run="$2"
    local removed=0

    if [[ "$force" != true ]]; then
        log_warn "This will remove ALL worktrees except main!"
        read -rp "Are you sure? [y/N] " answer
        if [[ ! "$answer" =~ ^[Yy]$ ]]; then
            log_warn "Aborted"
            return
        fi
    fi

    while IFS= read -r line; do
        local worktree_path
        worktree_path=$(echo "$line" | awk '{print $1}')

        # Skip main worktree
        if [[ "$worktree_path" == "${REPO_ROOT}" ]]; then
            continue
        fi

        if remove_worktree "$worktree_path" true "$dry_run"; then
            removed=$((removed + 1))
        fi
    done < <(git -C "${REPO_ROOT}" worktree list 2>/dev/null)

    log_success "Removed $removed worktree(s)"
}

# Prune orphaned records
prune_orphaned() {
    local dry_run="$1"
    local pruned=0

    log_info "Pruning orphaned records..."

    # Prune git worktree
    if [[ "$dry_run" == true ]]; then
        log_info "Would run: git worktree prune"
    else
        git -C "${REPO_ROOT}" worktree prune
        log_success "Git worktree pruned"
    fi

    # Prune state files
    if [[ -d "${STATE_DIR}" ]]; then
        shopt -s nullglob
        for state_file in "${STATE_DIR}"/*.yaml; do
            if [[ -f "$state_file" ]]; then
                local wt_path
                wt_path=$(grep -E "^worktree_path:" "$state_file" 2>/dev/null | sed 's/^[^:]*:[[:space:]]*//' | sed 's/^"//' | sed 's/"$//')

                if [[ -n "$wt_path" && ! -d "$wt_path" ]]; then
                    if [[ "$dry_run" == true ]]; then
                        log_info "Would remove orphaned state file: $state_file"
                    else
                        rm -f "$state_file"
                        log_success "Removed orphaned state file: $(basename "$state_file")"
                    fi
                    pruned=$((pruned + 1))
                fi
            fi
        done
        shopt -u nullglob
    fi

    if [[ $pruned -eq 0 ]]; then
        log_info "No orphaned records found"
    else
        log_success "Pruned $pruned orphaned record(s)"
    fi
}

# Main
main() {
    local worktree_path=""
    local mode=""
    local force=false
    local dry_run=false

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            --merged)
                mode="merged"
                shift
                ;;
            --all)
                mode="all"
                shift
                ;;
            --prune)
                mode="prune"
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                worktree_path="$1"
                shift
                ;;
        esac
    done

    case "$mode" in
        merged)
            remove_merged "$force" "$dry_run"
            ;;
        all)
            remove_all "$force" "$dry_run"
            ;;
        prune)
            prune_orphaned "$dry_run"
            ;;
        "")
            if [[ -z "$worktree_path" ]]; then
                log_error "No worktree path specified"
                show_usage
                exit 1
            fi
            remove_worktree "$worktree_path" "$force" "$dry_run"
            ;;
    esac
}

main "$@"
