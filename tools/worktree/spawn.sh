#!/usr/bin/env bash
# tools/worktree/spawn.sh
# Worktree を作成し、DevContainer を起動する
#
# Usage:
#   ./tools/worktree/spawn.sh <agent-type> <branch-name> [--context <file>]
#
# Examples:
#   ./tools/worktree/spawn.sh implementer feat/GH-123-auth
#   ./tools/worktree/spawn.sh architect feat/GH-456-refactor --context .worktree-context.yaml

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
Usage: $(basename "$0") <agent-type> <branch-name> [options]

Arguments:
  agent-type    Agent to run: pdm, architect, designer, implementer, qa, reviewer
  branch-name   Git branch name (will be created if not exists)

Options:
  --context <file>    Context file to pass to agent (.worktree-context.yaml)
  --no-devcontainer   Skip DevContainer startup
  --dry-run           Show what would be done without executing
  -h, --help          Show this help message

Examples:
  $(basename "$0") implementer feat/GH-123-auth
  $(basename "$0") architect feat/GH-456-design --context context.yaml
EOF
}

# Validate agent type
VALID_AGENTS=("pdm" "architect" "designer" "implementer" "qa" "reviewer" "orchestrator")

validate_agent() {
    local agent="$1"
    for valid in "${VALID_AGENTS[@]}"; do
        if [[ "$agent" == "$valid" ]]; then
            return 0
        fi
    done
    return 1
}

# Generate worktree path
get_worktree_path() {
    local branch="$1"
    local safe_branch
    safe_branch=$(echo "$branch" | sed 's/\//-/g')
    echo "${REPO_ROOT}/worktrees/${safe_branch}"
}

# Allocate port range for worktree
allocate_ports() {
    local worktree_id="$1"
    # Base port + worktree_id * 10 (each worktree gets 10 ports)
    # Range: 3000-3099 for worktree 0, 3100-3199 for worktree 1, etc.
    local base_port=$((3000 + worktree_id * 100))
    echo "$base_port"
}

# Get next available worktree ID with atomic allocation
get_next_worktree_id() {
    local lock_file="${STATE_DIR}/.id-lock"
    mkdir -p "${STATE_DIR}"

    # Acquire exclusive lock with timeout
    exec 200>"$lock_file"
    if ! flock -x -w 10 200; then
        log_error "Failed to acquire lock for ID allocation"
        exit 1
    fi

    local max_id=0
    if [[ -d "${STATE_DIR}" ]]; then
        for f in "${STATE_DIR}"/*.yaml; do
            if [[ -f "$f" ]] 2>/dev/null; then
                local id
                id=$(grep -E "^worktree_id:" "$f" 2>/dev/null | awk '{print $2}' || echo "0")
                if [[ "$id" -gt "$max_id" ]]; then
                    max_id="$id"
                fi
            fi
        done
    fi

    local new_id=$((max_id + 1))

    # Release lock
    flock -u 200
    exec 200>&-

    echo "$new_id"
}

# Create state file for worktree
create_state_file() {
    local worktree_path="$1"
    local branch="$2"
    local agent="$3"
    local worktree_id="$4"
    local context_file="$5"
    local port_base="$6"

    mkdir -p "${STATE_DIR}"
    local state_file="${STATE_DIR}/$(basename "${worktree_path}").yaml"

    cat > "${state_file}" << EOF
# Worktree State File
# Generated: $(date -Iseconds)

worktree_id: ${worktree_id}
worktree_path: "${worktree_path}"
branch: "${branch}"
agent: "${agent}"
status: "running"
port_base: ${port_base}
created_at: "$(date -Iseconds)"
context_file: "${context_file:-none}"

# DevContainer info (populated after startup)
container_id: ""
container_name: ""
EOF

    echo "${state_file}"
}

# Create worktree context file
create_worktree_context() {
    local worktree_path="$1"
    local branch="$2"
    local agent="$3"
    local source_context="$4"

    local context_file="${worktree_path}/.worktree-context.yaml"

    if [[ -n "$source_context" && -f "$source_context" ]]; then
        # Copy and extend source context
        cp "$source_context" "$context_file"
        cat >> "$context_file" << EOF

# Auto-added by spawn.sh
_spawn_info:
  spawned_at: "$(date -Iseconds)"
  worktree_path: "${worktree_path}"
  branch: "${branch}"
  assigned_agent: "${agent}"
EOF
    else
        # Create new context
        cat > "$context_file" << EOF
# Worktree Context
# Generated: $(date -Iseconds)

task_id: "$(echo "$branch" | grep -oE 'GH-[0-9]+' || echo 'unknown')"
parent_agent: "orchestrator"
assigned_agent: "${agent}"
branch: "${branch}"
worktree_path: "${worktree_path}"

# Context references (to be filled by agent)
context:
  spec: ""
  plan: ""
  adr: ""

# Success criteria
success_criteria:
  - "contract test passes"
  - "docs updated if needed"

# Completion callback
on_complete:
  notify: "orchestrator"
  action: "report-status"
EOF
    fi

    echo "$context_file"
}

# Main
main() {
    local agent_type=""
    local branch_name=""
    local context_file=""
    local no_devcontainer=false
    local dry_run=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            --context)
                context_file="$2"
                shift 2
                ;;
            --no-devcontainer)
                no_devcontainer=true
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
                if [[ -z "$agent_type" ]]; then
                    agent_type="$1"
                elif [[ -z "$branch_name" ]]; then
                    branch_name="$1"
                else
                    log_error "Unexpected argument: $1"
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Validate required arguments
    if [[ -z "$agent_type" || -z "$branch_name" ]]; then
        log_error "Missing required arguments"
        show_usage
        exit 1
    fi

    # Validate agent type
    if ! validate_agent "$agent_type"; then
        log_error "Invalid agent type: $agent_type"
        log_error "Valid agents: ${VALID_AGENTS[*]}"
        exit 1
    fi

    # Validate context file if provided
    if [[ -n "$context_file" && ! -f "$context_file" ]]; then
        log_error "Context file not found: $context_file"
        exit 1
    fi

    # Calculate paths and IDs
    local worktree_path
    worktree_path=$(get_worktree_path "$branch_name")
    local worktree_id
    worktree_id=$(get_next_worktree_id)
    local port_base
    port_base=$(allocate_ports "$worktree_id")

    log_info "=== Worktree Spawn ==="
    log_info "Agent:      $agent_type"
    log_info "Branch:     $branch_name"
    log_info "Path:       $worktree_path"
    log_info "Worktree ID: $worktree_id"
    log_info "Port range: ${port_base}-$((port_base + 99))"

    if [[ "$dry_run" == true ]]; then
        log_warn "Dry run mode - no changes will be made"
        exit 0
    fi

    # Check if worktree already exists
    if [[ -d "$worktree_path" ]]; then
        log_warn "Worktree already exists at $worktree_path"
        read -rp "Remove and recreate? [y/N] " answer
        if [[ "$answer" =~ ^[Yy]$ ]]; then
            log_info "Removing existing worktree..."
            git -C "${REPO_ROOT}" worktree remove --force "$worktree_path" 2>/dev/null || rm -rf "$worktree_path"
            git -C "${REPO_ROOT}" worktree prune
        else
            log_error "Aborted"
            exit 1
        fi
    fi

    # Create worktree
    log_info "Creating worktree..."
    if git -C "${REPO_ROOT}" rev-parse --verify "$branch_name" >/dev/null 2>&1; then
        # Branch exists
        git -C "${REPO_ROOT}" worktree add "$worktree_path" "$branch_name"
    else
        # Create new branch
        git -C "${REPO_ROOT}" worktree add -b "$branch_name" "$worktree_path"
    fi
    log_success "Worktree created at $worktree_path"

    # Create context file in worktree
    log_info "Creating worktree context..."
    local wt_context
    wt_context=$(create_worktree_context "$worktree_path" "$branch_name" "$agent_type" "$context_file")
    log_success "Context file: $wt_context"

    # Create state file
    log_info "Creating state file..."
    local state_file
    state_file=$(create_state_file "$worktree_path" "$branch_name" "$agent_type" "$worktree_id" "$context_file" "$port_base")
    log_success "State file: $state_file"

    # Trap cleanup on error
    cleanup_on_error() {
        log_error "Startup failed, cleaning up..."
        if [[ -n "${container_id:-}" ]]; then
            docker stop "$container_id" 2>/dev/null || true
        fi
        git -C "${REPO_ROOT}" worktree remove --force "$worktree_path" 2>/dev/null || true
        rm -f "$state_file"
    }
    trap cleanup_on_error ERR

    # Start DevContainer if requested
    if [[ "$no_devcontainer" == false ]]; then
        log_info "Starting DevContainer..."

        # Check if devcontainer CLI is available
        if ! command -v devcontainer &> /dev/null; then
            log_warn "devcontainer CLI not found. Install with: npm install -g @devcontainers/cli"
            log_warn "Skipping DevContainer startup"
        else
            # Generate unique container name
            local container_name="worktree-${worktree_id}-${agent_type}"

            # Start devcontainer in background
            log_info "Launching DevContainer..."
            (
                cd "$worktree_path"
                echo "STARTING" > .setup-status
                if devcontainer up \
                    --workspace-folder . \
                    --config .devcontainer/devcontainer.json \
                    --id-label "worktree.id=${worktree_id}" \
                    --id-label "worktree.agent=${agent_type}" 2>&1 | tee .devcontainer-startup.log; then
                    echo "READY" > .setup-status
                else
                    echo "FAILED" > .setup-status
                    exit 1
                fi
            ) &
            local bg_pid=$!

            # Wait for container to appear (up to 60s)
            log_info "Waiting for container to start..."
            local container_id=""
            container_id=$(wait_for_container "$worktree_id" "$worktree_path" 60) || {
                log_error "Container failed to start within 60 seconds"
                log_error "Check logs at: ${worktree_path}/.devcontainer-startup.log"
                wait $bg_pid || true
                exit 1
            }

            log_success "Container started: $container_id"

            # Update state file with container ID
            local container_name_actual
            container_name_actual=$(docker inspect --format '{{.Name}}' "$container_id" 2>/dev/null | sed 's/^\///' || echo "")

            # Use portable sed syntax for macOS and Linux
            if [[ -n "$container_id" ]]; then
                sed -i.bak "s|^container_id: \".*\"|container_id: \"${container_id}\"|" "$state_file"
            fi
            if [[ -n "$container_name_actual" ]]; then
                sed -i.bak "s|^container_name: \".*\"|container_name: \"${container_name_actual}\"|" "$state_file"
            fi
            rm -f "${state_file}.bak"

            # Wait for container to be healthy
            log_info "Waiting for container to be ready (up to 5 minutes)..."
            if check_container_health "$container_id" 300; then
                log_success "Container is healthy!"
            else
                local exit_code=$?
                if [[ $exit_code -eq 2 ]]; then
                    log_error "Container health check timed out after 5 minutes"
                    log_error "Check logs with: docker logs ${container_id}"
                else
                    log_error "Container is not healthy"
                    log_error "Check logs with: docker logs ${container_id}"
                fi
                exit 1
            fi

            # Wait for background process to complete
            wait $bg_pid || {
                log_error "DevContainer startup process failed"
                exit 1
            }

            log_success "DevContainer fully initialized"
        fi
    fi

    # Clear error trap on success
    trap - ERR

    # Summary
    echo ""
    log_success "=== Worktree Ready ==="
    echo ""
    echo "To work in this worktree:"
    echo "  cd $worktree_path"
    echo ""
    echo "To open in VS Code:"
    echo "  code $worktree_path"
    echo ""
    echo "To open in VS Code DevContainer:"
    echo "  code --folder-uri vscode-remote://dev-container+$(echo -n "$worktree_path" | xxd -p | tr -d '\n')/workspace"
    echo ""
    echo "Context file:"
    echo "  $wt_context"
    echo ""
    echo "Agent prompt:"
    echo "  prompts/agents/${agent_type}.md"
    echo ""
}

main "$@"
