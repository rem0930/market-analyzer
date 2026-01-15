#!/usr/bin/env bash
#
# Auto Scaffold Script
#
# DevContainer起動時に自動実行され、projects/が空なら
# active-stackに基づいてプロジェクトをセットアップします。
#
# 人間が明示的にコマンドを実行する必要はありません。
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${REPO_ROOT}"

# ===== Helper Functions =====
log_info() {
  echo "[auto-scaffold] $1"
}

log_success() {
  echo "[auto-scaffold] ✓ $1"
}

log_skip() {
  echo "[auto-scaffold] ⏭ $1"
}

# ===== Check if projects directory has any content =====
is_projects_empty() {
  local projects_dir="${REPO_ROOT}/projects"

  # projectsディレクトリが存在しない場合
  if [[ ! -d "${projects_dir}" ]]; then
    return 0  # empty
  fi

  # .gitkeep以外のファイル/ディレクトリが存在するかチェック
  local count
  count=$(find "${projects_dir}" -mindepth 1 -maxdepth 1 ! -name '.gitkeep' | wc -l)

  if [[ "${count}" -eq 0 ]]; then
    return 0  # empty
  else
    return 1  # not empty
  fi
}

# ===== Get default stack =====
get_configured_stack() {
  # active-stackが設定されていて有効なら使う
  if [[ -f "${REPO_ROOT}/.repo/active-stack" ]]; then
    local active
    active=$(cat "${REPO_ROOT}/.repo/active-stack" | grep -v "^#" | tr -d '[:space:]')
    if [[ -n "${active}" ]] && [[ -d "${REPO_ROOT}/stacks/${active}" ]]; then
      echo "${active}"
      return 0
    fi
  fi

  # 未設定の場合は空を返す（自動選択しない）
  return 1
}

# ===== Apply scaffold to projects directory =====
apply_scaffold() {
  local stack_id="$1"
  local stack_dir="${REPO_ROOT}/stacks/${stack_id}"
  local projects_dir="${REPO_ROOT}/projects"

  log_info "Applying stack: ${stack_id}"

  # Validate stack exists
  if [[ ! -d "${stack_dir}" ]]; then
    echo "ERROR: Stack not found: ${stack_dir}"
    return 1
  fi

  if [[ ! -f "${stack_dir}/manifest.yaml" ]]; then
    echo "ERROR: manifest.yaml not found in ${stack_dir}"
    return 1
  fi

  # 1. Set active stack
  mkdir -p "${REPO_ROOT}/.repo"
  echo "${stack_id}" > "${REPO_ROOT}/.repo/active-stack"
  log_success "Set active stack: ${stack_id}"

  # 2. Apply devcontainer template
  if [[ -f "${stack_dir}/devcontainer/devcontainer.json" ]]; then
    mkdir -p "${REPO_ROOT}/.devcontainer"
    # 既存のdevcontainer.jsonがある場合はマージが必要なので、新規作成時のみ
    if [[ ! -f "${REPO_ROOT}/.devcontainer/devcontainer.json" ]]; then
      cp -f "${stack_dir}/devcontainer/devcontainer.json" "${REPO_ROOT}/.devcontainer/devcontainer.json"
      log_success "Applied devcontainer.json"
    else
      log_skip "devcontainer.json already exists (keeping current)"
    fi
  fi

  # 3. Apply scaffold to projects directory
  if [[ -d "${stack_dir}/scaffold" ]]; then
    mkdir -p "${projects_dir}"

    # scaffoldの内容をprojects/にコピー（非破壊的）
    if command -v rsync &> /dev/null; then
      rsync -a --ignore-existing "${stack_dir}/scaffold/" "${projects_dir}/"
    else
      # rsyncがない場合のfallback
      find "${stack_dir}/scaffold" -type f | while read src; do
        dest="${projects_dir}/${src#${stack_dir}/scaffold/}"
        if [[ ! -f "${dest}" ]]; then
          mkdir -p "$(dirname "${dest}")"
          cp "${src}" "${dest}"
        fi
      done
    fi
    log_success "Applied scaffold to projects/ (non-destructive)"
  fi

  # 4. Copy contract scripts
  if [[ -d "${stack_dir}/contract" ]]; then
    mkdir -p "${REPO_ROOT}/tools/contract/stack"
    cp -r "${stack_dir}/contract/"* "${REPO_ROOT}/tools/contract/stack/"
    chmod +x "${REPO_ROOT}/tools/contract/stack/"* 2>/dev/null || true
    log_success "Copied contract scripts"
  fi

  # 5. Install dependencies if package.json exists
  if [[ -f "${projects_dir}/package.json" ]]; then
    log_info "Installing dependencies..."
    cd "${projects_dir}"
    if command -v pnpm &> /dev/null; then
      pnpm install --frozen-lockfile 2>/dev/null || pnpm install || true
      log_success "Installed dependencies with pnpm"
    elif command -v npm &> /dev/null; then
      npm install || true
      log_success "Installed dependencies with npm"
    fi
    cd "${REPO_ROOT}"
  fi

  return 0
}

# ===== Main =====
main() {
  log_info "Checking projects directory..."

  # projects/が空でなければスキップ
  if ! is_projects_empty; then
    log_skip "projects/ is not empty, skipping auto-scaffold"
    exit 0
  fi

  log_info "projects/ is empty, checking for configured stack..."

  # stacksディレクトリが存在しない場合（既にapply済み）
  if [[ ! -d "${REPO_ROOT}/stacks" ]]; then
    log_skip "stacks/ directory not found (already applied?)"
    exit 0
  fi

  # 設定済みのstackを取得
  local stack_id
  if ! stack_id=$(get_configured_stack); then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🚀 Welcome! Let's set up your project."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "No technology stack is configured yet."
    echo "Tell the AI assistant what you want to build, and it will:"
    echo ""
    echo "  1. Ask about your project requirements"
    echo "  2. Recommend a suitable technology stack"
    echo "  3. Set up the project automatically"
    echo ""
    echo "Available stacks:"
    for dir in "${REPO_ROOT}"/stacks/*/; do
      if [[ -d "${dir}" ]] && [[ -f "${dir}manifest.yaml" ]]; then
        local name label
        name=$(basename "${dir}")
        label=$(grep "^label:" "${dir}manifest.yaml" | cut -d'"' -f2 2>/dev/null || echo "")
        echo "  - ${name}: ${label}"
      fi
    done
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
  fi

  # scaffoldを適用
  if apply_scaffold "${stack_id}"; then
    echo ""
    log_success "Auto-scaffold complete!"
    echo ""
    echo "Project initialized with stack '${stack_id}'"
    echo "Your code is in: projects/"
    echo ""
    echo "Available commands:"
    echo "  ./tools/contract format    # Auto-format"
    echo "  ./tools/contract lint      # Static analysis"
    echo "  ./tools/contract test      # Run tests"
    echo "  ./tools/contract build     # Build"
  else
    echo "ERROR: Auto-scaffold failed"
    exit 1
  fi
}

main "$@"
