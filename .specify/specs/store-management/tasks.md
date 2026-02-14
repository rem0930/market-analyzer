# Tasks: 自店舗管理 - ドメインモデル & CRUD API

## Metadata

- **Spec**: `.specify/specs/store-management/spec.md`
- **Plan**: `.specify/specs/store-management/plan.md`
- **Status**: Not Started
- **Created**: 2026-02-14
- **Updated**: 2026-02-14

---

## Task Breakdown

### Phase 1: OpenAPI + Domain

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 1.1 | OpenAPI spec に Store endpoints 追加 | FR-002 | S | ⬜ | - |
| 1.2 | StoreName ValueObject + テスト | FR-001, AC-011 | S | ⬜ | - |
| 1.3 | StoreAddress ValueObject + テスト | FR-001, AC-012 | S | ⬜ | - |
| 1.4 | Store AggregateRoot + StoreId + Event + テスト | FR-001, AC-010 | M | ⬜ | - |
| 1.5 | StoreRepository interface + domain/index.ts エクスポート | FR-001 | S | ⬜ | - |

### Phase 2: Infrastructure + UseCase

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 2.1 | Prisma Store model + migration | FR-004 | S | ⬜ | - |
| 2.2 | InMemoryStoreRepository | FR-004 | S | ⬜ | - |
| 2.3 | PrismaStoreRepository（userId defense-in-depth） | FR-004, FR-005 | M | ⬜ | - |
| 2.4 | CreateStoreUseCase + テスト | FR-003, AC-001, AC-002 | M | ⬜ | - |
| 2.5 | GetStoreUseCase + テスト | FR-003, AC-004, AC-005 | S | ⬜ | - |
| 2.6 | ListStoresUseCase + テスト | FR-003, AC-003 | S | ⬜ | - |
| 2.7 | UpdateStoreUseCase + テスト | FR-003, AC-006, AC-007 | M | ⬜ | - |
| 2.8 | DeleteStoreUseCase + テスト | FR-003, AC-008 | S | ⬜ | - |

### Phase 3: Presentation + Integration

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 3.1 | Zod store-schemas.ts | FR-002 | S | ⬜ | - |
| 3.2 | StoreController | FR-002, AC-009 | M | ⬜ | - |
| 3.3 | Store routes（auth + rateLimit） | FR-002, FR-005, NFR-002 | S | ⬜ | - |
| 3.4 | DI コンテナ配線 + ルーター登録 | FR-002 | S | ⬜ | - |
| 3.5 | Quality Gates 全パス | NFR-003 | S | ⬜ | - |

---

## Status Legend

| Icon | Status |
|------|--------|
| ⬜ | Not Started |
| 🟡 | In Progress |
| ✅ | Completed |
| ❌ | Blocked |

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
1.1 (OpenAPI) ──────────────────────────────────────→ 3.1 (Schemas)
1.2 (StoreName) ──┐
1.3 (StoreAddress)┼──→ 1.4 (Store AR) ──→ 1.5 (Repo IF) ──→ 2.1 (Prisma)
                  │                                          ──→ 2.2 (InMemory)
                  │                                          ──→ 2.3 (PrismaRepo)
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
| 1.0 | 2026-02-14 | @claude | Initial tasks |
