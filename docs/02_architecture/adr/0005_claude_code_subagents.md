# ADR-0005: Claude Code サブエージェント統合

## Status

**Accepted** - 2026-01-16

## Context

このリポジトリは AI エージェント（GitHub Copilot, Claude Code）による自動化を推進している。既存のエージェント定義は `prompts/agents/` に配置されているが、Claude Code の新しいサブエージェント機能を活用することで以下のメリットが得られる：

1. **コンテキスト分離**: 各タスクが独立したコンテキストウィンドウで実行され、メインワークフローのコンテキストを汚染しない
2. **自動ルーティング**: タスクの種類に応じて Claude が自動的に適切なサブエージェントを起動
3. **ツール制限**: 各サブエージェントに必要最小限のツールセットを割り当ててセキュリティを向上
4. **専門性の強化**: 役割に特化したプロンプトとモデル選択により、より高品質な出力を実現

## Decision

### Claude Code サブエージェント設定の追加

`.claude/agents/` ディレクトリに以下の 6 つのサブエージェント設定を配置する：

| エージェント | ファイル | 用途 | ツールセット |
|-------------|---------|------|-------------|
| Implementer 🛠️ | `implementer.md` | 機能実装、バグ修正 | read, write, edit, bash, grep, glob |
| Architect 🏗️ | `architect.md` | ADR作成、システム設計 | read, write, edit, grep, glob |
| QA Tester 🧪 | `qa.md` | テスト計画、品質保証 | read, write, edit, bash, grep, glob |
| Code Reviewer 👀 | `reviewer.md` | PRレビュー | read, write, grep, glob |
| Product Designer 🎨 | `designer.md` | UX/UI設計 | read, write, edit, grep, glob |
| Product Manager 📋 | `pdm.md` | 要件定義、Spec作成 | read, write, edit, grep, glob |

### ファイル構造

各サブエージェントは軽量ラッパーファイルとして構成される：

```yaml
---
name: "エージェント名 🔧"
description: "Use for ... Specializes in ..."
model: "claude-3-5-sonnet-20241022"
tools: ["read", "write", "edit"]
---

<!-- 
  This file is a Claude Code sub-agent configuration.
  The canonical agent prompt is in: prompts/agents/<agent>.md
-->

{{file:prompts/agents/<agent>.md}}
```

**重要**: `.claude/agents/` は YAML フロントマターのみを含む軽量ラッパー。実際のプロンプトは `prompts/agents/` が canonical source として管理される。これにより：
- 二重管理を回避
- `prompts/agents/` を他の AI ツール（GitHub Copilot 等）と共有
- Claude Code 固有の設定（YAML frontmatter）のみを `.claude/agents/` で管理

### .gitignore の更新

`.claude/agents/` ディレクトリは git 管理下に置く：

```gitignore
.claude/*
!.claude/commands
!.claude/agents/  # サブエージェント設定は管理下に置く
```

### ドキュメント更新

- `AGENTS.md`: サブエージェント情報の追加
- `CLAUDE.md`: サブエージェント使用方法の追加
- `docs/00_process/agent_operating_model.md`: サブエージェント説明の追加
- `README.md`: AI Agent Support セクションの追加
- `.claude/agents/README.md`: サブエージェント詳細ガイドの作成

## Consequences

### Positive

- ✅ **コンテキスト管理の向上**: メインセッションが肥大化せず、タスクごとに適切なコンテキストで作業
- ✅ **自動化の強化**: description に基づく自動ルーティングにより、手動でエージェントを選択する必要がなくなる
- ✅ **セキュリティ向上**: 各エージェントに必要最小限のツールのみを許可
- ✅ **並列実行**: 複数のサブエージェントを同時に起動して効率化
- ✅ **既存資産の活用**: `prompts/agents/` の内容を `{{file:...}}` 構文で参照し、二重管理を回避
- ✅ **軽量な設定**: `.claude/agents/` は YAML フロントマターのみの薄いラッパー

### Negative

- ⚠️ **学習コスト**: 開発者が Claude Code のサブエージェント機能と `{{file:...}}` 構文を理解する必要がある
- ⚠️ **設定の分散**: YAML 設定は `.claude/agents/`、プロンプトは `prompts/agents/` と分散
- ⚠️ **Claude Code 依存**: この機能は Claude Code 固有のため、他の AI エージェントでは利用できない

### Mitigations

- 📚 `.claude/agents/README.md` に詳細な使用方法とファイル参照の仕組みを記載
- 🔄 `prompts/agents/` を canonical とし、`.claude/agents/` は YAML 設定のみを管理
- 🌐 GitHub Copilot 等の他のエージェントは引き続き `prompts/agents/` を直接参照

## Alternatives Considered

### 1. サブエージェント機能を使わない

**理由**: 既存の `prompts/agents/` だけでも動作する

**却下理由**: 
- Claude Code の新機能を活用できない
- コンテキスト分離やツール制限などの利点を得られない
- 自動ルーティング機能を使えない

### 2. `.claude/agents/` のみを使用し、`prompts/agents/` を廃止

**理由**: 設定ファイルを一元化できる

**却下理由**:
- GitHub Copilot 等の他の AI エージェントとの互換性が失われる
- Claude Code を使わない開発者への配慮がなくなる
- エージェントプロンプトの詳細版として `prompts/agents/` は有用

### 3. プロジェクトレベルではなくユーザーレベルで設定

**理由**: 各開発者が自分の好みに合わせてカスタマイズできる

**却下理由**:
- リポジトリ固有のエージェント設定（DocDD、Golden Commands 等）を共有できない
- チーム全体で統一されたエージェント体験を提供できない

## Implementation Notes

### Phase 1: 基本設定（完了）
- [x] `.claude/agents/` ディレクトリ作成
- [x] 6つのサブエージェント設定ファイル作成
- [x] `.gitignore` 更新
- [x] ドキュメント更新

### Phase 2: 検証とフィードバック（次フェーズ）
- [ ] 実際のタスクでサブエージェントを使用
- [ ] 自動ルーティングの精度を確認
- [ ] description の改善（トリガーフレーズの最適化）

### Phase 3: 拡張（将来）
- [ ] Design System エージェントの追加
- [ ] Orchestrator エージェントの追加
- [ ] カスタムツールの追加検討

## References

- [Claude Code Sub-Agents Documentation](https://code.claude.com/docs/en/sub-agents)
- [Awesome Claude Code Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
- [Best practices for Claude Code subagents](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/)
