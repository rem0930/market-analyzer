# Canonical Agent Instructions (Repository Contract)

このファイルが **唯一の正** です。他のファイル（CLAUDE.md, .github/copilot-instructions.md 等）と矛盾がある場合は、本ファイルに従ってください。

---

## Non-negotiables (絶対ルール)

1. **Worktree + DevContainer で作業する（main 直接編集禁止）**
   - すべての変更は専用ブランチ + worktree で行う（main/master への直接 push 禁止）
   - **作業開始時の必須手順:**
     1. `./tools/worktree/spawn.sh <branch-name>` で worktree を作成
     2. 作成された worktree ディレクトリで **DevContainer を起動**してから作業開始
     3. DevContainer 内で `./tools/contract` コマンドを実行
   - 作業完了後は `./tools/worktree/cleanup.sh` でクリーンアップ
   - 並列作業時は必ず別 worktree を使用（コンフリクト防止）
   - **DevContainer 外での実装作業は禁止**（環境差異によるCI失敗を防止）

2. **DocDD（ドキュメント駆動）を守る**
   - Spec / Plan / AC 無しで実装を開始しない
   - 変更時は関連 Docs（Spec / ADR / Impact / AC / TestPlan）も必ず更新する

3. **Golden Commands は Contract 経由で実行**
   - 直接 `pnpm lint` や `cargo test` を叩かない
   - 必ず `./tools/contract <cmd>` を使う

4. **破壊的変更の禁止**
   - 既存ファイルを無断で上書きしない（差分・追記・移動で対応）

5. **CI / DevContainer / Contract が壊れた状態で完了宣言しない**

6. **HTTP API は OpenAPI 仕様を先に定義する**
   - 手書きで HTTP クライアント/サーバーを実装しない
   - `docs/02_architecture/api/*.yaml` に仕様を配置
   - コード生成ツールでクライアント/スタブを生成

---

## Golden Commands

すべて `./tools/contract` 経由で実行可能。

| Command | Purpose |
|---------|---------|
| `./tools/contract format` | フォーマット（自動修正） |
| `./tools/contract lint` | 静的解析（警告を落とす） |
| `./tools/contract typecheck` | 型チェック（ある場合） |
| `./tools/contract test` | ユニットテスト |
| `./tools/contract build` | ビルド（成果物生成） |
| `./tools/contract e2e` | E2E（WebUI がある場合） |
| `./tools/contract migrate` | DB マイグレーション |
| `./tools/contract deploy-dryrun` | デプロイのドライラン |
| `./tools/contract dev` | 開発サーバー起動（docker-compose） |
| `./tools/contract dev:stop` | 開発サーバー停止 |
| `./tools/contract dev:logs` | 開発サーバーログ表示 |
| `./tools/contract up` | DevContainer + フルスタック環境起動（Traefik ルーティング） |
| `./tools/contract up:stop` | フルスタック環境停止 |
| `./tools/contract up:logs` | フルスタック環境ログ表示 |
| `./tools/contract up:status` | コンテナステータス表示 |

---

## Golden Outputs (必須成果物)

以下が存在し、変更時に更新されていること。

| Path | Description |
|------|-------------|
| `docs/00_process/process.md` | 開発プロセス定義 |
| `docs/01_product/identity.md` | プロダクトアイデンティティ |
| `docs/01_product/prd.md` | PRD（要件定義） |
| `docs/02_architecture/adr/*` | Architecture Decision Records |
| `docs/03_quality/*` | 品質基準・テスト計画 |
| `docs/04_delivery/*` | リリースプロセス |

---

## Technology Stack

このリポジトリは **Node.js + TypeScript + React** に特化しています。

- **Runtime**: Node.js
- **Language**: TypeScript
- **Package Manager**: pnpm (workspace)
- **Backend**: Express / Fastify
- **Frontend**: React
- **Contract Scripts**: `tools/_contract/stack/` に配置
- **Application Code**: `projects/` に配置
  - `projects/apps/` - アプリケーション（api, web 等）
  - `projects/packages/` - 共有パッケージ

---

## Git / Branch / Commit Rules

### ブランチ命名

| Pattern | 例 |
|---------|-----|
| `feat/<issue>-<slug>` | `feat/GH-123-auth-token` |
| `fix/<issue>-<slug>` | `fix/login-null-pointer` |
| `docs/<slug>` | `docs/api-reference` |
| `chore/<slug>` | `chore/update-deps` |

### Conventional Commits（必須）

```
<type>(<scope>): <subject>
```

| Type | 用途 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメントのみ |
| `refactor` | リファクタリング |
| `test` | テスト追加・修正 |
| `chore` | その他 |
| `build` | ビルド・依存関係 |
| `ci` | CI 設定 |

**ルール:**
- `subject` は命令形（add, fix, update）
- 末尾にピリオド不要
- 50-72 文字目安

---

## PR Rules

1. **PR テンプレの該当項目を埋める**
   - Spec / Plan / Impact / AC / Test / Release

2. **PR タイトルは Conventional Commits 形式**
   - squash merge で最終コミットになる
   - 例: `feat(auth): add token rotation`

3. **DocDD リンクを含める**
   - Spec: `.specify/specs/<id>/spec.md`
   - Plan: `.specify/specs/<id>/plan.md`
   - ADR: `docs/02_architecture/adr/<id>.md`

4. **CI が落ちている状態で完了扱いにしない**

---

## Directory Structure

```
.
├── .devcontainer/            # DevContainer 設定
├── .github/                  # GitHub 設定（CI, PR/Issue テンプレ）
├── .specify/                 # Spec 定義
│   └── specs/                # 機能別 Spec
├── projects/                 # アプリケーションコード
│   ├── apps/                 # アプリケーション
│   │   └── api/              # Backend API
│   └── packages/             # 共有パッケージ
│       ├── shared/           # 共通ドメイン・ユーティリティ
│       └── guardrails/       # アーキテクチャガードレール
├── docs/
│   ├── 00_process/           # プロセス定義
│   ├── 01_product/           # プロダクト要件
│   │   ├── design/           # UX/UI 設計
│   │   └── design_system/    # デザインシステム
│   ├── 02_architecture/      # アーキテクチャ
│   │   └── adr/              # ADR
│   ├── 03_quality/           # 品質・テスト
│   └── 04_delivery/          # リリース
├── design/
│   └── tokens/               # デザイントークン
├── prompts/
│   └── skills/               # 再利用可能スキル（詳細ワークフロー）
└── tools/
    ├── contract              # Golden Commands ラッパー
    ├── _contract/            # Golden Commands 実装
    │   ├── contract          # メインスクリプト
    │   ├── lib/              # ヘルパースクリプト
    │   └── stack/            # 各コマンドの実装
    ├── orchestrate/          # Agent Orchestration
    ├── policy/               # ポリシーチェック
    └── worktree/             # Worktree 管理
```

---

## Required Artifacts per Change Type

| Change Type | Required Artifacts |
|-------------|-------------------|
| 新機能 | Spec + Plan + Tasks + Tests |
| アーキ変更 | ADR + Impact Analysis + Migration Plan |
| UI 変更 | UI Requirements + AC update + (Design system update) |
| バグ修正 | Issue link + Tests + (Spec update if behavior change) |

---

## Failure Patterns to Avoid

| ID | Symptom | Prevention |
|----|---------|------------|
| FP01 | Docs が更新されず PR レビュー不能 | PR テンプレに Docs 更新チェック必須 |
| FP02 | 実行コマンドの呼び方がバラバラ | `tools/contract` 経由に統一 |
| FP03 | DevContainer では動くが CI で落ちる | Contract smoke を CI 必須に |
| FP04 | AGENTS.md と他の instructions が矛盾 | AGENTS.md を canonical に |
| FP05 | main で直接作業して worktree 未使用 | 作業開始時に必ず worktree 作成 |
| FP06 | DevContainer 外で作業して環境差異発生 | DevContainer 起動を必須化 |

---

## Agents (役割定義)

エージェントは **並列実行がデフォルト**。read-only エージェントは背景で自動起動。

### Claude Code Sub-Agents（推奨）

Claude Code 使用時は `.claude/agents/` のサブエージェントが自動的に利用されます。

| ID | Purpose | Tools | Mode |
|----|---------|-------|------|
| `repo-explorer` | コードベース探索 | Read, Grep, Glob | read-only, 並列 |
| `security-auditor` | セキュリティ監査 | Read, Grep, Glob | read-only, 並列 |
| `test-runner` | テスト/lint実行 | Bash, Read | 自動実行 |
| `code-reviewer` | コードレビュー | Read, Grep, Glob | read-only, 並列 |
| `implementer` | 最小差分実装 | All | メイン作業 |

**並列実行フロー:**
```
User: "認証機能を追加"
  ├─ repo-explorer: 関連コード探索
  ├─ security-auditor: 認証のセキュリティ確認
  └─ code-reviewer: 既存認証コードの品質確認
      ↓ (結果統合)
  implementer: 実装
      ↓
  test-runner: テスト実行
```

### 概念エージェント（将来拡張用）

以下は設計上の役割定義です。現在は Claude Code Sub-Agents で実装されています。

| ID                    | Purpose            | Status                              |
|-----------------------|--------------------|-------------------------------------|
| `Orchestrator`        | ルーティング       | Claude Code 本体が担当              |
| `ProductIdentity_PdM` | Spec作成           | 手動 / 将来実装予定                 |
| `ProductDesigner`     | UX/UI要件          | 手動 / 将来実装予定                 |
| `DesignSystem`        | デザイントークン   | 手動 / 将来実装予定                 |
| `Architect`           | ADR/Plan作成       | 手動 / 将来実装予定                 |
| `QA`                  | テスト設計         | `test-runner` が一部カバー          |
| `Implementer`         | 実装               | `.claude/agents/implementer.md`     |
| `Reviewer`            | レビュー           | `.claude/agents/code-reviewer.md`   |

---

## Agent Orchestration

Claude Code の Task ツールで並列実行が可能。手動オーケストレーションは `tools/orchestrate/` を参照。

```bash
# 手動オーケストレーション（オプション）
./tools/orchestrate/orchestrate.sh start "認証機能を追加"
./tools/orchestrate/orchestrate.sh status
```

---

## Skills (再利用可能な技能)

失敗パターンを先回りで潰す共通スキル。詳細は `prompts/skills/` および `docs/00_process/skills_catalog.md` を参照。

| ID | Trigger | Purpose |
|----|---------|---------|
| `Skill.Kickoff` | 開発開始時 | Worktree/DevContainer確認、Contract読み込み、DocDD成果物特定 |
| `Skill.Read_Contract_First` | 新タスク開始時 | AGENTS.md と process.md を読み、制約を把握 |
| `Skill.Read_Master_Spec` | 既存機能変更時 | 既存 Spec を読み、仕様を把握してから変更 |
| `Skill.Impact_Analysis` | Spec作成/更新前 | 変更の影響範囲を体系的に分析 |
| `Skill.DocDD_Spec_First` | 機能/アーキ変更時 | Spec/Plan/Tasks を先に作成してから実装 |
| `Skill.Minimize_Diff` | CI失敗/レビュー指摘時 | 原因を1つに絞り最小差分に収束 |
| `Skill.Fix_CI_Fast` | contract failing | 依存→設定→環境の順で切り分け、3ループで止める |
| `Skill.Policy_Docs_Drift` | コード変更時 | 必要なdocs更新を同PRで実施 |
| `Skill.Review_As_Staff` | Reviewer起動時 | DocDDリンク確認、NFR観点、rollback妥当性 |
| `Skill.DevContainer_Safe_Mode` | firewall/permission問題時 | allowlist確認、safeプロファイル維持 |
| `Skill.OpenAPI_Contract_First` | HTTP API設計/実装時 | OpenAPI仕様を先に定義、コード生成活用 |
| `Skill.Horizontal_Guardrails` | 実装/レビュー時 | 横のガードレールでアーキテクチャ維持 |

**Templates**: `.specify/templates/` に Spec/Plan/Tasks のテンプレートあり

---

## Autonomy Configuration

エージェントの自律動作に関する設定。

| Setting | Value | Description |
|---------|-------|-------------|
| `risk_profile` | `safe` | 危険操作は必ず確認を求める |
| `allow_auto_commit` | `true` | 自動コミット許可 |
| `allow_auto_pr` | `true` | 自動PR作成許可 |
| `dangerously_skip_permissions` | `false` | 危険なpermission skip禁止 |

**safe モード**: 自動実行はするが、以下は明示承認が必要
- force push
- main/master への直接 push
- 既存ファイルの削除
- セキュリティ設定の変更

---

## Related Documents

- Agent Operating Model: `docs/00_process/agent_operating_model.md`
- Skills Catalog: `docs/00_process/skills_catalog.md`
- Skill Prompts (detailed workflows): `prompts/skills/`
- **Claude Code Configuration**: `.claude/`
  - Sub-Agents: `.claude/agents/`
  - Skills (domain knowledge): `.claude/skills/`
  - Rules (always-applied): `.claude/rules/`
  - Commands (slash commands): `.claude/commands/`

