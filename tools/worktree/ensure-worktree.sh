#!/usr/bin/env bash
# tools/worktree/ensure-worktree.sh
# 作業開始時にworktreeブランチへの切り替えを強制する
#
# このスクリプトは以下を確認・実行する:
# 1. mainブランチにいる場合は警告を出してworktreeへの切り替えを促す
# 2. .worktree-context.yaml が存在するかチェック
# 3. 存在しない場合は新しいworktreeの作成を案内

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}[OK]${NC} $*"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# 現在のブランチを取得
get_current_branch() {
    git -C "${REPO_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo ""
}

# Protected branches
PROTECTED_BRANCHES=("main" "master" "develop")

is_protected_branch() {
    local branch="$1"
    for protected in "${PROTECTED_BRANCHES[@]}"; do
        if [[ "$branch" == "$protected" ]]; then
            return 0
        fi
    done
    return 1
}

# worktree context の確認
check_worktree_context() {
    if [[ -f "${REPO_ROOT}/.worktree-context.yaml" ]]; then
        return 0
    fi
    return 1
}

main() {
    local current_branch
    current_branch=$(get_current_branch)

    if [[ -z "$current_branch" ]]; then
        log_error "Git リポジトリではありません"
        exit 1
    fi

    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║          Worktree Environment Check                        ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Protected branch check
    if is_protected_branch "$current_branch"; then
        log_warn "⚠️  現在 protected ブランチ '${current_branch}' にいます"
        echo ""
        echo -e "${YELLOW}main/master ブランチへの直接コミットは禁止されています。${NC}"
        echo -e "${YELLOW}作業を開始する前に、worktree を作成してください。${NC}"
        echo ""
        echo "使用方法:"
        echo -e "  ${GREEN}./tools/worktree/spawn.sh <agent-type> <branch-name>${NC}"
        echo ""
        echo "例:"
        echo -e "  ${CYAN}./tools/worktree/spawn.sh implementer feat/GH-123-new-feature${NC}"
        echo -e "  ${CYAN}./tools/worktree/spawn.sh architect feat/GH-456-design${NC}"
        echo ""
        echo "または手動でブランチを作成:"
        echo -e "  ${CYAN}git checkout -b feat/your-feature-branch${NC}"
        echo ""
        return 1
    fi

    # Worktree context check
    if check_worktree_context; then
        log_success "✓ Worktree 環境で作業中: ${current_branch}"
        echo ""
        echo -e "Context file: ${GREEN}${REPO_ROOT}/.worktree-context.yaml${NC}"
    else
        log_info "ブランチ '${current_branch}' で作業中"
        echo ""
        echo -e "${YELLOW}ヒント: worktree/spawn.sh で作成した環境では${NC}"
        echo -e "${YELLOW}.worktree-context.yaml が自動生成されます。${NC}"
    fi

    echo ""
    return 0
}

main "$@"
