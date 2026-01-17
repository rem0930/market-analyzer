# Core Rules (Always Applied)

## Canonical Source

**AGENTS.md is the single source of truth.** All other files defer to it.

## Non-Negotiables

See `AGENTS.md` for the authoritative list. Summary:

1. Worktree + DevContainer（main 直接編集禁止）
2. DocDD（Spec/Plan/AC なしで実装開始しない）
3. Golden Commands（`./tools/contract` 経由で実行）
4. 破壊的変更の禁止
5. CI/DevContainer/Contract が壊れた状態で完了宣言しない
6. HTTP API は OpenAPI 仕様を先に定義

## Quick Reference

| Topic                  | Skill Reference                            |
|------------------------|--------------------------------------------|
| Workflow & Conventions | `.claude/skills/repo-conventions/SKILL.md` |
| Quality Gates          | `.claude/skills/quality-gates/SKILL.md`    |

## Commit Format

```text
<type>(<scope>): <subject>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `build`, `ci`
