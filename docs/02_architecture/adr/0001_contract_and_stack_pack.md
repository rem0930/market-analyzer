# ADR-0001: Contract と Stack Pack アーキテクチャ

## Status

**Accepted** - 2026-01-15

## Context

マルチ言語・マルチフレームワークに対応するテンプレートリポジトリを構築するにあたり、以下の課題がある：

1. **コマンドの不統一**: スタックごとに `npm test`, `cargo test`, `go test` など異なるコマンドが必要
2. **DevContainer の分散**: 各スタックで異なる DevContainer 設定が必要
3. **CI の複雑化**: スタックごとに異なる CI 設定が必要
4. **オンボーディングコスト**: 新しいスタックを追加するたびに学習コストが発生

## Decision

### 1. Contract パターンの採用

すべてのスタック共通のコマンドインターフェース（Contract）を定義し、`tools/contract` 経由で実行する。

```bash
./tools/contract format   # すべてのスタックで同じコマンド
./tools/contract lint
./tools/contract test
./tools/contract build
```

### 2. Stack Pack パターンの採用

スタック固有の設定は `stacks/<stack_id>/` に集約する。

```
stacks/<stack_id>/
├── manifest.yaml         # メタデータ
├── devcontainer/         # DevContainer 設定
├── contract/             # Contract の実装
└── scaffold/             # 初期ファイル
```

### 3. Active Stack による切り替え

`.repo/active-stack` に現在のスタック ID を記録し、Contract がこれを参照して適切なスクリプトを実行する。

## Consequences

### Positive

- **統一されたインターフェース**: どのスタックでも同じコマンドで操作可能
- **CI の簡素化**: Contract 経由なので CI 設定は共通化可能
- **拡張性**: 新しい Stack Pack を追加するだけで対応可能
- **エージェントフレンドリー**: AI エージェントが迷わずにコマンドを実行できる

### Negative

- **間接層の追加**: 直接コマンドを叩くより1層多い
- **Stack Pack 作成のコスト**: 新しいスタックを追加する際に一定のファイル作成が必要

### Mitigations

- Contract スクリプトは薄いラッパーに留め、オーバーヘッドを最小化
- Stack Pack のテンプレートを用意し、新規作成を容易に

## Alternatives Considered

### 1. Makefile による統一
- 却下理由: スタックごとに Makefile の実装が異なり、結局統一できない

### 2. Docker Compose による抽象化
- 却下理由: ローカル開発時のオーバーヘッドが大きい

### 3. nx/turborepo などの Monorepo ツール
- 却下理由: 言語横断的な対応が限定的

## References

- [AGENTS.md](../../../AGENTS.md) - Canonical Instructions
- [docs/02_architecture/repo_structure.md](repo_structure.md) - Repository Structure
