---
applyTo: "**"
---

# Global Instructions

**Canonical: `AGENTS.md`** - すべての AI エージェントはこのファイルに従う。

## Non-negotiables

1. **DocDD**: Spec/Plan/AC なしで実装を開始しない
2. **Golden Commands**: `./tools/contract <cmd>` 経由で実行
3. **破壊的変更禁止**: 既存ファイルを無断で上書きしない
4. **CI 必須**: contract が壊れた状態で完了宣言しない

## Commit Format

```
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`

## Quick Commands

```bash
./tools/contract format
./tools/contract lint
./tools/contract test
./tools/contract build
```
