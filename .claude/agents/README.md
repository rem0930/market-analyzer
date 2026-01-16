# Claude Code Sub-Agents

このディレクトリには、Claude Code で使用できるカスタムサブエージェントの定義が含まれています。

## 概要

サブエージェントは、特定のタスクに特化した AI アシスタントです。各エージェントは独立したコンテキストウィンドウを持ち、専用のシステムプロンプトと制限されたツールセットで動作します。

## サブエージェント一覧

| エージェント | 用途 | モデル |
|-------------|------|-------|
| 🛠️ **Implementer** | 機能実装、バグ修正、コード変更 | Sonnet |
| 🏗️ **Architect** | アーキテクチャ決定、ADR作成、システム設計 | Sonnet |
| 🧪 **QA Tester** | テスト計画、テストケース設計、品質保証 | Sonnet |
| 👀 **Code Reviewer** | PRレビュー、コードレビュー、品質チェック | Sonnet |
| 🎨 **Product Designer** | UX/UI設計、ユーザーフロー、デザイン要件 | Sonnet |
| 📋 **Product Manager** | プロダクト企画、要件定義、Spec作成 | Sonnet |

## 使い方

### 自動ルーティング

Claude は各サブエージェントの `description` に基づいて、自動的に適切なエージェントにタスクを委譲します。

例：
```
PRをレビューしてください
→ Code Reviewer サブエージェントが自動起動
```

### 手動起動

特定のサブエージェントを明示的に呼び出すこともできます：

```
/agent Implementer <タスク内容>
```

## ファイル構造

各サブエージェントは以下の構造を持つ Markdown ファイルです：

```yaml
---
name: "エージェント名 🔧"
description: "いつこのエージェントを使うか"
model: "claude-3-5-sonnet-20241022"
tools: ["read", "write", "edit", "bash"]
---

<!-- 
  This file is a Claude Code sub-agent configuration.
  The canonical agent prompt is in: prompts/agents/<agent>.md
-->

{{file:prompts/agents/<agent>.md}}
```

**重要**: `.claude/agents/` のファイルは YAML フロントマターのみを含む軽量ラッパーです。実際のエージェントプロンプトは `prompts/agents/` に配置されており、`{{file:...}}` 構文で参照されます。これにより二重管理を避けています。

### フィールド説明

- **name**: 表示名（絵文字を含めると視覚的に識別しやすい）
- **description**: エージェントを起動するトリガー条件（明確に記述する）
- **model**: 使用する AI モデル
- **tools**: 許可するツールのリスト（セキュリティのため制限可能）

## Best Practices

### 1. 明確なトリガーフレーズ

`description` には強いトリガーフレーズを含めます：

```yaml
description: "MUST BE USED for PR reviews..."
```

### 2. ツールの制限

セキュリティのため、必要最小限のツールのみを許可します：

```yaml
# 読み取り専用エージェント
tools: ["read", "grep", "glob"]

# 実装エージェント
tools: ["read", "write", "edit", "bash"]
```

### 3. スコープの明確化

各エージェントの責務を明確に定義し、重複を避けます。

## トラブルシューティング

### サブエージェントが起動しない

1. `description` フィールドが明確か確認
2. トリガーフレーズを強化（"MUST BE USED for..."）
3. プロジェクトレベルのエージェントがユーザーレベルより優先される

### 権限エラー

必要なツールが `tools` リストに含まれているか確認します。

## カスタマイズ

### 新しいサブエージェントの追加

1. まず `prompts/agents/` に完全なエージェントプロンプトを作成
2. `.claude/agents/` に YAML フロントマター付きのラッパーファイルを作成
3. `{{file:prompts/agents/<agent>.md}}` で参照
4. Claude を再起動して反映

### 既存エージェントの編集

`prompts/agents/` のファイルを編集してください。`.claude/agents/` のファイルは YAML フロントマター（name, description, model, tools）のみを編集します。

## 関連ドキュメント

- [AGENTS.md](../../AGENTS.md) - すべてのエージェントの canonical ルール
- [prompts/agents/](../../prompts/agents/) - エージェントプロンプトの詳細版
- [docs/00_process/agent_operating_model.md](../../docs/00_process/agent_operating_model.md) - エージェント運用モデル
- [docs/00_process/skills_catalog.md](../../docs/00_process/skills_catalog.md) - 再利用可能スキル

## 参考リンク

- [Claude Code Sub-Agents Documentation](https://code.claude.com/docs/en/sub-agents)
- [Awesome Claude Code Subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
