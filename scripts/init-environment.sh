#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR"

echo "🔍 Detecting environment..."

is_worktree() {
    [[ -f "$ROOT_DIR/.git" ]]
}

get_worktree_name() {
    basename "$ROOT_DIR"
}

ensure_traefik() {
    bash "$SCRIPT_DIR/ensure-traefik.sh"
}

prepare_env() {
    local worktree_name="$1"
    if [[ ! -f .env ]]; then
        cat > .env << EOF
WORKTREE=$worktree_name
COMPOSE_PROJECT_NAME=$worktree_name
EOF
    else
        sed -i.bak "s/^WORKTREE=.*/WORKTREE=$worktree_name/" .env && rm -f .env.bak
    fi
    export WORKTREE="$worktree_name"
}

main() {
    ensure_traefik

    local name
    if is_worktree; then
        echo "📂 Detected: worktree"
        name=$(get_worktree_name)
    else
        echo "📂 Detected: root repository"
        name="main"
    fi

    prepare_env "$name"
    echo "🚀 Starting services for: $name"
    docker compose -p "$name" -f docker-compose.worktree.yml up -d --build
    echo "✅ Ready! Frontend: http://fe.${name}.localhost | Backend: http://be.${name}.localhost"
}

main "$@"
