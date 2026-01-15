# Claude Code Notes

**Canonical instructions are in `AGENTS.md`.**

If anything conflicts, follow `AGENTS.md`.

---

## Autonomy Configuration

| Setting | Value |
|---------|-------|
| `risk_profile` | `safe` |
| `allow_auto_commit` | `true` |
| `allow_auto_pr` | `true` |
| `dangerously_skip_permissions` | `false` |

**safe モード**: 自動実行はするが、以下は明示承認が必要:
- force push
- main/master への直接 push
- 既存ファイルの削除
- セキュリティ設定の変更

---

## DevContainer Notes

- firewall allowlist 確認: `docs/devcontainer.md` を参照
- 問題時は `Skill.DevContainer_Safe_Mode` に従う
- `dangerously-skip-permissions` は devcontainer の firewall 前提でのみ許容

---

## Quick Reference

```bash
# Golden Commands (always use these)
./tools/contract format
./tools/contract lint
./tools/contract typecheck
./tools/contract test
./tools/contract build
./tools/contract e2e
./tools/contract migrate
./tools/contract deploy-dryrun

# Check active stack
cat .repo/active-stack

# Apply a stack
./tools/kickoff/apply_stack.sh <stack_id>

# Policy check
./tools/policy/check_required_artifacts.sh
./tools/policy/check_docdd_minimum.sh
./tools/policy/check_instruction_consistency.sh
```

## Key Paths

- Process docs: `docs/00_process/`
- Product docs: `docs/01_product/`
- Architecture: `docs/02_architecture/`
- Quality: `docs/03_quality/`
- Delivery: `docs/04_delivery/`
- Stack Packs: `stacks/<stack_id>/`
- Agent Prompts: `prompts/agents/`
- Skill Prompts: `prompts/skills/`

## Workflow

1. **Read Contract First**: `AGENTS.md` と `docs/00_process/process.md` を読む
2. **DocDD**: Spec/Plan/Tasks なしで実装を開始しない
3. **Golden Commands**: 必ず `./tools/contract` 経由で実行
4. **Docs Drift**: コード変更時は関連 Docs も更新
5. **Minimize Diff**: CI 失敗時は原因を1つに絞り最小差分で修正

