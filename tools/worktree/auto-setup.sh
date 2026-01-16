#!/usr/bin/env bash
# tools/worktree/auto-setup.sh
# Claude Code SessionStart hook でworktree環境を自動セットアップする
#
# 動作:
# 1. mainブランチにいるか確認
# 2. mainなら: 標準入力からタスク情報を受け取りブランチ名を生成
# 3. worktreeを作成してdevcontainerを起動
# 4. 作業ディレクトリ情報を出力
#
# Usage (hook経由):
#   SessionStart hook で自動実行される
#
# Usage (手動):
#   echo '{"prompt": "ログイン機能を追加"}' | ./tools/worktree/auto-setup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Colors (for stderr output)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[auto-setup]${NC} $*" >&2; }
log_success() { echo -e "${GREEN}[auto-setup]${NC} $*" >&2; }
log_warn() { echo -e "${YELLOW}[auto-setup]${NC} $*" >&2; }
log_error() { echo -e "${RED}[auto-setup]${NC} $*" >&2; }

# 現在のブランチを取得
get_current_branch() {
    git -C "${REPO_ROOT}" rev-parse --abbrev-ref HEAD 2>/dev/null || echo ""
}

# worktree環境かどうか確認
is_worktree() {
    [[ -f "${REPO_ROOT}/.git" ]]
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

# タスク内容からブランチ名を生成
generate_branch_name() {
    local task_description="$1"
    local timestamp
    timestamp=$(date +%Y%m%d-%H%M%S)

    # タスク内容から英語のスラッグを生成
    # 簡易的な変換: 日本語を含む場合はタイムスタンプベース
    local slug
    if echo "$task_description" | grep -qE '[ぁ-んァ-ン一-龯]'; then
        # 日本語を含む場合: タイムスタンプベース
        slug="task-${timestamp}"
    else
        # 英語の場合: 単語を抽出してケバブケースに
        slug=$(echo "$task_description" | \
            tr '[:upper:]' '[:lower:]' | \
            sed 's/[^a-z0-9 ]//g' | \
            tr ' ' '-' | \
            sed 's/--*/-/g' | \
            cut -c1-40)

        # 空の場合はタイムスタンプ
        if [[ -z "$slug" ]]; then
            slug="task-${timestamp}"
        fi
    fi

    echo "work/${slug}-${timestamp:9:6}"  # work/task-name-HHMMSS
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

# メイン処理
main() {
    local current_branch
    current_branch=$(get_current_branch)

    log_info "Checking environment..."
    log_info "Current branch: $current_branch"
    log_info "Is worktree: $(is_worktree && echo 'yes' || echo 'no')"

    # 既にworktree環境の場合はスキップ
    if is_worktree; then
        log_success "Already in worktree environment. Skipping auto-setup."
        echo '{"continue": true}'
        exit 0
    fi

    # 非protectedブランチの場合もスキップ
    if ! is_protected_branch "$current_branch"; then
        log_success "Already on feature branch '$current_branch'. Skipping auto-setup."
        echo '{"continue": true}'
        exit 0
    fi

    # 標準入力からセッション情報を読み取る (SessionStart hookはJSONを渡す)
    local input_json=""
    if [[ ! -t 0 ]]; then
        input_json=$(cat)
    fi

    # セッション情報からタスク説明を抽出
    local task_description=""
    if [[ -n "$input_json" ]]; then
        # session_id があればログに出力
        local session_id
        session_id=$(echo "$input_json" | jq -r '.session_id // empty' 2>/dev/null || echo "")
        if [[ -n "$session_id" ]]; then
            log_info "Session ID: $session_id"
        fi

        # タスク説明を取得 (prompts配列の最初のユーザーメッセージなど)
        # SessionStartの入力形式に応じて調整が必要
        task_description=$(echo "$input_json" | jq -r '.prompt // .task // .description // empty' 2>/dev/null || echo "")
    fi

    # タスク説明がない場合はデフォルト
    if [[ -z "$task_description" ]]; then
        task_description="claude-session"
    fi

    log_info "Task: $task_description"

    # ブランチ名を生成
    local branch_name
    branch_name=$(generate_branch_name "$task_description")
    log_info "Generated branch: $branch_name"

    # worktreeパスを計算
    local worktree_path
    worktree_path=$(get_worktree_path "$branch_name")
    log_info "Worktree path: $worktree_path"

    # worktreeを作成
    log_info "Creating worktree..."
    if ! git -C "${REPO_ROOT}" worktree add -b "$branch_name" "$worktree_path" 2>&1; then
        log_error "Failed to create worktree"
        echo '{"continue": true, "systemMessage": "⚠️ Failed to create worktree. Working in main branch."}'
        exit 0
    fi
    log_success "Worktree created at $worktree_path"

    # .worktree-context.yaml を作成
    cat > "${worktree_path}/.worktree-context.yaml" << EOF
# Worktree Context
# Auto-generated by auto-setup.sh
# Generated: $(date -Iseconds)

task_description: "${task_description}"
branch: "${branch_name}"
worktree_path: "${worktree_path}"
created_at: "$(date -Iseconds)"
auto_generated: true

# DevContainer URLs (after startup)
urls:
  frontend: "http://fe.$(basename "$worktree_path").localhost"
  backend: "http://be.$(basename "$worktree_path").localhost"
EOF

    # devcontainerを起動 (バックグラウンド)
    log_info "Starting devcontainer..."
    if command -v devcontainer &> /dev/null; then
        # devcontainer CLIがある場合
        (
            cd "$worktree_path"
            devcontainer up --workspace-folder . 2>&1 | while read -r line; do
                log_info "[devcontainer] $line"
            done
        ) &
        log_success "DevContainer starting in background..."
    else
        # devcontainer CLIがない場合はinit-environment.shを使う
        log_info "devcontainer CLI not found, using init-environment.sh..."
        (
            cd "$worktree_path"
            bash scripts/init-environment.sh 2>&1 | while read -r line; do
                log_info "[init-env] $line"
            done
        ) &
        log_success "Services starting in background..."
    fi

    # 結果を出力
    local worktree_name
    worktree_name=$(basename "$worktree_path")

    log_success "=== Auto-setup complete ==="
    log_success "Worktree: $worktree_path"
    log_success "Branch: $branch_name"
    log_success "Frontend: http://fe.${worktree_name}.localhost"
    log_success "Backend: http://be.${worktree_name}.localhost"

    # Claude Codeへの指示を含むJSONを出力
    cat << EOF
{
  "continue": true,
  "systemMessage": "🚀 Worktree environment created!\n\n📁 Working directory: ${worktree_path}\n🌿 Branch: ${branch_name}\n🌐 Frontend: http://fe.${worktree_name}.localhost\n🔧 Backend: http://be.${worktree_name}.localhost\n\n⚠️ IMPORTANT: All file operations should be performed in:\n${worktree_path}\n\nDevContainer is starting in background. Services will be available shortly."
}
EOF
}

main "$@"
