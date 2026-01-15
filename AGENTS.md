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

Stack Pack は必ず contract scripts を提供すること。

---

## PR Rules

1. **PR テンプレの該当項目を埋める**
   - Spec / Plan / Impact / AC / Test / Release

2. **Conventional Commits を推奨**
   ```
   feat: 新機能
   fix: バグ修正
   docs: ドキュメントのみ
   refactor: リファクタリング
   test: テスト追加・修正
   chore: その他
   ```

3. **CI が落ちている状態で完了扱いにしない**

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
│   └── agents/               # エージェント別プロンプト
├── stacks/                   # Stack Pack 定義
│   └── <stack_id>/
│       ├── manifest.yaml
│       ├── devcontainer/
│       ├── contract/
│       └── scaffold/
└── tools/
    ├── contract/             # Golden Commands エントリポイント
    ├── kickoff/              # 初期セットアップ
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
