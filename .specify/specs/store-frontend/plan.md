# Plan: 自店舗管理 - フロントエンド（地図 + 一覧）

## Metadata

- **Spec**: `.specify/specs/store-frontend/spec.md`
- **Status**: Implemented
- **Created**: 2026-02-15
- **Updated**: 2026-02-15

---

## Overview

Issue #14 の要件を、既存 TradeArea フロントエンドパターンを踏襲して 4 Phase で実装する。Entity 定義 → Feature API/State → Feature UI → Widget 統合の順で進め、各フェーズで FSD レイヤー制約を維持する。

---

## Architecture Decision

### 採用するアプローチ

TradeArea フロントエンドと同一の FSD + React Query + Zustand パターンを踏襲する。

### 検討した代替案

| 案 | 概要 | メリット | デメリット | 採用 |
|----|------|----------|------------|------|
| A: TradeArea パターン踏襲 | 同一 FSD 構造で entities/features/widgets を構築 | パターン一貫性、学習コスト低 | - | Yes |
| B: Orval 生成クライアント直接使用 | api-contract の生成コードを直接 features から使用 | コード量削減 | apiClient ラッパーの認証/CSRF 自動付与が使えない | No |
| C: 単一 feature にまとめる | store-management + store-creation を 1 feature に統合 | ファイル数削減 | 責務過大、TradeArea パターンとの不整合 | No |

### 決定理由

TradeArea と同一パターンにより、コードベースの一貫性を維持。apiClient ラッパー経由で認証ヘッダーと CSRF トークンが自動付与されるため、セキュリティ面でも安全。

---

## Technical Design

### Component Architecture

```text
MapWorkspace (widget)
├── MapContainer (feature: map-view)
│   ├── StoreMarker[] (entity: store) ← NEW
│   ├── StoreCreationMode (feature: store-creation) ← NEW
│   ├── TradeAreaCircle[] (entity: trade-area)
│   └── TradeAreaCreationMode (feature: trade-area-creation)
├── Side Panel
│   ├── Store Section ← NEW
│   │   ├── Store Creation Controls
│   │   └── StoreList (feature: store-management)
│   ├── Trade Area Section
│   │   ├── Trade Area Creation Controls
│   │   └── TradeAreaList
│   └── DemographicPanel
```

### Data Flow

```text
User clicks map → MapWorkspace.handleMapClick()
  ├── if storeCreation.isCreating → storeCreation.setClickPoint(lng, lat)
  └── if tradeAreaCreation.isCreating → tradeAreaCreation.setClickPoint(lng, lat)

User clicks "Save" → useCreateStore.mutate()
  → POST /stores (apiClient with Bearer + CSRF)
  → onSuccess: invalidateQueries(['stores'])
  → StoreList re-renders with new store
  → MapWorkspace re-renders with new StoreMarker
```

### State Management

| State | Tool | Scope |
|-------|------|-------|
| Store list (server) | React Query | `['stores']` |
| Store detail (server) | React Query | `['stores', id]` |
| Selected store | Zustand | `useStores` store |
| Creation mode | Zustand | `useStoreCreation` store |

---

## Implementation Strategy

### Phase 1: Entity Layer

**目的**: Store の型定義とビジュアル表現を確立する

**成果物**:
- [x] `entities/store/model/types.ts` — Store, StoresResponse, CreateStoreRequest, UpdateStoreRequest
- [x] `entities/store/ui/StoreMarker.tsx` — Mapbox Marker（青ピン）
- [x] `entities/store/index.ts` — Public API

### Phase 2: Feature API + State

**目的**: API 通信と状態管理を実装する

**成果物**:
- [x] `features/store-management/api/queries.ts` — useStoreList, useStore hooks
- [x] `features/store-management/api/mutations.ts` — useCreateStore, useUpdateStore, useDeleteStore
- [x] `features/store-management/model/useStores.ts` — selectedStoreId 管理
- [x] `features/store-creation/model/useStoreCreation.ts` — 作成フロー状態
- [x] `features/store-management/index.ts` — Public API
- [x] `features/store-creation/index.ts` — Public API

### Phase 3: Feature UI

**目的**: ユーザー向け UI コンポーネントを実装する

**成果物**:
- [x] `features/store-management/ui/StoreList.tsx` — 店舗一覧
- [x] `features/store-management/ui/StoreListItem.tsx` — 個別店舗表示
- [x] `features/store-creation/ui/StoreCreationMode.tsx` — プレビューマーカー

### Phase 4: Widget Integration

**目的**: MapWorkspace に Store 機能を統合する

**成果物**:
- [x] `widgets/map-workspace/ui/MapWorkspace.tsx` の拡張
  - Store imports 追加
  - StoreMarker レンダリング
  - Store creation controls（サイドパネル）
  - StoreList（サイドパネル）
  - handleMapClick にストア作成モード分岐追加
- [x] `entities/index.ts` に Store エクスポート追加
- [x] 全 Quality Gates パス

---

## Test Strategy

### Unit Tests

フロントエンドのユニットテストは、ビジネスロジックを含む hooks と状態管理に対して実施する。

| Component | Test Focus | Target |
|-----------|------------|--------|
| useStoreCreation | 状態遷移（start, setClickPoint, cancel, reset） | 4+ tests |
| useStores | selectedStoreId の管理 | 2+ tests |

### Integration Tests（将来）

- MapWorkspace でのストアピン表示
- 作成フローの E2E

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| MapWorkspace が複雑化 | Medium | Low | セクション分離、feature 間の独立性維持 |
| 地図クリックの競合（TradeArea vs Store） | Medium | Medium | isCreating フラグで排他制御 |
| Orval 型と手書き型の乖離 | Low | Low | entities 型を手書きし、API レスポンスからマッピング |

---

## Dependencies

### External Dependencies

| Dependency | Version | Purpose | Risk |
|------------|---------|---------|------|
| react-map-gl | 既存 | Map + Marker rendering | Low |
| @tanstack/react-query | 既存 | Server state | Low |
| zustand | 既存 | Client state | Low |

### Internal Dependencies

| Component | Owner | Status |
|-----------|-------|--------|
| Store CRUD API | PR #20 | Ready |
| `@monorepo/api-contract` (generated types) | api-contract package | Ready |
| `apiClient` wrapper | shared/api | Ready |
| `useAuthStore` | features/auth | Ready |
| `MapContainer` | features/map-view | Ready |

---

## Related Documents

- Spec: `.specify/specs/store-frontend/spec.md`
- Tasks: `.specify/specs/store-frontend/tasks.md`
- Backend Spec: `.specify/specs/store-management/spec.md`
- TradeArea Frontend（参照パターン）: `features/trade-area-management/`, `features/trade-area-creation/`

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | @claude | Initial plan |
