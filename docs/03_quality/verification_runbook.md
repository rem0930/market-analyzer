# Verification Runbook

テンプレートリポジトリの検証手順書です。

---

## Prerequisites

- Docker Desktop がインストールされている
- VSCode または Cursor がインストールされている
- GitHub CLI (`gh`) がインストールされている

---

## Phase 1: DevContainer 起動

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd <repository-name>

# 2. VSCode/Cursor で開く
code .

# 3. "Dev Containers: Reopen in Container" を実行
# (Command Palette > "Dev Containers: Reopen in Container")
```

**確認項目:**
- [ ] コンテナが正常に起動する
- [ ] ターミナルが開ける
- [ ] zsh が使える

---

## Phase 2: 依存関係インストール

```bash
cd projects
pnpm install
```

**確認項目:**
- [ ] `pnpm install` が成功する
- [ ] `node_modules/` が作成される

---

## Phase 3: Contract コマンド確認

```bash
# ルートディレクトリで実行
cd /workspace

# Format
./tools/contract format

# Lint
./tools/contract lint

# Test
./tools/contract test

# Build
./tools/contract build

# Guardrail
./tools/contract guardrail
```

**確認項目:**
- [ ] 各コマンドが正常に完了する
- [ ] エラーが出ない

---

## Phase 4: Policy 確認

```bash
./tools/policy/check_required_artifacts.sh
./tools/policy/check_docdd_minimum.sh
```

**確認項目:**
- [ ] "Policy OK" と表示される

---

## Phase 5: 開発サーバー確認（オプション）

```bash
./tools/contract dev
# Ctrl+C で停止
./tools/contract dev:stop
```

**確認項目:**
- [ ] サーバーが起動する
- [ ] 停止できる

---

## Troubleshooting

### DevContainer が起動しない

```bash
# Docker が起動しているか確認
docker ps

# Docker のリソースを解放
docker system prune -a
```

### Contract コマンドが失敗する

```bash
# 実行権限を確認
ls -la tools/contract/contract

# 権限を付与
chmod +x tools/contract/contract
chmod +x tools/contract/stack/*
```

### 依存関係エラー

```bash
# node_modules を削除して再インストール
cd projects
rm -rf node_modules
pnpm install
```

---

## Links

- [docs/03_quality/template_acceptance_criteria.md](template_acceptance_criteria.md) - 受入基準
- [AGENTS.md](../../AGENTS.md) - Canonical Instructions
