#!/usr/bin/env bash
# tools/worktree/start-session.sh
# worktreeを作成してClaude Codeセッションを開始する
#
# Usage:
#   ./tools/worktree/start-session.sh [branch-name]
#   ./tools/worktree/start-session.sh feat/add-login
#   ./tools/worktree/start-session.sh  # タイムスタンプベースで自動生成
#
# このスクリプトは以下を実行:
# 1. worktreeを作成 (既存なら再利用)
# 2. devcontainerを起動
# 3. worktreeディレクトリでclaude codeを起動

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[start-session]${NC} $*"; }
log_success() { echo -e "${GREEN}[start-session]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[start-session]${NC} $*"; }
log_error() { echo -e "${RED}[start-session]${NC} $*" >&2; }

show_usage() {
    cat << EOF
Usage: $(basename "$0") [options] [branch-name]

Arguments:
  branch-name    Git branch name (optional, auto-generated if not provided)

Options:
  --no-claude    Skip starting Claude Code (just create worktree)
  --resume       Resume existing worktree instead of creating new
  -h, --help     Show this help

Examples:
  $(basename "$0")                      # Auto-generate: work/session-YYYYMMDD-HHMMSS
  $(basename "$0") feat/add-login       # Specific branch name
  $(basename "$0") --resume feat/login  # Resume existing worktree

After running, you'll be in the worktree with Claude Code ready.
Access your services at:
  Frontend: http://fe.<worktree-name>.localhost
  Backend:  http://be.<worktree-name>.localhost
EOF
}

# worktreeパスを取得
get_worktree_path() {
    local branch="$1"
    local repo_name
    repo_name=$(basename "${REPO_ROOT}")
    local safe_branch
    safe_branch=$(echo "$branch" | sed 's/\//-/g')
    echo "$(dirname "${REPO_ROOT}")/${repo_name}-${safe_branch}"
}

# ブランチ名を自動生成
generate_branch_name() {
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)
    echo "work/session-${timestamp}"
}

# worktreeが存在するか確認
worktree_exists() {
    local path="$1"
    git -C "${REPO_ROOT}" worktree list | grep -q "$path"
}

# メイン処理
main() {
    local branch_name=""
    local no_claude=false
    local resume=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            --no-claude)
                no_claude=true
                shift
                ;;
            --resume)
                resume=true
                shift
                ;;
            -*)
                log_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                branch_name="$1"
                shift
                ;;
        esac
    done

    # ブランチ名がなければ自動生成
    if [[ -z "$branch_name" ]]; then
        branch_name=$(generate_branch_name)
        log_info "Auto-generated branch: $branch_name"
    fi

    local worktree_path
    worktree_path=$(get_worktree_path "$branch_name")
    local worktree_name
    worktree_name=$(basename "$worktree_path")

    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║          Claude Code Worktree Session                      ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # worktreeの作成または再利用
    if [[ -d "$worktree_path" ]]; then
        if [[ "$resume" == true ]]; then
            log_success "Resuming existing worktree: $worktree_path"
        else
            log_warn "Worktree already exists: $worktree_path"
            read -rp "Resume this worktree? [Y/n] " answer
            if [[ "$answer" =~ ^[Nn]$ ]]; then
                log_error "Aborted. Use a different branch name or --resume flag."
                exit 1
            fi
        fi
    else
        log_info "Creating worktree..."
        if git -C "${REPO_ROOT}" rev-parse --verify "$branch_name" >/dev/null 2>&1; then
            # ブランチが存在する
            git -C "${REPO_ROOT}" worktree add "$worktree_path" "$branch_name"
        else
            # 新しいブランチを作成
            git -C "${REPO_ROOT}" worktree add -b "$branch_name" "$worktree_path"
        fi
        log_success "Worktree created: $worktree_path"

        # .worktree-context.yaml を作成
        cat > "${worktree_path}/.worktree-context.yaml" << EOF
# Worktree Context
# Generated: $(date -Iseconds)

branch: "${branch_name}"
worktree_path: "${worktree_path}"
created_at: "$(date -Iseconds)"

urls:
  frontend: "http://fe.${worktree_name}.localhost"
  backend: "http://be.${worktree_name}.localhost"
  traefik: "http://localhost:8080"
EOF
    fi

    # devcontainerを起動
    log_info "Starting services..."
    (
        cd "$worktree_path"
        if [[ -f "scripts/init-environment.sh" ]]; then
            bash scripts/init-environment.sh
        else
            log_warn "init-environment.sh not found, skipping service startup"
        fi
    )

    echo ""
    log_success "=== Environment Ready ==="
    echo ""
    echo -e "  📁 Worktree:  ${GREEN}${worktree_path}${NC}"
    echo -e "  🌿 Branch:    ${GREEN}${branch_name}${NC}"
    echo -e "  🌐 Frontend:  ${CYAN}http://fe.${worktree_name}.localhost${NC}"
    echo -e "  🔧 Backend:   ${CYAN}http://be.${worktree_name}.localhost${NC}"
    echo ""

    # Claude Codeを起動
    if [[ "$no_claude" == false ]]; then
        log_info "Starting Claude Code in worktree..."
        echo ""
        cd "$worktree_path"
        exec claude
    else
        echo "To start Claude Code manually:"
        echo -e "  ${CYAN}cd ${worktree_path} && claude${NC}"
        echo ""
    fi
}

main "$@"
