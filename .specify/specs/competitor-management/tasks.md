# Tasks: 競合店舗 - ドメインモデル & CRUD API

## Metadata

- **Spec**: `.specify/specs/competitor-management/spec.md`
- **Plan**: `.specify/specs/competitor-management/plan.md`
- **Status**: Completed
- **Created**: 2026-02-15
- **Updated**: 2026-02-15

---

## Task Breakdown

### Phase 1: OpenAPI + Domain

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 1.1 | OpenAPI spec に Competitor endpoints 定義 | FR-002 | S | ✅ | #22 |
| 1.2 | CompetitorName ValueObject + テスト | FR-001, AC-011 | S | ✅ | #22 |
| 1.3 | CompetitorSource ValueObject + テスト | FR-001, AC-012 | S | ✅ | #22 |
| 1.4 | Competitor AggregateRoot + CompetitorId + Event + テスト | FR-001 | M | ✅ | #22 |
| 1.5 | CompetitorRepository interface + domain/index.ts エクスポート | FR-001 | S | ✅ | #22 |

### Phase 2: Infrastructure + UseCase

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 2.1 | Prisma Competitor model + migration | FR-004 | S | ✅ | #22 |
| 2.2 | InMemoryCompetitorRepository | FR-004 | S | ✅ | #22 |
| 2.3 | PrismaCompetitorRepository | FR-004 | M | ✅ | #22 |
| 2.4 | CreateCompetitorUseCase + テスト | FR-003, AC-001, AC-002, AC-003 | M | ✅ | #22 |
| 2.5 | GetCompetitorUseCase + テスト | FR-003, AC-005, AC-006 | S | ✅ | #22 |
| 2.6 | ListCompetitorsByStoreUseCase + テスト | FR-003, AC-004 | S | ✅ | #22 |
| 2.7 | UpdateCompetitorUseCase + テスト | FR-003, AC-007, AC-008 | M | ✅ | #22 |
| 2.8 | DeleteCompetitorUseCase + テスト | FR-003, AC-009 | S | ✅ | #22 |

### Phase 3: Presentation + Integration

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 3.1 | Zod competitor-schemas.ts | FR-002 | S | ✅ | #22 |
| 3.2 | CompetitorController | FR-002, AC-010 | M | ✅ | #22 |
| 3.3 | Competitor routes（auth 必須） | FR-002, FR-005 | S | ✅ | #22 |
| 3.4 | DI コンテナ配線 + ルーター登録 | FR-002 | S | ✅ | #22 |
| 3.5 | Quality Gates 全パス | NFR-003 | S | ✅ | #22 |

### Phase 4: DocDD Compliance（追加）

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 4.1 | DocDD Spec 作成 | - | S | ✅ | #23 |
| 4.2 | OpenAPI YAML ファイル作成 | FR-002 | S | ✅ | #23 |
| 4.3 | Prisma migration 生成 | FR-004 | S | ✅ | #23 |

---

## Status Legend

| Icon | Status |
|------|--------|
| ⬜ | Not Started |
| ✅ | Completed |

---

## Estimate Legend

| Size | Description | Guideline |
|------|-------------|-----------|
| S | Small | 単一ファイル変更、テスト含めて完了 |
| M | Medium | 複数ファイル変更、レビュー必要 |
| L | Large | アーキテクチャ影響あり、複数 PR に分割推奨 |

---

## Dependencies

### Task Dependencies

```
1.2 (CompetitorName) ──┐
1.3 (CompetitorSource)─┼──→ 1.4 (Competitor AR) ──→ 1.5 (Repo IF) ──→ 2.1 (Prisma)
                       │                                                ──→ 2.2 (InMemory)
                       │                                                ──→ 2.3 (PrismaRepo)
                       │    2.2 ──→ 2.4 (Create UC) ──┐
                       │         ──→ 2.5 (Get UC) ────┤
                       │         ──→ 2.6 (List UC) ───┼──→ 3.2 (Controller) ──→ 3.3 (Routes)
                       │         ──→ 2.7 (Update UC) ─┤                       ──→ 3.4 (DI)
                       │         ──→ 2.8 (Delete UC) ─┘                       ──→ 3.5 (QA)
```

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | @claude | Initial tasks (retroactive documentation) |
