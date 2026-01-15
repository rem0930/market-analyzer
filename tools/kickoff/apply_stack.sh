#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${REPO_ROOT}"

stack_id="${1:-}"

if [[ -z "${stack_id}" ]]; then
  echo "usage: ./tools/kickoff/apply_stack.sh <stack_id>"
  echo ""
  echo "Available stacks:"
  for dir in stacks/*/; do
    if [[ -d "${dir}" ]]; then
      name=$(basename "${dir}")
      if [[ "${name}" != ".gitkeep" && -f "${dir}manifest.yaml" ]]; then
        label=$(grep "^label:" "${dir}manifest.yaml" | cut -d'"' -f2 || echo "")
        echo "  ${name} - ${label}"
      fi
    fi
  done
  exit 2
fi

stack_dir="stacks/${stack_id}"

if [[ ! -d "${stack_dir}" ]]; then
  echo "ERROR: Stack not found: ${stack_dir}"
  echo ""
  echo "Available stacks:"
  ls -1 stacks 2>/dev/null | grep -v ".gitkeep" || echo "  (none)"
  exit 2
fi

if [[ ! -f "${stack_dir}/manifest.yaml" ]]; then
  echo "ERROR: manifest.yaml not found in ${stack_dir}"
  exit 2
fi

echo "Applying stack: ${stack_id}"

# 1. Set active stack
echo "${stack_id}" > .repo/active-stack
echo "  ✓ Set active stack"

# 2. Apply devcontainer template (overwrite allowed - deterministic)
if [[ -f "${stack_dir}/devcontainer/devcontainer.json" ]]; then
  mkdir -p .devcontainer
  cp -f "${stack_dir}/devcontainer/devcontainer.json" ".devcontainer/devcontainer.json"
  echo "  ✓ Applied devcontainer.json"
fi

# 3. Apply scaffold (idempotent: only create if missing)
if [[ -d "${stack_dir}/scaffold" ]]; then
  if command -v rsync &> /dev/null; then
    rsync -a --ignore-existing "${stack_dir}/scaffold/" "./"
  else
    # Fallback for systems without rsync
    find "${stack_dir}/scaffold" -type f | while read src; do
      dest="${src#${stack_dir}/scaffold/}"
      if [[ ! -f "${dest}" ]]; then
        mkdir -p "$(dirname "${dest}")"
        cp "${src}" "${dest}"
      fi
    done
  fi
  echo "  ✓ Applied scaffold (non-destructive)"
fi

# 4. Make contract scripts executable
if [[ -d "${stack_dir}/contract" ]]; then
  chmod +x "${stack_dir}/contract/"* 2>/dev/null || true
  echo "  ✓ Made contract scripts executable"
fi

echo ""
echo "Stack '${stack_id}' applied successfully!"
echo ""
echo "Next steps:"
echo "  1. Reopen in DevContainer (if using VSCode/Cursor)"
echo "  2. Run: ./tools/contract lint"
echo "  3. Run: ./tools/contract test"
echo "  4. Run: ./tools/contract build"
