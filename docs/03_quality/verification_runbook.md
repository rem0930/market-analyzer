# Verification Runbook

テンプレートリポジトリの検証手順です。
新しいリリースや大きな変更の後にこの手順を実行してください。

---

## Prerequisites

- Docker Desktop（または互換環境）がインストールされている
- VSCode または Cursor がインストールされている
- Git がインストールされている

---

## Quick Verification

最低限の検証手順：

```bash
# 1. Policy Check
chmod +x tools/policy/check_required_artifacts.sh
./tools/policy/check_required_artifacts.sh

# 2. Stack の適用（node-ts_pnpm の例）
chmod +x tools/kickoff/apply_stack.sh
./tools/kickoff/apply_stack.sh node-ts_pnpm

# 3. Contract の確認
chmod +x tools/contract/contract
./tools/contract lint
./tools/contract test
./tools/contract build
```

---

## Full Verification

### Phase 1: Repository Structure

```bash
# 必須ディレクトリの存在確認
for dir in .repo .devcontainer .github docs stacks tools; do
  if [ -d "$dir" ]; then
    echo "✓ $dir exists"
  else
    echo "✗ $dir MISSING"
  fi
done
```

### Phase 2: Core Documents

```bash
# 必須ドキュメントの存在確認
./tools/policy/check_required_artifacts.sh
```

### Phase 3: Stack Pack Verification

各 Stack Pack について以下を確認：

```bash
for stack in node-ts_pnpm python_ruff_pytest go_std dotnet_8 java_21_gradle rust_stable; do
  echo "=== Testing $stack ==="
  
  # マニフェストの存在
  if [ -f "stacks/$stack/manifest.yaml" ]; then
    echo "  ✓ manifest.yaml"
  else
    echo "  ✗ manifest.yaml MISSING"
    continue
  fi
  
  # DevContainer の存在
  if [ -f "stacks/$stack/devcontainer/devcontainer.json" ]; then
    echo "  ✓ devcontainer.json"
  else
    echo "  ✗ devcontainer.json MISSING"
  fi
  
  # Contract スクリプトの存在
  for cmd in format lint test build; do
    if [ -f "stacks/$stack/contract/$cmd" ]; then
      echo "  ✓ contract/$cmd"
    else
      echo "  ✗ contract/$cmd MISSING"
    fi
  done
  
  # Scaffold の存在
  if [ -d "stacks/$stack/scaffold" ]; then
    echo "  ✓ scaffold/"
  else
    echo "  ✗ scaffold/ MISSING"
  fi
done
```

### Phase 4: DevContainer Verification

1. VSCode/Cursor でリポジトリを開く
2. スタックを適用: `./tools/kickoff/apply_stack.sh <stack_id>`
3. "Reopen in Container" を実行
4. DevContainer 内で以下を確認:
   ```bash
   ./tools/contract lint
   ./tools/contract test
   ./tools/contract build
   ```

### Phase 5: CI Verification

1. 新しいブランチを作成
2. 小さな変更をコミット
3. PR を作成
4. CI が実行され、すべて通ることを確認

---

## Troubleshooting

### DevContainer が起動しない

1. Docker Desktop が起動しているか確認
2. `.devcontainer/devcontainer.json` が正しいか確認
3. `docker system prune` でクリーンアップを試す

### Contract コマンドが失敗する

1. `.repo/active-stack` の内容を確認
2. 該当するスタックの `contract/` スクリプトが実行可能か確認
3. 必要な依存がインストールされているか確認（DevContainer 内）

### Policy Check が失敗する

1. 不足しているファイルを作成
2. ファイルパスが正しいか確認（大文字小文字注意）

---

## Verification Checklist

| Item | Status | Notes |
|------|--------|-------|
| Policy check passes | ☐ | |
| node-ts_pnpm works | ☐ | |
| python_ruff_pytest works | ☐ | |
| go_std works | ☐ | |
| dotnet_8 works | ☐ | |
| java_21_gradle works | ☐ | |
| rust_stable works | ☐ | |
| DevContainer starts | ☐ | |
| CI passes | ☐ | |

---

## Links

- [docs/03_quality/template_acceptance_criteria.md](template_acceptance_criteria.md) - AC
- [AGENTS.md](../../AGENTS.md) - Canonical Instructions
