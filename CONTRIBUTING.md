# Contributing Guide

このリポジトリへの貢献方法を説明します。

## はじめに

このリポジトリは **DocDD (Document-Driven Development)** を採用しています。実装を開始する前に、必ず Spec / Plan を作成・レビューしてください。

## クイックスタート

### 1. 環境セットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd <repository-name>

# 依存関係をインストール（commitlint + husky）
npm install
```

### 2. ブランチを作成

```bash
# 機能追加
git checkout -b feat/GH-123-feature-name

# バグ修正
git checkout -b fix/GH-456-bug-description

# ドキュメント
git checkout -b docs/update-readme
```

### 3. コミット

```bash
# Conventional Commits 形式で
git commit -m "feat: add new feature"
git commit -m "fix(auth): resolve null pointer"
git commit -m "docs: update API reference"
```

### 4. PR を作成

- PR タイトルも Conventional Commits 形式で
- テンプレートを使用して必要項目を記入
- Spec / Plan へのリンクを含める

---

## ブランチ命名規則

| Pattern | 用途 | 例 |
|---------|------|-----|
| `feat/<issue>-<slug>` | 新機能 | `feat/GH-123-auth-token` |
| `fix/<issue>-<slug>` | バグ修正 | `fix/login-null-pointer` |
| `docs/<slug>` | ドキュメント | `docs/api-reference` |
| `chore/<slug>` | メンテナンス | `chore/update-deps` |

---

## コミット規約

[Conventional Commits](https://www.conventionalcommits.org/) を採用しています。

```
<type>(<scope>): <subject>
```

**Type:**
- `feat` - 新機能
- `fix` - バグ修正
- `docs` - ドキュメント
- `refactor` - リファクタリング
- `test` - テスト
- `chore` - その他

**例:**
```
feat(auth): add token rotation support
fix: resolve null pointer in login flow
docs: update installation guide
```

---

## PR ガイドライン

### 必須事項

1. **PR タイトル**: Conventional Commits 形式
2. **Spec リンク**: 新機能の場合は必須
3. **CI パス**: 全ての required checks がパス

### PR テンプレート

4種類のテンプレートがあります：

- `01_spec.md` - Spec 追加・更新
- `02_plan.md` - 実装計画
- `03_implement.md` - 実装
- `04_release.md` - リリース

### レビュー

- CODEOWNERS で自動アサイン
- 最小 1 名のレビューが必要

---

## 開発コマンド

すべて `./tools/contract` 経由で実行：

```bash
./tools/contract format    # フォーマット
./tools/contract lint      # Lint
./tools/contract test      # テスト
./tools/contract build     # ビルド
```

---

## 詳細ドキュメント

- [Git / PR Governance](docs/00_process/git_and_pr_governance.md)
- [Development Process](docs/00_process/process.md)
- [AGENTS.md](AGENTS.md) - AI エージェント向け規約

---

## 質問・問題

Issue を作成してください。テンプレートを使用してください：

- 機能リクエスト: Feature Request テンプレート
- バグ報告: Bug Report テンプレート
