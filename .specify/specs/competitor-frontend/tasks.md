# Tasks: 競合店舗管理 - フロントエンド（地図表示 + 手動登録）

## Metadata

- **Spec**: `.specify/specs/competitor-frontend/spec.md`
- **Plan**: `.specify/specs/competitor-frontend/plan.md`
- **Status**: Done
- **Created**: 2026-02-15
- **Updated**: 2026-02-15

---

## Task Breakdown

### Phase 1: Entity Layer

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 1.1 | Competitor types (model/types.ts) | FR-001 | S | ✅ | #25 |
| 1.2 | CompetitorMarker component (ui/CompetitorMarker.tsx) | FR-001 | S | ✅ | #25 |
| 1.3 | Entity public API (index.ts) | FR-001 | S | ✅ | #25 |

### Phase 2: Feature API + State

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 2.1 | Competitor queries (React Query hooks) | FR-002, AC-001, AC-002 | S | ✅ | #25 |
| 2.2 | Competitor mutations (create, update, delete) | FR-002, FR-003, AC-003, AC-007 | M | ✅ | #25 |
| 2.3 | useCompetitors (selection state) + tests | FR-002 | S | ✅ | #25 |
| 2.4 | useCompetitorCreation (creation flow state) + tests | FR-003, AC-004 | S | ✅ | #25 |
| 2.5 | Feature public APIs (index.ts x2) | NFR-001 | S | ✅ | #25 |

### Phase 3: Feature UI

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 3.1 | CompetitorList + CompetitorListItem components | FR-002, AC-001, AC-002, AC-007, AC-008, AC-009 | M | ✅ | #25 |
| 3.2 | CompetitorCreationMode (preview marker) | FR-003 | S | ✅ | #25 |

### Phase 4: Widget Integration

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 4.1 | MapWorkspace 拡張（Competitor imports + markers + sidebar） | FR-004, AC-001, AC-003, AC-006 | M | ✅ | #25 |
| 4.2 | Map click 分岐（Store vs Competitor vs TradeArea creation） | FR-004 | S | ✅ | #25 |
| 4.3 | Quality Gates 全パス | AC-010, NFR-001 | S | ✅ | #25 |

---

## Dependencies

### Task Dependencies

```text
1.1 (Types) ──→ 1.2 (CompetitorMarker) ──→ 1.3 (Public API)
                                              │
                                              ├──→ 2.1 (Queries) ──→ 2.5 (Public APIs)
                                              ├──→ 2.2 (Mutations) ──→ 2.5
                                              ├──→ 2.3 (useCompetitors) ──→ 2.5
                                              └──→ 2.4 (useCompetitorCreation) ──→ 2.5
                                                    │
                                                    ├──→ 3.1 (CompetitorList)
                                                    └──→ 3.2 (CompetitorCreationMode)
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
