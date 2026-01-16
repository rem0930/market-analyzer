# Canonical Agent Instructions (Repository Contract)

このファイルが **唯一の正** です。他のファイル（CLAUDE.md, .github/copilot-instructions.md 等）と矛盾がある場合は、本ファイルに従ってください。

---

## Non-negotiables (絶対ルール)

1. **DocDD（ドキュメント駆動）を守る**
   - Spec / Plan / AC 無しで実装を開始しない
   - 変更時は関連 Docs（Spec / ADR / Impact / AC / TestPlan）も必ず更新する

2. **Golden Commands は Contract 経由で実行**
   - 直接 `pnpm lint` や `cargo test` を叩かない
   - 必ず `./tools/contract <cmd>` を使う

3. **破壊的変更の禁止**
   - 既存ファイルを無断で上書きしない（差分・追記・移動で対応）
   - Kickoff の scaffold は `rsync --ignore-existing` で非破壊

4. **CI / DevContainer / Contract が壊れた状態で完了宣言しない**

5. **HTTP API は OpenAPI 仕様を先に定義する**
   - 手書きで HTTP クライアント/サーバーを実装しない
   - `docs/02_architecture/api/*.yaml` に仕様を配置
   - コード生成ツールでクライアント/スタブを生成

---

## Golden Commands

すべて `./tools/contract` 経由で実行可能。Active Stack によって内部実装が切り替わる。

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

## Stack Pack Rules

- **Active Stack**: `.repo/active-stack` に記載
- **Stack Pack 定義**: `stacks/<stack_id>/manifest.yaml`
- **Contract Scripts**: `stacks/<stack_id>/contract/{format,lint,typecheck,test,build,e2e,migrate,deploy-dryrun}`
- **Projects Directory**: `projects/` にアプリケーションコードを配置

Stack Pack は必ず contract scripts を提供すること。

### Auto Scaffold

DevContainer 起動時に `projects/` が空の場合、自動的に scaffold が適用される：
- 人間が明示的にコマンドを実行する必要なし
- `postStartCommand` で `./tools/kickoff/auto-scaffold.sh` が実行される
- 依存関係も自動インストール

### Stack Selection (技術スタック未設定時)

`active-stack` が未設定の場合、エージェントが対話的に技術スタックを決定：
1. ユーザーに「何を作りたいか」を質問
2. 利用可能なスタックから最適なものを推薦
3. `./tools/kickoff/select-stack.sh <stack_id>` でプロジェクトを初期化

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
├── .repo/                    # リポジトリメタデータ
│   └── active-stack          # 現在選択中の Stack ID
├── .devcontainer/            # DevContainer 設定
├── .github/                  # GitHub 設定（CI, PR/Issue テンプレ）
├── .specify/                 # Spec 定義
│   └── specs/                # 機能別 Spec
├── projects/                 # アプリケーションコード（自動生成）
│   ├── apps/                 # アプリケーション
│   └── packages/             # 共有パッケージ
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
│   ├── agents/               # エージェント別プロンプト
│   └── skills/               # 再利用可能スキル
├── stacks/                   # Stack Pack 定義（初回起動後に削除）
│   └── <stack_id>/
│       ├── manifest.yaml
│       ├── devcontainer/
│       ├── contract/
│       └── scaffold/
└── tools/
    ├── contract/             # Golden Commands エントリポイント
    ├── kickoff/              # 初期セットアップ（auto-scaffold含む）
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
| FP02 | スタックごとに lint/test の呼び方が違う | `tools/contract` 経由に統一 |
| FP03 | DevContainer では動くが CI で落ちる | Contract smoke を CI 必須に |
| FP04 | Kickoff が既存ファイルを破壊 | `rsync --ignore-existing` |
| FP05 | AGENTS.md と他の instructions が矛盾 | AGENTS.md を canonical に |

---

## Agents (役割定義)

各エージェントは責務・入力・出力・ゲートを持つ。詳細は `prompts/agents/` を参照。

| ID | Purpose | Key Outputs | Gate |
|----|---------|-------------|------|
| `Orchestrator` | リクエストをルーティング、worktree管理 | routing decision, worktree context | 適切なエージェントに割り当て |
| `RepoKickoff` | 新規リポジトリを初期化 | repo skeleton, CI, README | policy/docdd が成功, contract が通る |
| `ProductIdentity_PdM` | プロダクト意図・Spec作成 | identity.md, prd.md, spec.md | AC/NFRが存在 |
| `ProductDesigner` | UX/IA/UI要件整備 | ux_flows.md, ui_requirements.md | ACとUI要件の整合 |
| `DesignSystem` | デザイン契約を固定 | tokens.json, overview.md | 命名規則が文書化 |
| `Architect` | ADR/Planを作成 | adr/*.md, plan.md | 代替案/トレードオフ記載 |
| `QA` | テスト設計と検証 | test-plan/*.md, evidence/* | ACカバレッジ |
| `Implementer` | 最小差分で実装 | code + tests + docs | contract 成功, docs drift なし |
| `Reviewer` | Staff視点でレビュー | review comments | DocDDリンク完備 |

---

## Agent Orchestration

複数エージェントを worktree ベースで並列実行する仕組み。

```bash
# タスクを開始（自動ルーティング）
./tools/orchestrate/orchestrate.sh start "認証機能を追加"

# 状態確認
./tools/orchestrate/orchestrate.sh status

# モニタリング
./tools/orchestrate/monitor.sh --watch
```

詳細: `tools/orchestrate/README.md`

---

## Skills (再利用可能な技能)

失敗パターンを先回りで潰す共通スキル。詳細は `prompts/skills/` および `docs/00_process/skills_catalog.md` を参照。

| ID | Trigger | Purpose |
|----|---------|---------|
| `Skill.Read_Contract_First` | 新タスク開始時 | AGENTS.md と process.md を読み、制約を把握 |
| `Skill.DocDD_Spec_First` | 機能/アーキ変更時 | Spec/Plan/Tasks を先に作成してから実装 |
| `Skill.Minimize_Diff` | CI失敗/レビュー指摘時 | 原因を1つに絞り最小差分に収束 |
| `Skill.Fix_CI_Fast` | contract failing | 依存→設定→環境の順で切り分け、3ループで止める |
| `Skill.Policy_Docs_Drift` | コード変更時 | 必要なdocs更新を同PRで実施 |
| `Skill.Review_As_Staff` | Reviewer起動時 | DocDDリンク確認、NFR観点、rollback妥当性 |
| `Skill.DevContainer_Safe_Mode` | firewall/permission問題時 | allowlist確認、safeプロファイル維持 |
| `Skill.OpenAPI_Contract_First` | HTTP API設計/実装時 | OpenAPI仕様を先に定義、コード生成活用 |

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
- Agent Prompts: `prompts/agents/`
- Skill Prompts: `prompts/skills/`

