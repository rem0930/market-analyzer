#!/usr/bin/env bash
#
# DevContainer 実行コンテキスト判定・実行ヘルパー
#
# Usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/lib/devcontainer-exec.sh"
#   devcontainer_exec "pnpm test"
#
set -euo pipefail

# DevContainer 内かどうかを判定
is_inside_devcontainer() {
  [[ -f "/.dockerenv" ]] || [[ -n "${REMOTE_CONTAINERS:-}" ]] || [[ -n "${DEVCONTAINER:-}" ]]
}

# Worktree 名を取得（ディレクトリ名から）
get_worktree_name() {
  local repo_root="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

  # .git がファイル（worktree）かディレクトリ（メインリポジトリ）かで判定
  if [[ -f "${repo_root}/.git" ]]; then
    # Worktree: ディレクトリ名を使用
    basename "${repo_root}"
  else
    # メインリポジトリ
    echo "main"
  fi
}

# リポジトリ名を取得
get_repo_name() {
  local repo_root="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
  basename "$(dirname "${repo_root}")/$(basename "${repo_root}")" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g'
}

# DevContainer が起動中か確認
is_devcontainer_running() {
  local worktree_name="${1:-$(get_worktree_name)}"
  local repo_name
  repo_name="$(get_repo_name)"
  local container_name="${worktree_name}-${repo_name}-dev"

  docker ps --format '{{.Names}}' 2>/dev/null | grep -q "^${container_name}$"
}

# DevContainer を起動
start_devcontainer() {
  local repo_root="${1:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
  local worktree_name
  worktree_name="$(get_worktree_name "${repo_root}")"

  echo "🚀 DevContainer (${worktree_name}) を起動中..."

  # init-environment.sh を使用して起動
  if [[ -x "${repo_root}/scripts/init-environment.sh" ]]; then
    (cd "${repo_root}" && bash scripts/init-environment.sh)
  else
    # フォールバック: 直接 docker compose
    (cd "${repo_root}" && \
      export WORKTREE="${worktree_name}" && \
      export COMPOSE_PROJECT_NAME="${worktree_name}" && \
      docker compose -p "${worktree_name}" -f docker-compose.worktree.yml up -d --build)
  fi

  # 起動確認（最大30秒待機）
  local max_wait=30
  local waited=0
  while ! is_devcontainer_running "${worktree_name}"; do
    if [[ ${waited} -ge ${max_wait} ]]; then
      echo "❌ DevContainer の起動がタイムアウトしました"
      return 1
    fi
    sleep 1
    ((waited++))
  done

  echo "✅ DevContainer 起動完了"
}

# ホストパスをコンテナ内パスに変換
convert_to_container_path() {
  local host_path="$1"
  local repo_root
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

  # ホストパスがリポジトリ内のパスであれば /workspace に変換
  if [[ "${host_path}" == "${repo_root}"* ]]; then
    echo "/workspace${host_path#${repo_root}}"
  else
    echo "${host_path}"
  fi
}

# DevContainer 内でコマンドを実行
# 引数: 実行するコマンド（文字列または配列）
devcontainer_exec() {
  local repo_root
  repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

  # DevContainer 内なら直接実行
  if is_inside_devcontainer; then
    exec "$@"
  fi

  local worktree_name
  worktree_name="$(get_worktree_name "${repo_root}")"
  local repo_name
  repo_name="$(get_repo_name "${repo_root}")"
  local container_name="${worktree_name}-${repo_name}-dev"

  # DevContainer が起動していなければ起動
  if ! is_devcontainer_running "${worktree_name}"; then
    start_devcontainer "${repo_root}"
  fi

  # docker exec で実行
  # TTY が利用可能かどうかで -t フラグを切り替え
  local tty_flag=""
  if [[ -t 0 ]]; then
    tty_flag="-t"
  fi

  # 引数のパスを変換
  local converted_args=()
  for arg in "$@"; do
    converted_args+=("$(convert_to_container_path "${arg}")")
  done

  # コンテナ内で git が動作しないため、REPO_ROOT を環境変数として渡す
  # また、GIT_DIR を無効化してエラーを防ぐ
  docker exec -i ${tty_flag} \
    -e REPO_ROOT=/workspace \
    -e GIT_DIR="" \
    -e GIT_WORK_TREE="" \
    -w /workspace \
    "${container_name}" \
    "${converted_args[@]}"
}

# コマンドを DevContainer 内で実行するかどうかを判定して実行
# 使い方: run_in_context "pnpm" "test"
run_in_context() {
  devcontainer_exec "$@"
}
