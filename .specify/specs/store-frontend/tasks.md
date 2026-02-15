# Tasks: 自店舗管理 - フロントエンド（地図 + 一覧）

## Metadata

- **Spec**: `.specify/specs/store-frontend/spec.md`
- **Plan**: `.specify/specs/store-frontend/plan.md`
- **Status**: In Progress
- **Created**: 2026-02-15
- **Updated**: 2026-02-15

---

## Task Breakdown

### Phase 1: Entity Layer

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 1.1 | Store types (model/types.ts) | FR-001 | S | ⬜ | |
| 1.2 | StoreMarker component (ui/StoreMarker.tsx) | FR-001 | S | ⬜ | |
| 1.3 | Entity public API (index.ts) + entities/index.ts 更新 | FR-001 | S | ⬜ | |

### Phase 2: Feature API + State

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 2.1 | Store queries (React Query hooks) | FR-002, AC-001, AC-008 | S | ⬜ | |
| 2.2 | Store mutations (create, update, delete) | FR-002, FR-003, FR-005, AC-003, AC-006, AC-007 | M | ⬜ | |
| 2.3 | useStores (selection state) | FR-002, AC-002 | S | ⬜ | |
| 2.4 | useStoreCreation (creation flow state) | FR-003, AC-004 | S | ⬜ | |
| 2.5 | Feature public APIs (index.ts x2) | NFR-003 | S | ⬜ | |

### Phase 3: Feature UI

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 3.1 | StoreList + StoreListItem components | FR-002, AC-001, AC-002, AC-006, AC-009 | M | ⬜ | |
| 3.2 | StoreCreationMode (preview marker) | FR-003 | S | ⬜ | |

### Phase 4: Widget Integration

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 4.1 | MapWorkspace 拡張（Store imports + markers + sidebar） | FR-004, AC-001, AC-003 | M | ⬜ | |
| 4.2 | Map click 分岐（Store vs TradeArea creation） | FR-004 | S | ⬜ | |
| 4.3 | Quality Gates 全パス | AC-010, NFR-003 | S | ⬜ | |

---

## Status Legend

| Icon | Status |
|------|--------|
| ⬜ | Not Started |
| In Progress | In Progress |
| Done | Completed |
| Blocked | Blocked |

---

## Estimate Legend

| Size | Description | Guideline |
|------|-------------|-----------|
| S | Small | 単一ファイル変更 |
| M | Medium | 複数ファイル変更 |
| L | Large | アーキテクチャ影響あり |

---

## Dependencies

### Task Dependencies

```
1.1 (Types) ──→ 1.2 (StoreMarker) ──→ 1.3 (Public API)
                                        │
                                        ├──→ 2.1 (Queries) ──→ 2.5 (Public APIs)
                                        ├──→ 2.2 (Mutations) ──→ 2.5
                                        ├──→ 2.3 (useStores) ──→ 2.5
                                        └──→ 2.4 (useStoreCreation) ──→ 2.5
                                              │
                                              ├──→ 3.1 (StoreList)
                                              └──→ 3.2 (StoreCreationMode)
                                                    │
                                                    └──→ 4.1 (MapWorkspace)
                                                          ──→ 4.2 (Click分岐)
                                                          ──→ 4.3 (Quality Gates)
```

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | @claude | Initial tasks |
