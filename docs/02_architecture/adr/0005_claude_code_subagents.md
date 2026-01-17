# ADR-0005: Claude Code サブエージェント統合

## Status

**Superseded** - 2026-01-17 (Updated to parallel architecture)

Originally accepted: 2026-01-16

## Context

このリポジトリは AI エージェント（GitHub Copilot, Claude Code）による自動化を推進している。既存のエージェント定義は `prompts/agents/` に配置されているが、Claude Code のサブエージェント機能を活用することで以下のメリットが得られる：

1. **コンテキスト分離**: 各タスクが独立したコンテキストウィンドウで実行され、メインワークフローのコンテキストを汚染しない
2. **自動ルーティング**: タスクの種類に応じて Claude が自動的に適切なサブエージェントを起動
3. **ツール制限**: 各サブエージェントに必要最小限のツールセットを割り当ててセキュリティを向上
4. **並列実行**: read-only エージェントを背景で同時起動して効率化

## Decision

### 並列サブエージェントアーキテクチャ（v2）

**重要な変更点**:
- **5 エージェント構成**: 並列実行に最適化
- **name は小文字のみ**: 絵文字禁止（Claude Code 公式仕様に準拠）
- **`{{file:}}` マクロ禁止**: プロンプトは直接記述
- **Skills は frontmatter で注入**: `inject_skills` 配列で指定
- **read-only エージェントは背景で自動実行**: permission 失敗を防止

### Claude Code サブエージェント設定

`.claude/agents/` ディレクトリに以下の 5 つのサブエージェント設定を配置する：

| Agent | File | Purpose | Tools | Mode |
|-------|------|---------|-------|------|
| `repo-explorer` | `repo-explorer.md` | コードベース探索 | Read, Grep, Glob | read-only, 並列 |
| `security-auditor` | `security-auditor.md` | セキュリティ監査 | Read, Grep, Glob | read-only, 並列 |
| `test-runner` | `test-runner.md` | テスト/lint 実行 | Bash, Read | 自動実行 |
| `code-reviewer` | `code-reviewer.md` | コードレビュー | Read, Grep, Glob | read-only, 並列 |
| `implementer` | `implementer.md` | 最小差分実装 | All | メイン作業 |

### 並列実行フロー

```
User: "認証機能を追加"
  ├─ repo-explorer: 関連コード探索 (背景)
  ├─ security-auditor: 認証のセキュリティ確認 (背景)
  └─ code-reviewer: 既存認証コードの品質確認 (背景)
      ↓ (結果統合)
  implementer: 実装
      ↓
  test-runner: テスト実行
```

### ファイル構造

各サブエージェントは自己完結型で構成される：

```yaml
---
name: "agent-name"  # 小文字+ハイフンのみ、絵文字禁止
description: "Use proactively for ... when ..."
model: "sonnet"
tools: ["Read", "Grep", "Glob"]
inject_skills: ["security-baseline", "ddd-clean-architecture"]
---

# Agent Name

[プロンプト内容を直接記述]
```

**Claude Code 公式仕様に準拠**:
- `name`: 小文字、数字、ハイフンのみ（絵文字禁止）
- `description`: `"use proactively"` で自動委譲を有効化
- `inject_skills`: frontmatter で Skills を注入（`{{file:}}` マクロ不使用）

### Skills 構成

`.claude/skills/` に以下の Skills を配置：

| Skill | Purpose |
|-------|---------|
| `security-baseline` | 入力検証、認証、XSS、依存関係セキュリティ |
| `ddd-clean-architecture` | レイヤー依存、境界、ドメイン純度 |
| `fsd-frontend` | Feature-Sliced Design、Next.js 配置 |
| `quality-gates` | lint/test/typecheck の実行順序 |
| `repo-conventions` | リポジトリ固有のルール（DocDD, ブランチ命名） |

### .gitignore 更新

```gitignore
.claude/*
!.claude/agents/
!.claude/skills/
!.claude/commands/
!.claude/hooks/
!.claude/settings.json
```

### 概念エージェント（参考）

`prompts/agents/` には詳細なプロンプト定義が残されている。これらは：
- Claude Code 以外の環境（GitHub Copilot 等）で参照
- 詳細な役割理解のための参考資料
- 手動オーケストレーション用

| ID | Purpose | Reference |
|----|---------|-----------|
| `Orchestrator` | ルーティング、worktree管理 | `prompts/agents/orchestrator.md` |
| `ProductIdentity_PdM` | Spec作成 | `prompts/agents/pdm.md` |
| `ProductDesigner` | UX/UI要件 | `prompts/agents/designer.md` |
| `DesignSystem` | デザイントークン | `prompts/agents/design_system.md` |
| `Architect` | ADR/Plan作成 | `prompts/agents/architect.md` |
| `QA` | テスト設計 | `prompts/agents/qa.md` |
| `Implementer` | 実装 | `prompts/agents/implementer.md` |
| `Reviewer` | レビュー | `prompts/agents/reviewer.md` |

## Consequences

### Positive

- ✅ **並列実行がデフォルト**: read-only エージェントが背景で自動起動
- ✅ **セキュリティ向上**: 背景エージェントは Read/Grep/Glob のみで permission 失敗を防止
- ✅ **公式仕様準拠**: Claude Code の正式なエージェント名規則に準拠
- ✅ **Skills 注入**: frontmatter でドメイン知識を注入、`{{file:}}` 依存なし
- ✅ **自己完結型**: 各エージェントファイルが完全なプロンプトを含む

### Negative

- ⚠️ **prompts/agents/ との重複**: 概念エージェントと実行エージェントが分離
- ⚠️ **Claude Code 依存**: この機能は Claude Code 固有

### Mitigations

- 📚 `AGENTS.md` に両方のエージェント構造を文書化
- 🔄 `prompts/agents/` は参考資料として維持
- 🌐 GitHub Copilot 等は引き続き `prompts/agents/` を参照

## Migration from v1

v1（6エージェント構成）から v2（5エージェント並列構成）への移行：

1. **削除されたエージェント**: architect, designer, pdm, qa, reviewer
2. **追加されたエージェント**: repo-explorer, security-auditor
3. **変更されたエージェント**: code-reviewer（reviewer から名称変更）
4. **Skills の導入**: `.claude/skills/` にドメイン知識を分離
5. **Commands の導入**: `/kickoff`, `/pr-check`, `/deps-audit`

## Implementation Notes

### Phase 1: 並列アーキテクチャ（完了）
- [x] 5 エージェント構成への移行
- [x] Skills 構成の追加
- [x] Commands 構成の追加
- [x] settings.json の更新（最小 allow ルール）
- [x] ドキュメント更新

### Phase 2: 検証とフィードバック
- [ ] 実際のタスクで並列実行を検証
- [ ] 自動ルーティングの精度を確認
- [ ] description の改善

## References

- [Claude Code Sub-Agents Documentation](https://code.claude.com/docs/en/sub-agents)
- [Awesome Claude Code Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
- [Best practices for Claude Code subagents](https://www.pubnub.com/blog/best-practices-for-claude-code-sub-agents/)
