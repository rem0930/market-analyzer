# Plan: 競合店舗管理 - フロントエンド（地図表示 + 手動登録）

## Metadata

- **Spec**: `.specify/specs/competitor-frontend/spec.md`
- **Status**: In Progress
- **Created**: 2026-02-15
- **Updated**: 2026-02-15

---

## Overview

Issue #16 の要件を、既存 Store フロントエンドパターンを踏襲して 4 Phase で実装する。Entity 定義 → Feature API/State → Feature UI → Widget 統合の順で進め、各フェーズで FSD レイヤー制約を維持する。

---

## Architecture Decision

### 採用するアプローチ

Store フロントエンドと同一の FSD + React Query + Zustand パターンを踏襲する。

### 決定理由

Store と同一パターンにより、コードベースの一貫性を維持。API は `/stores/{storeId}/competitors` スコープのため、競合一覧取得には selectedStoreId が必須。

---

## Technical Design

### Component Architecture

```text
MapWorkspace (widget)
├── MapContainer (feature: map-view)
│   ├── StoreMarker[] (entity: store)
│   ├── StoreCreationMode (feature: store-creation)
│   ├── CompetitorMarker[] (entity: competitor) ← NEW
│   ├── CompetitorCreationMode (feature: competitor-creation) ← NEW
│   ├── TradeAreaCircle[] (entity: trade-area)
│   └── TradeAreaCreationMode (feature: trade-area-creation)
├── Side Panel
│   ├── Store Section
│   ├── Competitor Section ← NEW
│   │   ├── Competitor Creation Controls
│   │   └── CompetitorList (feature: competitor-management)
│   ├── Trade Area Section
│   └── DemographicPanel
```

### Data Flow

```text
User selects store → selectedStoreId set
  → useCompetitorsByStore(selectedStoreId) fetches competitors
  → CompetitorMarker[] rendered on map
  → CompetitorList rendered in sidebar

User clicks "+ New Competitor" → competitorCreation.startCreation()
User clicks map → competitorCreation.setClickPoint(lng, lat)
User enters name/category → Save clicked
  → useCreateCompetitor.mutate({ storeId, name, lng, lat, source: "manual", category })
  → POST /stores/{storeId}/competitors
  → onSuccess: invalidateQueries(['competitors', 'store', storeId])
```

### State Management

| State | Tool | Scope |
|-------|------|-------|
| Competitor list (server) | React Query | `['competitors', 'store', storeId]` |
| Selected competitor | Zustand | `useCompetitors` store |
| Creation mode | Zustand | `useCompetitorCreation` store |

---

## Implementation Strategy

### Phase 1: Entity Layer

- `entities/competitor/model/types.ts`
- `entities/competitor/ui/CompetitorMarker.tsx`
- `entities/competitor/index.ts`

### Phase 2: Feature API + State

- `features/competitor-management/api/queries.ts`
- `features/competitor-management/api/mutations.ts`
- `features/competitor-management/model/useCompetitors.ts`
- `features/competitor-creation/model/useCompetitorCreation.ts`
- Feature public APIs

### Phase 3: Feature UI

- `features/competitor-management/ui/CompetitorList.tsx`
- `features/competitor-management/ui/CompetitorListItem.tsx`
- `features/competitor-creation/ui/CompetitorCreationMode.tsx`

### Phase 4: Widget Integration

- `widgets/map-workspace/ui/MapWorkspace.tsx` 拡張

---

## Test Strategy

| Component | Test Focus | Target |
|-----------|------------|--------|
| useCompetitorCreation | 状態遷移（start, setClickPoint, cancel, reset） | 4+ tests |
| useCompetitors | selectedCompetitorId の管理 | 3+ tests |

---

## Related Documents

- Spec: `.specify/specs/competitor-frontend/spec.md`
- Tasks: `.specify/specs/competitor-frontend/tasks.md`
- Backend Spec: `.specify/specs/competitor-management/spec.md`
- Store Frontend（参照パターン）: `.specify/specs/store-frontend/`

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | @claude | Initial plan |
