# Git / PR Governance

このドキュメントは、リポジトリにおける Git 運用・ブランチ戦略・PR ルールを定義します。

---

## ブランチ戦略

### Branching Model

| 項目 | 設定 |
|------|------|
| Model | trunk-based |
| Default branch | `main` |
| Merge strategy | squash |
| Linear history | 推奨 |
| Merge queue | 推奨（大規模時） |

### ブランチ命名規則

| Pattern | 用途 | 例 |
|---------|------|-----|
| `feat/<issue-or-topic>-<slug>` | 新機能 | `feat/GH-123-auth-token-rotation` |
| `fix/<issue-or-topic>-<slug>` | バグ修正 | `fix/login-null-pointer` |
| `docs/<topic>-<slug>` | ドキュメント | `docs/api-reference-update` |
| `chore/<topic>-<slug>` | メンテナンス | `chore/update-dependencies` |
| `refactor/<topic>-<slug>` | リファクタ | `refactor/auth-module` |

**命名の原則:**
- 短く、grep しやすい
- Issue 番号があれば含める（`GH-123`）
- スペースやアンダースコアは使わない（ハイフンを使う）

---

## コミット規約

### Conventional Commits

本リポジトリでは [Conventional Commits](https://www.conventionalcommits.org/) を採用します。

**フォーマット:**

```
<type>(<scope>): <subject>

[body]

[footer]
```

**Type 一覧:**

| Type | 説明 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみの変更 |
| `style` | コードの意味に影響しない変更（空白、フォーマット等） |
| `refactor` | バグ修正でも機能追加でもないコード変更 |
| `perf` | パフォーマンス改善 |
| `test` | テストの追加・修正 |
| `build` | ビルドシステム・外部依存の変更 |
| `ci` | CI 設定の変更 |
| `chore` | その他の変更 |
| `revert` | コミットの取り消し |

**ルール:**
- `scope` は任意（省略可）
- `subject` は命令形（例: add, fix, update）
- `subject` の末尾にピリオド不要
- 50-72 文字目安

**例:**

```
feat(auth): add token rotation support

Implements automatic token rotation with configurable intervals.

Refs: GH-123
```

### ローカル強制

commitlint + git hooks で自動チェックします。

```bash
# セットアップ（DevContainer では自動実行）
./tools/git-hooks/install.sh

# コミット時に自動チェック
git commit -m "feat: add new feature"
```

### Protected Branch Enforcement

main/master ブランチへの直接コミット・プッシュはローカル git hooks でブロックされます。

```bash
# hooks のインストール（DevContainer では自動）
./tools/git-hooks/install.sh

# 作業開始時の確認
./tools/worktree/ensure-worktree.sh
```

**DevContainer 起動時の自動チェック:**
- `postCreateCommand`: git hooks を自動インストール
- `postStartCommand`: worktree 環境チェックを実行

**ブロックされる操作:**
- main/master/develop への直接コミット（pre-commit hook）
- main/master/develop への直接プッシュ（pre-push hook）

**推奨ワークフロー:**
1. worktree でブランチを作成: `./tools/worktree/spawn.sh implementer feat/GH-123-feature`
2. 作業ブランチで開発・コミット
3. PR を作成してマージ

### CI 強制

PR の全コミット、または PR タイトルを CI でチェックします。

> **Note**: `merge_strategy=squash` の場合、PR タイトルが最終コミットメッセージになるため、PR タイトルも Conventional Commits 形式で書いてください。

---

## PR ルール

### DocDD (Document-Driven Development)

PR は必ず以下のリンクを含むこと：

| 項目 | 必須 | パス例 |
|------|------|--------|
| Spec | ○（新機能） | `.specify/specs/<id>/spec.md` |
| Plan | ○（新機能） | `.specify/specs/<id>/plan.md` |
| ADR | △（アーキ変更時） | `docs/02_architecture/adr/<id>.md` |
| Impact | △（破壊的変更時） | `docs/02_architecture/impact_analysis/<id>.md` |
| AC/Test | △（機能変更時） | `docs/03_quality/*` |
| Release | △（リリース時） | `docs/04_delivery/*` |

### PR テンプレート

4種類の PR テンプレートを用意しています：

| テンプレート | 用途 |
|-------------|------|
| [01_spec.md](.github/PULL_REQUEST_TEMPLATE/01_spec.md) | Spec 追加・更新 |
| [02_plan.md](.github/PULL_REQUEST_TEMPLATE/02_plan.md) | 実装計画 |
| [03_implement.md](.github/PULL_REQUEST_TEMPLATE/03_implement.md) | 実装 |
| [04_release.md](.github/PULL_REQUEST_TEMPLATE/04_release.md) | リリース |

新規 PR 作成時は URL パラメータでテンプレートを指定：

```
https://github.com/<owner>/<repo>/compare/<branch>?template=03_implement.md
```

### PR タイトル

Conventional Commits 形式で記述（squash merge 時の最終コミットになる）：

```
feat(auth): add token rotation support
fix: resolve null pointer in login flow
docs: update API reference
```

### 最小レビュー要件

- **レビュアー**: 1名以上
- **CODEOWNERS**: 必須（該当パスがある場合）
- **CI**: 全 required checks がパス

---

## Branch Protection (GitHub Settings)

以下は GitHub の GUI で設定が必要です。

### main ブランチ保護

| 設定 | 推奨値 | 説明 |
|------|--------|------|
| Require pull request | ✓ | 直接 push 禁止 |
| Required approvals | 1 | 最小レビュアー数 |
| Dismiss stale reviews | ✓ | 変更後は再レビュー |
| Require status checks | ✓ | CI 必須 |
| Required checks | `policy`, `commitlint` | 必須ジョブ |
| Require linear history | ✓ | リベースまたは squash のみ |
| Include administrators | △ | 管理者も同じルールに |

### Merge Queue（大規模リポジトリ向け）

| 設定 | 推奨値 |
|------|--------|
| Enable | ✓ |
| Merge method | Squash |
| Maximum size | 5 |
| Minimum size | 1 |
| Wait time | 5 minutes |

### Rulesets 設定手順

1. **Settings** → **Rules** → **Rulesets** → **New ruleset**
2. Ruleset name: `main-protection`
3. Target branches: `main`
4. Rules:
   - Restrict deletions
   - Require linear history
   - Require a pull request
   - Require status checks to pass
   - Block force pushes

---

## 緊急対応（Emergency Procedure）

緊急 fix が必要な場合の例外手順：

### 条件

- 本番障害で即時対応が必要
- 通常のレビュープロセスを待てない

### 手順

1. **Issue を作成**（後追いでもよい）
2. **ブランチ**: `hotfix/<issue>-<slug>` で作成
3. **PR を作成**:
   - タイトル: `fix!: [HOTFIX] <description>`
   - 本文に障害内容と影響を記載
4. **レビュー**: 可能な限り 1 名以上
5. **マージ**: Admin override を使用（管理者のみ）
6. **後処理**:
   - 根本原因分析（RCA）を Issue にまとめる
   - 必要に応じて Spec / ADR を更新
   - Release Note に明記

### 記録

緊急対応は必ず以下を残す：

- Issue（障害内容、影響、原因）
- PR（対応内容、レビュー記録）
- Release Note（リリース時に明記）

---

## 関連ファイル

| ファイル | 説明 |
|----------|------|
| [AGENTS.md](../AGENTS.md) | エージェント向け規約（canonical） |
| [CONTRIBUTING.md](../CONTRIBUTING.md) | コントリビュータ向けガイド |
| [.github/CODEOWNERS](.github/CODEOWNERS) | コードオーナー定義 |
| [tools/policy/check_pr_contract.sh](../tools/policy/check_pr_contract.sh) | DocDD ポリシーチェック |

---

## 参考

- [Conventional Commits](https://www.conventionalcommits.org/)
- [trunk-based development](https://trunkbaseddevelopment.com/)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
