# Tasks: [機能名]

## Metadata

- **Spec**: `.specify/specs/[id]/spec.md`
- **Plan**: `.specify/specs/[id]/plan.md`
- **Status**: Not Started | In Progress | Completed
- **Created**: YYYY-MM-DD
- **Updated**: YYYY-MM-DD

---

## Task Breakdown

### Phase 1: [フェーズ名]

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 1.1 | [タスク名] | FR-001, AC-001 | S / M / L | ⬜ | - |
| 1.2 | [タスク名] | FR-001, AC-002 | S / M / L | ⬜ | - |

### Phase 2: [フェーズ名]

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 2.1 | [タスク名] | FR-002, AC-003 | S / M / L | ⬜ | - |
| 2.2 | [タスク名] | FR-002, AC-004 | S / M / L | ⬜ | - |

---

## Status Legend

| Icon | Status |
|------|--------|
| ⬜ | Not Started |
| 🟡 | In Progress |
| ✅ | Completed |
| ❌ | Blocked |
| ⏸️ | On Hold |

---

## Estimate Legend

| Size | Description | Guideline |
|------|-------------|-----------|
| S | Small | 単一ファイル変更、テスト含めて完了 |
| M | Medium | 複数ファイル変更、レビュー必要 |
| L | Large | アーキテクチャ影響あり、複数 PR に分割推奨 |

---

## Test First Checklist

各タスク開始前に確認:

- [ ] テストケースを先に書いた
- [ ] AC と対応するテストが存在する
- [ ] テストが失敗することを確認した（Red）

各タスク完了時に確認:

- [ ] テストが通ることを確認した（Green）
- [ ] リファクタリングを行った
- [ ] `./tools/contract lint` が通る
- [ ] `./tools/contract typecheck` が通る

---

## Dependencies

### Task Dependencies

```
1.1 → 1.2 → 2.1
         ↘ 2.2
```

### External Dependencies

| Task | Dependency | Owner | Status |
|------|------------|-------|--------|
| [タスク#] | [依存内容] | [担当] | Ready / Waiting |

---

## Notes

### Blockers

- [ ] [ブロッカー内容と解決策]

### Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| YYYY-MM-DD | [決定事項] | [理由] |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | YYYY-MM-DD | @author | Initial tasks |
