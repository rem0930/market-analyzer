# Agent Orchestration Spec

## Overview

人間がタスクを指示すると、適切なエージェントにルーティングし、ワークツリーごとに独立した DevContainer 環境で並列作業を行う仕組み。

## Goals

1. **ルーティング**: 人間の要求を解析し、適切なエージェントに割り当て
2. **環境分離**: 各エージェントは独自の worktree + DevContainer で作業
3. **並列実行**: 複数エージェントが同時に作業可能
4. **自動化**: タスク開始から PR 作成まで自動的に進行

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Human Request                               │
│               "認証機能を追加して"                                │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Orchestrator Agent                              │
│  - 要求を解析し、必要なエージェントを決定                        │
│  - タスクを分解・割り当て                                        │
│  - worktree を作成し DevContainer を起動                         │
└──────┬──────────────┬──────────────┬──────────────┬─────────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│Worktree A│   │Worktree B│   │Worktree C│   │Worktree D│
│DevCont A │   │DevCont B │   │DevCont C │   │DevCont D │
│          │   │          │   │          │   │          │
│PdM Agent │   │Architect │   │Implement │   │QA Agent  │
│          │   │Agent     │   │Agent     │   │          │
└──────────┘   └──────────┘   └──────────┘   └──────────┘
```

## Components

### 1. Orchestrator Agent

**責務:**
- 人間の要求を解析
- 必要なエージェントと順序を決定
- worktree の作成・管理
- DevContainer の起動・停止
- 進捗監視とエラーハンドリング

**入力:**
- 自然言語のタスク指示
- コンテキスト（現在のリポジトリ状態など）

**出力:**
- 実行計画（どのエージェントをどの順序で）
- worktree の作成とエージェント起動

### 2. Worktree Manager

**責務:**
- worktree の作成・削除
- DevContainer の起動・停止
- 環境変数とコンテキストの引き渡し

**機能:**
```bash
# worktree 作成と DevContainer 起動
./tools/worktree/spawn <agent-type> <branch-name> [--context <file>]

# worktree 一覧と状態確認
./tools/worktree/status

# worktree 削除とクリーンアップ
./tools/worktree/cleanup <worktree-path>
```

### 3. Agent Context Protocol

エージェント間でコンテキストを受け渡すための標準形式。

```yaml
# .worktree-context.yaml
task_id: "GH-123"
parent_agent: "orchestrator"
assigned_agent: "implementer"
branch: "feat/GH-123-auth-feature"
worktree_path: "/workspace-auth-feature"

# 引き継ぎコンテキスト
context:
  spec: ".specify/specs/auth/spec.md"
  plan: ".specify/specs/auth/plan.md"
  adr: "docs/02_architecture/adr/0010_auth_design.md"
  
# 成功条件
success_criteria:
  - "contract test passes"
  - "PR created with AC links"
  
# 完了時のコールバック
on_complete:
  notify: "orchestrator"
  next_agent: "qa"
```

## Routing Rules

| Request Pattern | Primary Agent | Support Agents |
|-----------------|---------------|----------------|
| 新機能追加 | PdM → Architect | Implementer, QA |
| バグ修正 | Implementer | QA |
| アーキテクチャ変更 | Architect | Implementer |
| UI 変更 | Designer | PdM, Implementer |
| ドキュメント更新 | (direct) | - |
| テスト追加 | QA | Implementer |

## Workflow Types

### Sequential Workflow (依存関係あり)

```
PdM (spec作成) 
  └─▶ Architect (plan/ADR作成)
        └─▶ Implementer (実装)
              └─▶ QA (テスト・検証)
                    └─▶ Reviewer (レビュー)
```

### Parallel Workflow (独立タスク)

```
Orchestrator
  ├─▶ Worktree A: Implementer (機能A)
  ├─▶ Worktree B: Implementer (機能B)  
  └─▶ Worktree C: Implementer (機能C)
      └─▶ (全完了後) QA が統合テスト
```

## Environment Isolation

### DevContainer の分離

各 worktree は独立した DevContainer を持つ:

1. **ボリューム分離**: `devcontainer-*-${devcontainerId}` で一意に
2. **ネットワーク分離**: 各コンテナは独立したネットワーク
3. **設定分離**: worktree ごとに `.devcontainer/` を参照

### 分離すべきリソース

| Resource | Isolation Strategy |
|----------|---------------------|
| node_modules | worktree ごとにインストール |
| .claude | ボリュームマウントで分離 |
| 環境変数 | コンテキストファイルで渡す |
| Git 認証 | SSH Agent forwarding |
| ポート | 動的割り当て or 範囲指定 |

## CLI Interface

### orchestrate コマンド

```bash
# タスクを開始
./tools/orchestrate start "認証機能を追加する"

# タスク状態を確認
./tools/orchestrate status

# 特定エージェントを手動起動
./tools/orchestrate spawn implementer feat/GH-123-auth

# 全ワークツリーを一覧
./tools/orchestrate list

# 完了したワークツリーをクリーンアップ
./tools/orchestrate cleanup --merged
```

## Success Criteria

1. **AC1**: `./tools/orchestrate start "<task>"` でタスクが開始できる
2. **AC2**: 適切なエージェントにルーティングされる
3. **AC3**: worktree と DevContainer が自動作成される
4. **AC4**: 各 worktree の環境が互いに干渉しない
5. **AC5**: エージェント完了時に次のエージェントに引き継がれる
6. **AC6**: 最終的に PR が作成される

## Non-Functional Requirements

1. **NFR1**: worktree 作成は 30 秒以内
2. **NFR2**: DevContainer 起動は 2 分以内
3. **NFR3**: 最大 5 つの並列 worktree をサポート
4. **NFR4**: ディスク使用量の監視と警告

## Dependencies

- Git worktree
- Docker / DevContainer CLI
- VS Code (Remote Containers)
- Claude Code / GitHub Copilot

## Out of Scope

- クラウド上での分散実行（ローカル実行のみ）
- 複数リポジトリにまたがるタスク
- GUI ダッシュボード

## Related Documents

- [Git Worktree ガイド](../../../tools/worktree/README.md)
- [Agent Operating Model](../../../docs/00_process/agent_operating_model.md)
- [DevContainer 設計](../../../docs/devcontainer.md)
