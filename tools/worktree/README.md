# Git Worktree 並列開発ガイド

## 概要

`git worktree` を使用すると、同一リポジトリで複数のブランチを同時にチェックアウトして作業できます。これにより、ブランチ切り替えのオーバーヘッドなく並列開発が可能になります。

## Agent Orchestration との連携

本リポジトリでは、AI エージェントの並列実行に worktree を活用しています。

```bash
# Orchestrator 経由で自動的に worktree を作成
./tools/orchestrate/orchestrate.sh start "認証機能を追加"

# 手動でエージェント用 worktree を作成
./tools/worktree/spawn.sh implementer feat/GH-123-auth

# 状態確認
./tools/worktree/status.sh

# クリーンアップ
./tools/worktree/cleanup.sh --merged
```

詳細: [Agent Orchestration README](../orchestrate/README.md)

## 基本コマンド

### Worktree の作成

```bash
# 既存ブランチを別ディレクトリにチェックアウト
git worktree add ../my-repo-feature-x feat/GH-123-feature-x

# 新規ブランチを作成してチェックアウト
git worktree add -b feat/GH-456-feature-y ../my-repo-feature-y
```

### Worktree の一覧

```bash
git worktree list
```

### Worktree の削除

```bash
# ディレクトリを削除
rm -rf ../my-repo-feature-x

# Git の追跡を解除
git worktree prune
```

または：

```bash
git worktree remove ../my-repo-feature-x
```

## 推奨ディレクトリ構造

```
~/projects/
├── my-repo/              # メインの worktree (main ブランチ)
├── my-repo-feature-a/    # 機能 A の worktree
├── my-repo-feature-b/    # 機能 B の worktree
└── my-repo-hotfix/       # 緊急修正用の worktree
```

## 命名規則

```bash
# <repo-name>-<branch-type>-<short-description>
git worktree add ../my-repo-feat-auth feat/GH-123-auth
git worktree add ../my-repo-fix-login fix/login-bug
```

## ユースケース

### 1. レビュー中に別作業

```bash
# PR がレビュー中の間、別機能を開発
git worktree add ../my-repo-feature-b feat/GH-456-feature-b
cd ../my-repo-feature-b
# 作業開始
```

### 2. 緊急対応

```bash
# 現在の作業を中断せずに hotfix
git worktree add ../my-repo-hotfix hotfix/GH-789-urgent-fix
cd ../my-repo-hotfix
# 修正して PR 作成
```

### 3. 複数バージョンの検証

```bash
# main と feature ブランチを同時に起動して比較
git worktree add ../my-repo-main main
git worktree add ../my-repo-feature feat/new-feature
# 両方で開発サーバーを起動して比較
```

## 注意事項

### 同一ブランチの制限

同じブランチを複数の worktree でチェックアウトすることはできません。

```bash
# これはエラーになる
git worktree add ../another-main main
# fatal: 'main' is already checked out
```

### 依存関係

各 worktree で依存関係をインストールする必要があります：

```bash
cd ../my-repo-feature-x
npm install  # または適切なパッケージマネージャ
```

### DevContainer との併用

DevContainer を使用する場合、各 worktree を別々のコンテナで開くことを推奨：

1. VS Code で worktree ディレクトリを開く
2. "Reopen in Container" を選択

## クリーンアップ

定期的に不要な worktree を削除：

```bash
# マージ済みの worktree を確認
git worktree list

# 不要な worktree を削除
git worktree remove ../my-repo-merged-feature

# 手動削除した worktree の追跡を解除
git worktree prune
```

## 関連ドキュメント

- [Git Worktree 公式ドキュメント](https://git-scm.com/docs/git-worktree)
- [Git / PR Governance](../../docs/00_process/git_and_pr_governance.md)
