# Plan: 商圏分析 MVP

## Metadata

- **Spec**: `.specify/specs/trade-area-analysis/spec.md`
- **Status**: In Progress
- **Created**: 2026-02-14
- **Updated**: 2026-02-14

---

## Overview

Spec で定義された商圏分析 MVP の要件を、既存の Clean Architecture + DDD バックエンドと Feature-Sliced Design フロントエンドのパターンに準拠して実装する。バックエンドは 5 レイヤー（Domain → UseCase → Infrastructure → Presentation → Composition）、フロントエンドは FSD（shared → entities → features → widgets → app）の順で積み上げる。

---

## Architecture Decision

### 採用するアプローチ

OpenAPI-first + Clean Architecture + FSD の既存パターンに準拠。バックエンドは DDD 集約パターン、フロントエンドは Feature-Sliced Design で構成。

### 検討した代替案

| 案 | 概要 | メリット | デメリット | 採用 |
|----|------|----------|------------|------|
| A: Turf.js クライアント計算 | 円の GeoJSON をフロントで生成 | PostGIS 不要、DB シンプル | 大量データ時にパフォーマンス低下 | ✅ |
| B: PostGIS 空間クエリ | DB レベルで空間演算 | 高パフォーマンス、正確 | 設定複雑、MVP に過剰 | ❌ |
| C: Mapbox vs Leaflet | 地図ライブラリ選定 | Mapbox: 3D/パフォーマンス | Leaflet: 軽量/無料 | Mapbox ✅ |

### 決定理由

- **Turf.js**: MVP では商圏数が限定的（数十個）なので、クライアント計算で十分。PostGIS は将来の最適化フェーズで導入可能（後方互換）。
- **Mapbox**: 将来的な 3D 表示・データビジュアライゼーション拡張に対応。react-map-gl による React 統合が成熟。
- **モック人口統計**: 座標ベースの決定論的シード（同じ地点 = 同じデータ）で開発・テストが予測可能。リアル API 連携は次フェーズ。

---

## Technical Design

### System Components

```
Frontend (Next.js)                          Backend (Node.js API)
┌─────────────────────────────┐            ┌──────────────────────────┐
│ app/(protected)/map/page    │            │ Presentation             │
│   └── MapWorkspace (widget) │  HTTP/JSON │   └── TradeAreaController│
│       ├── MapContainer      │◄──────────►│       └── Routes (6)     │
│       ├── TradeAreaCreation │            ├──────────────────────────┤
│       ├── TradeAreaList     │            │ UseCase                  │
│       └── DemographicPanel  │            │   ├── CreateTradeArea    │
│                             │            │   ├── Get/List/Delete    │
│ entities/trade-area         │            │   ├── UpdateTradeArea    │
│   └── TradeAreaCircle       │            │   └── GetDemographics    │
│                             │            ├──────────────────────────┤
│ shared/lib/geo.ts           │            │ Domain                   │
│   └── Turf.js circle        │            │   ├── TradeArea (Agg.)   │
└─────────────────────────────┘            │   ├── CenterPoint (VO)   │
                                           │   ├── Radius (VO)        │
                                           │   └── DemographicData(VO)│
                                           ├──────────────────────────┤
                                           │ Infrastructure           │
                                           │   ├── PrismaTradeAreaRepo│
                                           │   └── MockDemographicProv│
                                           └──────────────────────────┘
                                                       │
                                                       ▼
                                           ┌──────────────────────────┐
                                           │ PostgreSQL               │
                                           │   └── trade_areas table  │
                                           └──────────────────────────┘
```

### Data Model

```prisma
model TradeArea {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  name      String
  longitude Float
  latitude  Float
  radiusKm  Float    @map("radius_km")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("trade_areas")
}
```

### API Design

- OpenAPI: `projects/packages/api-contract/openapi.yaml`（TradeAreas タグ）

---

## Implementation Strategy

### Phase 1: OpenAPI + コード生成

**目的**: API 契約を先に定義

**成果物**:
- [x] `openapi.yaml` に TradeAreas タグ・6 エンドポイント・8 スキーマ追加
- [x] Orval による型生成

### Phase 2: ドメインモデル

**目的**: TradeArea 集約 + ValueObject の実装

**成果物**:
- [x] CenterPoint, Radius, TradeAreaName, DemographicData ValueObject
- [x] TradeArea AggregateRoot + TradeAreaCreatedEvent
- [x] Repository / DemographicDataProvider インターフェース
- [x] 31 ユニットテスト（CenterPoint: 12, Radius: 10, TradeArea: 9）

### Phase 3: インフラストラクチャ

**目的**: Prisma スキーマ + リポジトリ実装

**成果物**:
- [x] Prisma schema に TradeArea モデル追加
- [x] InMemoryTradeAreaRepository（テスト用）
- [x] PrismaTradeAreaRepository（本番用）
- [x] MockDemographicDataProvider（座標ベースの決定論的モック）

### Phase 4: ユースケース

**目的**: アプリケーション層のオーケストレーション

**成果物**:
- [x] 6 UseCase（Create, Get, List, Delete, Update, GetDemographics）
- [x] 20 ユニットテスト（InMemory リポジトリ使用）

### Phase 5: プレゼンテーション層

**目的**: HTTP エンドポイント + DI 配線

**成果物**:
- [x] Zod バリデーションスキーマ
- [x] TradeAreaController
- [x] Routes（6 エンドポイント、全 auth: true）
- [x] Container に配線

### Phase 6: フロントエンド基盤

**目的**: 地図関連パッケージ + shared + entities

**成果物**:
- [x] react-map-gl, mapbox-gl, @turf/circle, recharts インストール
- [x] `shared/lib/geo.ts` - Turf.js circle ヘルパー
- [x] `shared/config/mapbox.ts` - Mapbox 設定
- [x] `entities/trade-area/` - 型定義 + TradeAreaCircle コンポーネント

### Phase 7: フロントエンド機能 + ページ

**目的**: Feature + Widget + Page の統合

**成果物**:
- [x] feature: map-view（MapContainer, useMapView）
- [x] feature: trade-area-creation（RadiusSlider, TradeAreaCreationMode, useTradeAreaCreation）
- [x] feature: trade-area-management（API queries/mutations, TradeAreaList, useTradeAreas）
- [x] feature: demographic-analysis（DemographicPanel, PopulationChart, AgeDistributionChart）
- [x] widget: map-workspace（MapWorkspace - 全統合）
- [x] page: `/map` ルート
- [x] next.config.js に Mapbox CSP ヘッダー追加

---

## Test Strategy

### Unit Tests

| Component | Test Focus | Tests |
|-----------|------------|-------|
| CenterPoint | 境界値（-180/180, -90/90）、不正値 | 12 |
| Radius | min/max（0.1-50km）、不正値 | 10 |
| TradeArea | create/restore/rename/update | 9 |
| CreateTradeArea UC | 正常系 + バリデーション失敗 | 5 |
| GetTradeArea UC | 正常系 + 未存在 + 他ユーザー | 4 |
| ListTradeAreas UC | 空/1件/複数件 | 3 |
| DeleteTradeArea UC | 正常系 + 未存在 + 他ユーザー | 4 |
| GetDemographics UC | 正常系 + 未存在 + 決定論性 | 4 |

### Integration Tests

| Scenario | Systems Involved | Test Method |
|----------|------------------|-------------|
| 商圏 CRUD フロー | API + DB | DevContainer で `curl` テスト |
| 認証必須確認 | API + Auth Middleware | 401 レスポンス確認 |

### E2E Tests

| User Flow | Priority | Automated |
|-----------|----------|-----------|
| 地図表示 → 商圏作成 → 統計表示 | High | No（MVP） |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Mapbox API 制限 | Low | Medium | 無料枠の監視、Leaflet へのフォールバック可能 |
| モック → リアル移行の複雑さ | Medium | Medium | DemographicDataProvider インターフェースで疎結合 |
| Turf.js パフォーマンス（大量商圏） | Low | Low | 数十個想定、問題時は PostGIS へ移行 |
| react-map-gl の破壊的更新 | Low | Medium | バージョン固定 |

---

## Dependencies

### External Dependencies

| Dependency | Version | Purpose | Risk |
|------------|---------|---------|------|
| react-map-gl | latest | React Mapbox ラッパー | Low |
| mapbox-gl | latest | Mapbox GL JS | Low |
| @turf/circle | latest | GeoJSON 円生成 | Low |
| @turf/helpers | latest | Turf.js ユーティリティ | Low |
| recharts | latest | チャート描画 | Low |

### Internal Dependencies

| Component | Owner | Status |
|-----------|-------|--------|
| 認証基盤（JWT） | 既存実装 | Ready |
| Prisma + PostgreSQL | 既存実装 | Ready |
| @monorepo/shared（Result, ValueObject） | 既存実装 | Ready |

---

## Rollback Plan

### Rollback Trigger

- Mapbox 関連で CSP エラーが発生しフロントエンド全体が壊れる場合
- Prisma マイグレーションで既存テーブルが破壊される場合

### Rollback Steps

1. `git revert` で実装コミットを戻す
2. Prisma: `npx prisma migrate resolve --rolled-back <migration>` でマイグレーション解除
3. `trade_areas` テーブルを DROP（データ損失なし、新規テーブルのため）

### Data Migration Rollback

新規テーブルのみのため、DROP TABLE で完全にロールバック可能。既存データへの影響なし。

---

## Related Documents

- Spec: `.specify/specs/trade-area-analysis/spec.md`
- Tasks: `.specify/specs/trade-area-analysis/tasks.md`
- Issue: GitHub #6

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-14 | @claude | Initial plan (implementation already completed) |
