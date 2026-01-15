# Agent Orchestration Implementation Plan

## Phase 1: Core Infrastructure

### 1.1 Worktree Manager Scripts

**Files to create:**
- `tools/worktree/spawn.sh` - worktree 作成と DevContainer 起動
- `tools/worktree/status.sh` - worktree 一覧と状態表示
- `tools/worktree/cleanup.sh` - worktree 削除とクリーンアップ
- `tools/worktree/context.sh` - コンテキストファイル操作

**Tasks:**
- [ ] worktree 作成スクリプト（ブランチ命名規則適用）
- [ ] DevContainer CLI 連携（`devcontainer up`）
- [ ] ポート動的割り当て機能
- [ ] 状態ファイル管理（`.worktree-state/`）

### 1.2 Agent Context Protocol

**Files to create:**
- `tools/orchestrate/context-schema.yaml` - コンテキストスキーマ定義
- `tools/orchestrate/context.sh` - コンテキスト操作ユーティリティ

**Tasks:**
- [ ] YAML スキーマ定義
- [ ] コンテキスト作成・読み込み関数
- [ ] バリデーション機能

## Phase 2: Orchestrator Agent

### 2.1 Routing Engine

**Files to create:**
- `tools/orchestrate/orchestrate.sh` - メインエントリポイント
- `tools/orchestrate/router.sh` - ルーティングロジック
- `tools/orchestrate/routing-rules.yaml` - ルーティング設定

**Tasks:**
- [ ] 自然言語パターンマッチング
- [ ] エージェント選択ロジック
- [ ] ワークフロータイプ判定

### 2.2 Workflow Execution

**Files to create:**
- `tools/orchestrate/workflow.sh` - ワークフロー実行エンジン
- `tools/orchestrate/monitor.sh` - 進捗監視

**Tasks:**
- [ ] Sequential ワークフロー実装
- [ ] Parallel ワークフロー実装
- [ ] エラーハンドリング
- [ ] リトライロジック

## Phase 3: DevContainer Integration

### 3.1 DevContainer Template

**Files to modify/create:**
- `.devcontainer/devcontainer.template.json` - テンプレート
- `tools/worktree/devcontainer-gen.sh` - 動的生成スクリプト

**Tasks:**
- [ ] worktree 用 devcontainer 生成
- [ ] ポート範囲設定
- [ ] ボリューム分離設定
- [ ] 環境変数注入

### 3.2 Agent Bootstrap

**Files to create:**
- `tools/orchestrate/bootstrap-agent.sh` - エージェント起動スクリプト

**Tasks:**
- [ ] DevContainer 内でのエージェント初期化
- [ ] コンテキスト読み込み
- [ ] エージェントプロンプト適用

## Phase 4: Agent Prompts & Integration

### 4.1 Orchestrator Prompt

**Files to create:**
- `prompts/agents/orchestrator.md` - オーケストレーターエージェント定義

### 4.2 Agent Handoff Protocol

**Files to modify:**
- `prompts/agents/*.md` - 各エージェントに handoff セクション追加

**Tasks:**
- [ ] 完了通知プロトコル
- [ ] 次エージェントへの引き継ぎ

## Phase 5: Documentation & Polish

### 5.1 Documentation

**Files to create/modify:**
- `tools/orchestrate/README.md` - 使用ガイド
- `docs/00_process/agent_orchestration.md` - 運用ガイド
- `tools/worktree/README.md` - 更新

### 5.2 Testing & Validation

**Tasks:**
- [ ] E2E テストシナリオ作成
- [ ] エラーケーステスト
- [ ] パフォーマンス検証

---

## Implementation Order

```
Phase 1.1 ─▶ Phase 1.2 ─▶ Phase 2.1 ─▶ Phase 2.2
                                           │
                                           ▼
Phase 3.1 ◀─────────────────────────── Phase 3.2
    │
    ▼
Phase 4.1 ─▶ Phase 4.2 ─▶ Phase 5.1 ─▶ Phase 5.2
```

## Estimated Timeline

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| 1.1 | 2h | None |
| 1.2 | 1h | None |
| 2.1 | 2h | 1.1, 1.2 |
| 2.2 | 2h | 2.1 |
| 3.1 | 1h | 1.1 |
| 3.2 | 1h | 3.1, 2.2 |
| 4.1 | 1h | 2.1 |
| 4.2 | 1h | 4.1 |
| 5.1 | 1h | All |
| 5.2 | 1h | All |

**Total: ~13h**

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| DevContainer CLI 未インストール | High | インストールチェック & ガイド提供 |
| ポート競合 | Medium | 動的ポート割り当て |
| ディスク枯渇 | Medium | 使用量モニタリング & 警告 |
| Git worktree 競合 | Low | ロックファイル使用 |
