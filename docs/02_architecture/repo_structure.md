# Repository Structure

このドキュメントはリポジトリの構造と各ディレクトリの役割を説明します。

---

## Directory Overview

```
.
├── .repo/                    # リポジトリメタデータ
├── .devcontainer/            # DevContainer 設定（Stack Packから適用）
├── .github/                  # GitHub 設定
├── .specify/                 # Spec 定義
├── design/                   # デザインアセット
├── docs/                     # ドキュメント
├── prompts/                  # エージェントプロンプト
├── stacks/                   # Stack Pack 定義
└── tools/                    # ツール・スクリプト
```

---

## Detailed Structure

### `.repo/`

リポジトリのメタデータを格納。

| File | Description |
|------|-------------|
| `active-stack` | 現在選択中の Stack ID |

### `.devcontainer/`

DevContainer 設定。Stack Pack 適用時に上書きされる。

### `.github/`

GitHub 関連の設定。

```
.github/
├── workflows/
│   └── ci.yml              # CI 設定
├── PULL_REQUEST_TEMPLATE/  # PR テンプレート（複数）
│   ├── 01_spec.md
│   ├── 02_plan.md
│   ├── 03_implement.md
│   └── 04_release.md
├── ISSUE_TEMPLATE/         # Issue テンプレート
│   ├── feature_request.yml
│   ├── bug_report.yml
│   └── config.yml
└── pull_request_template.md # デフォルト PR テンプレート
```

### `.specify/`

機能の Spec（仕様）を格納。

```
.specify/
└── specs/
    └── <feature_id>/
        └── spec.md
```

### `design/`

デザインアセットを格納。

```
design/
└── tokens/
    ├── README.md
    └── tokens.json
```

### `docs/`

ドキュメントを格納。

```
docs/
├── 00_process/           # プロセス定義
│   └── process.md
├── 01_product/           # プロダクト要件
│   ├── identity.md
│   ├── prd.md
│   ├── glossary.md
│   ├── design/           # UX/UI 設計
│   └── design_system/    # デザインシステム
├── 02_architecture/      # アーキテクチャ
│   ├── adr/              # ADR
│   ├── repo_structure.md
│   └── impact_analysis_template.md
├── 03_quality/           # 品質・テスト
│   ├── template_acceptance_criteria.md
│   └── verification_runbook.md
└── 04_delivery/          # リリース
    └── release_process.md
```

### `prompts/`

エージェント用プロンプトを格納。

```
prompts/
└── agents/
    ├── repo_kickoff.md
    ├── pdm.md
    ├── designer.md
    ├── design_system.md
    └── architect.md
```

### `stacks/`

Stack Pack 定義を格納。

```
stacks/
└── <stack_id>/
    ├── manifest.yaml     # メタデータ
    ├── devcontainer/     # DevContainer 設定
    │   └── devcontainer.json
    ├── contract/         # Contract スクリプト
    │   ├── format
    │   ├── lint
    │   ├── typecheck
    │   ├── test
    │   ├── build
    │   ├── e2e
    │   ├── migrate
    │   └── deploy-dryrun
    └── scaffold/         # 初期ファイル
```

### `tools/`

ツール・スクリプトを格納。

```
tools/
├── contract/             # Golden Commands エントリポイント
│   └── contract
├── kickoff/              # 初期セットアップ
│   └── apply_stack.sh
├── policy/               # ポリシーチェック
│   ├── check_required_artifacts.sh
│   └── check_contract_docs.sh
└── worktree/             # Worktree 管理（将来拡張）
```

---

## Key Design Decisions

1. **Docs は `docs/` に集約**: 散らばらない
2. **スタック差分は `stacks/` に隔離**: コア構造に影響しない
3. **ツールは `tools/` に集約**: 実行可能スクリプトの場所が明確
4. **DevContainer は適用時に上書き**: Stack Pack が決定するまで空でもOK

---

## Links

- [AGENTS.md](../../AGENTS.md) - Canonical Instructions
- [docs/02_architecture/adr/0001_contract_and_stack_pack.md](adr/0001_contract_and_stack_pack.md) - ADR
