# Tasks: 商圏分析 MVP

## Metadata

- **Spec**: `.specify/specs/trade-area-analysis/spec.md`
- **Plan**: `.specify/specs/trade-area-analysis/plan.md`
- **Status**: In Progress
- **Created**: 2026-02-14
- **Updated**: 2026-02-14

---

## Task Breakdown

### Phase 1: OpenAPI + コード生成

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 1.1 | openapi.yaml に TradeAreas タグ・Paths・Schemas 追加 | FR-005 | M | ✅ | - |
| 1.2 | `./tools/contract openapi-generate` で型生成 | FR-005 | S | ✅ | - |

### Phase 2: ドメインモデル

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 2.1 | CenterPoint ValueObject + テスト (12) | FR-006, AC-010 | S | ✅ | - |
| 2.2 | Radius ValueObject + テスト (10) | FR-006, AC-010 | S | ✅ | - |
| 2.3 | TradeAreaName ValueObject | FR-006 | S | ✅ | - |
| 2.4 | DemographicData ValueObject | FR-004 | S | ✅ | - |
| 2.5 | TradeArea AggregateRoot + テスト (9) | FR-006, AC-010 | M | ✅ | - |
| 2.6 | Repository / Provider インターフェース | FR-005, FR-006 | S | ✅ | - |

### Phase 3: インフラストラクチャ

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 3.1 | Prisma schema に TradeArea モデル追加 | FR-003 | S | ✅ | - |
| 3.2 | InMemoryTradeAreaRepository 実装 | FR-005 | S | ✅ | - |
| 3.3 | PrismaTradeAreaRepository 実装 | FR-005 | M | ✅ | - |
| 3.4 | MockDemographicDataProvider 実装 | FR-004, AC-008 | M | ✅ | - |

### Phase 4: ユースケース

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 4.1 | CreateTradeArea UseCase + テスト (5) | FR-002, AC-002, AC-003 | M | ✅ | - |
| 4.2 | GetTradeArea UseCase + テスト (4) | FR-003, AC-006 | S | ✅ | - |
| 4.3 | ListTradeAreas UseCase + テスト (3) | FR-003, AC-004 | S | ✅ | - |
| 4.4 | DeleteTradeArea UseCase + テスト (4) | FR-003, AC-005, AC-006 | S | ✅ | - |
| 4.5 | UpdateTradeArea UseCase | FR-003 | S | ✅ | - |
| 4.6 | GetDemographics UseCase + テスト (4) | FR-004, AC-007, AC-008 | M | ✅ | - |

### Phase 5: プレゼンテーション層

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 5.1 | Zod バリデーションスキーマ | FR-005, AC-003 | S | ✅ | - |
| 5.2 | TradeAreaController 実装 | FR-005 | M | ✅ | - |
| 5.3 | Routes 定義（6 エンドポイント） | FR-005 | S | ✅ | - |
| 5.4 | Router + Container 配線 | FR-005 | M | ✅ | - |

### Phase 6: フロントエンド基盤

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 6.1 | 地図関連パッケージインストール | FR-001 | S | ✅ | - |
| 6.2 | shared/lib/geo.ts（Turf.js ヘルパー） | FR-001 | S | ✅ | - |
| 6.3 | shared/config/mapbox.ts（Mapbox 設定） | FR-001 | S | ✅ | - |
| 6.4 | entities/trade-area 型定義 + TradeAreaCircle | FR-001 | M | ✅ | - |

### Phase 7: フロントエンド機能 + ページ

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 7.1 | feature: map-view（MapContainer, useMapView） | FR-001, AC-001 | M | ✅ | - |
| 7.2 | feature: trade-area-creation（RadiusSlider, Preview, Store） | FR-002, AC-002, AC-009 | M | ✅ | - |
| 7.3 | feature: trade-area-management（API, List, Store） | FR-003, AC-004, AC-005 | M | ✅ | - |
| 7.4 | feature: demographic-analysis（Panel, Charts, API） | FR-004, AC-007 | M | ✅ | - |
| 7.5 | widget: map-workspace（統合ウィジェット） | FR-001-004 | M | ✅ | - |
| 7.6 | page: /map ルート | AC-001 | S | ✅ | - |
| 7.7 | next.config.js に Mapbox CSP ヘッダー追加 | NFR-002 | S | ✅ | - |
| 7.8 | features/index.ts, widgets/index.ts 更新 | - | S | ✅ | - |

### Phase 8: 品質検証

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 8.1 | `./tools/contract typecheck` 通過 | - | S | ✅ | - |
| 8.2 | `./tools/contract lint` エラー 0 | - | S | ✅ | - |
| 8.3 | `./tools/contract test`（API: 193 tests pass） | - | S | ✅ | - |
| 8.4 | DevContainer 内での E2E 検証 | AC-001-009 | M | ✅ | - |

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

- [x] テストケースを先に書いた（Phase 2, 4）
- [x] AC と対応するテストが存在する
- [x] テストが失敗することを確認した（Red）

各タスク完了時に確認:

- [x] テストが通ることを確認した（Green）
- [x] リファクタリングを行った
- [x] `./tools/contract lint` が通る
- [x] `./tools/contract typecheck` が通る

---

## Dependencies

### Task Dependencies

```
1.1 → 1.2 → 2.1-2.6 → 3.1-3.4 → 4.1-4.6 → 5.1-5.4
                                                  ↓
6.1 → 6.2-6.4 → 7.1-7.8 → 8.1-8.4
```

### External Dependencies

| Task | Dependency | Owner | Status |
|------|------------|-------|--------|
| 6.1 | Mapbox トークン | 環境変数 | Ready |
| 3.1 | PostgreSQL | DevContainer | Ready |

---

## Notes

### Decisions Made

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-02-14 | ValueObject props に `type` alias 使用 | `interface` は `Record<string, unknown>` 制約を満たさないため |
| 2026-02-14 | ErrorReason に `RESOURCE_NOT_FOUND` 使用 | `TRADE_AREA_NOT_FOUND` は shared の ErrorReason に未定義 |
| 2026-02-14 | TradeAreaCircle から onClick 除外 | react-map-gl の Source/Layer は直接 onClick をサポートしない |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-14 | @claude | Initial tasks (retroactive documentation) |
