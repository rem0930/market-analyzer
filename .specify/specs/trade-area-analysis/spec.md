# Spec: 商圏分析 MVP（地図 + 商圏作成 + 人口統計表示）

## Metadata

- **ID**: trade-area-analysis
- **Status**: In Progress
- **Created**: 2026-02-14
- **Updated**: 2026-02-14

---

## Parent Documents

| Document | Path | Reference |
|----------|------|-----------|
| PRD | `docs/01_product/prd.md` | 商圏分析コア機能 |
| Identity | `docs/01_product/identity.md` | MarketAnalyzer プロダクトビジョン |
| Issue | GitHub #6 | [Feature] 商圏分析 MVP |

---

## Overview

地図上で任意の地点をクリックし、円商圏（半径 km 指定）を作成・保存・管理する機能を提供する。各商圏に対してモック人口統計データ（人口・世帯数・年齢構成・平均収入）を計算し、サイドパネルにチャートで表示する。MarketAnalyzer のコアとなる商圏分析ワークフローの MVP 実装。

---

## API Contract

### Endpoints

| Method | Path | Summary | Auth |
|--------|------|---------|------|
| `POST` | `/trade-areas` | 商圏を作成 | BearerAuth |
| `GET` | `/trade-areas` | ユーザーの商圏一覧を取得 | BearerAuth |
| `GET` | `/trade-areas/{tradeAreaId}` | 商圏を個別取得 | BearerAuth |
| `PATCH` | `/trade-areas/{tradeAreaId}` | 商圏を更新 | BearerAuth |
| `DELETE` | `/trade-areas/{tradeAreaId}` | 商圏を削除 | BearerAuth |
| `GET` | `/trade-areas/{tradeAreaId}/demographics` | 人口統計データを取得 | BearerAuth |

### OpenAPI Snippet

```yaml
paths:
  /trade-areas:
    post:
      operationId: createTradeArea
      tags: [TradeAreas]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateTradeAreaRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TradeAreaResponse'
    get:
      operationId: listTradeAreas
      tags: [TradeAreas]
      security:
        - BearerAuth: []
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/TradeAreasResponse'

  /trade-areas/{tradeAreaId}:
    get:
      operationId: getTradeArea
      tags: [TradeAreas]
      security:
        - BearerAuth: []
    patch:
      operationId: updateTradeArea
      tags: [TradeAreas]
      security:
        - BearerAuth: []
    delete:
      operationId: deleteTradeArea
      tags: [TradeAreas]
      security:
        - BearerAuth: []

  /trade-areas/{tradeAreaId}/demographics:
    get:
      operationId: getTradeAreaDemographics
      tags: [TradeAreas]
      security:
        - BearerAuth: []

components:
  schemas:
    GeoPoint:
      type: object
      required: [longitude, latitude]
      properties:
        longitude:
          type: number
          minimum: -180
          maximum: 180
        latitude:
          type: number
          minimum: -90
          maximum: 90

    CreateTradeAreaRequest:
      type: object
      required: [name, longitude, latitude, radiusKm]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        longitude:
          type: number
          minimum: -180
          maximum: 180
        latitude:
          type: number
          minimum: -90
          maximum: 90
        radiusKm:
          type: number
          minimum: 0.1
          maximum: 50

    TradeAreaResponse:
      type: object
      required: [id, userId, name, longitude, latitude, radiusKm, createdAt, updatedAt]
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        name:
          type: string
        longitude:
          type: number
        latitude:
          type: number
        radiusKm:
          type: number
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    DemographicDataResponse:
      type: object
      required: [tradeAreaId, population, households, averageIncome, ageDistribution]
      properties:
        tradeAreaId:
          type: string
        population:
          type: integer
        households:
          type: integer
        averageIncome:
          type: number
        ageDistribution:
          type: array
          items:
            $ref: '#/components/schemas/AgeDistribution'

    AgeDistribution:
      type: object
      required: [range, count, percentage]
      properties:
        range:
          type: string
        count:
          type: integer
        percentage:
          type: number
```

---

## Impact Analysis

### Affected Systems

- [x] Frontend: `/map` ルート新設、4 feature + 1 widget 追加
- [x] Backend: TradeArea ドメイン、UseCase、Controller 追加
- [x] Database: `trade_areas` テーブル新設
- [x] API: 6 エンドポイント新設

### Breaking Changes

- [x] なし（全て新規追加）

### Downstream Dependencies

| System | Impact | Migration Required |
|--------|--------|-------------------|
| AuthUser model | `tradeAreas` relation 追加 | No（後方互換） |

---

## Functional Requirements (FR)

### FR-001: 地図表示

Mapbox GL JS を使用した全画面インタラクティブ地図を表示する。

- デフォルト表示: 東京中心（lng: 139.6917, lat: 35.6895, zoom: 11）
- パン・ズーム操作
- クリックイベントの取得（緯度経度）

### FR-002: 商圏作成

地図上の任意の地点をクリックし、円商圏を作成できる。

- 「New Trade Area」ボタンで作成モードに入る
- 地図クリックで中心点を設定
- スライダーで半径を調整（0.1〜50 km）
- 名前を入力して保存
- 作成中はプレビュー円を表示（オレンジ、半透明）
- キャンセル機能

### FR-003: 商圏管理（CRUD）

商圏の一覧表示・個別表示・更新・削除ができる。

- サイドパネルに商圏リスト表示
- リストアイテムクリックで選択（地図上の円がハイライト）
- 削除ボタン
- 全操作がユーザースコープ（自分の商圏のみ）

### FR-004: 人口統計分析

選択した商圏の人口統計データをサイドパネルに表示する。

- サマリカード: 人口、世帯数、平均収入
- 棒グラフ: 年齢別人口分布
- 円グラフ: 年齢構成比率
- データはモック（座標ベースの決定論的生成、同じ地点 = 同じデータ）

### FR-005: 商圏 API

OpenAPI 仕様に準拠した商圏 CRUD + 人口統計エンドポイントを提供する。

- 全エンドポイントに BearerAuth 必須
- 入力バリデーション（Zod）
- userId によるアクセス制御
- Result パターンによるエラーハンドリング

### FR-006: ドメインモデル

Clean Architecture + DDD パターンで商圏ドメインを実装する。

- TradeArea: AggregateRoot（id, userId, name, center, radius）
- ValueObject: CenterPoint（lng/lat バリデーション）、Radius（0.1-50km）、TradeAreaName（1-100文字）
- DemographicData: ValueObject（人口・世帯・年齢分布・収入）
- TradeAreaRepository: Interface
- DemographicDataProvider: Interface

---

## Non-Functional Requirements (NFR)

### NFR-001: Performance

- 商圏一覧 API レスポンスタイム: p95 < 200ms
- 地図初期表示: < 3s（CDN キャッシュ前提）
- 円描画のジッタ: 60fps 維持

### NFR-002: Security

- 全エンドポイント BearerAuth 必須
- userId によるオーナーシップチェック（他ユーザーの商圏へのアクセス拒否）
- 入力バリデーション（座標範囲、半径範囲、名前長）
- Mapbox CSP ヘッダー設定

### NFR-003: Maintainability

- ドメイン層はフレームワーク非依存（Pure TypeScript）
- Repository は InMemory / Prisma の切り替え可能
- Feature-Sliced Design による UI 分離

---

## Acceptance Criteria (AC)

### AC-001: 地図表示

**Given** 認証済みユーザーが `/map` にアクセス
**When** ページが読み込まれる
**Then** 東京中心の Mapbox 地図が全画面表示され、パン・ズーム操作ができる

### AC-002: 商圏作成（正常系）

**Given** 認証済みユーザーが作成モードに入り、地図をクリックした
**When** 名前を入力し、半径を設定して「Save」を押す
**Then** 商圏が保存され、地図上に円として表示され、サイドパネルのリストに追加される

### AC-003: 商圏作成（バリデーション）

**Given** 作成リクエストで名前が空、または半径が範囲外
**When** API にリクエストを送信
**Then** 400 Bad Request が返り、適切なバリデーションメッセージが含まれる

### AC-004: 商圏一覧取得

**Given** 認証済みユーザーが複数の商圏を持つ
**When** `/trade-areas` を GET
**Then** 自分の商圏のみがリスト表示される（他ユーザーの商圏は含まれない）

### AC-005: 商圏削除

**Given** 認証済みユーザーが商圏を選択
**When** 削除ボタンをクリック
**Then** 商圏が削除され、地図上の円とリストから除去される

### AC-006: 他ユーザーの商圏アクセス拒否

**Given** ユーザー A が作成した商圏
**When** ユーザー B がその商圏を GET/PATCH/DELETE
**Then** 404 Not Found が返る

### AC-007: 人口統計データ表示

**Given** 認証済みユーザーが商圏を選択
**When** サイドパネルに人口統計データが読み込まれる
**Then** 人口・世帯数・平均収入のサマリカード、年齢別棒グラフ、年齢構成円グラフが表示される

### AC-008: 人口統計データの決定論性

**Given** 同じ座標・同じ半径の商圏
**When** 人口統計データを複数回取得
**Then** 毎回同じ値が返る

### AC-009: プレビュー円表示

**Given** 作成モード中にユーザーが地図をクリック
**When** 中心点が設定される
**Then** オレンジ色の半透明プレビュー円が表示され、スライダーで半径を変更するとリアルタイムに更新される

### AC-010: ドメインバリデーション

**Given** 不正な座標値（lng > 180, lat > 90 等）
**When** CenterPoint ValueObject の作成を試みる
**Then** Result.fail が返り、エンティティは生成されない

---

## Out of Scope

- PostGIS による空間クエリ（MVP では Turf.js のクライアント計算）
- リアル人口統計データ API 連携
- 商圏の重なり分析・比較機能
- 多角形商圏（円のみ）
- 商圏の共有・公開機能
- 商圏の検索・フィルタリング
- 地図上のクリックによる商圏選択（リストからの選択のみ）

---

## Assumptions

- Mapbox GL JS の無料枠で十分な API コール数がある
- `NEXT_PUBLIC_MAPBOX_TOKEN` 環境変数がデプロイ時に設定される
- 認証基盤（JWT トークン発行・検証）は実装済み
- PostgreSQL データベースが利用可能
- フロントエンドは Next.js App Router を使用

---

## Implementation Checklist

- [x] **OAS**: OpenAPI spec を `projects/packages/api-contract/openapi.yaml` に定義
- [x] **Generate**: `./tools/contract openapi-generate` で型生成
- [x] **Backend Domain**: ValueObject / AggregateRoot 作成（Pure, no I/O）
- [x] **Backend Domain Tests**: CenterPoint, Radius, TradeArea のユニットテスト
- [x] **Backend Infra**: Prisma スキーマ + Repository 実装
- [x] **Backend Infra**: MockDemographicDataProvider 実装
- [x] **Backend UseCase**: 6 UseCase 作成 + テスト
- [x] **Backend Presentation**: Controller / Routes / Zod Schemas 追加
- [x] **Backend DI**: Container に配線
- [x] **Frontend Deps**: react-map-gl, @turf/circle, recharts インストール
- [x] **Frontend Entities**: TradeArea 型 + TradeAreaCircle コンポーネント
- [x] **Frontend Features**: map-view, trade-area-creation, trade-area-management, demographic-analysis
- [x] **Frontend Widget**: MapWorkspace（地図 + サイドパネル統合）
- [x] **Frontend Page**: `/map` ルート
- [x] **Quality Gates**: typecheck + lint 通過

---

## Code Map

| Requirement | Module | File(s) | Test |
|-------------|--------|---------|------|
| FR-006 | Domain: CenterPoint | `api/src/domain/trade-area/center-point.ts` | `center-point.test.ts` (12 tests) |
| FR-006 | Domain: Radius | `api/src/domain/trade-area/radius.ts` | `radius.test.ts` (10 tests) |
| FR-006 | Domain: TradeArea | `api/src/domain/trade-area/trade-area.ts` | `trade-area.test.ts` (9 tests) |
| FR-005 | UseCase: Create | `api/src/usecase/trade-area/create-trade-area.ts` | `create-trade-area.test.ts` (5 tests) |
| FR-005 | UseCase: Get | `api/src/usecase/trade-area/get-trade-area.ts` | `get-trade-area.test.ts` (4 tests) |
| FR-005 | UseCase: List | `api/src/usecase/trade-area/list-trade-areas.ts` | `list-trade-areas.test.ts` (3 tests) |
| FR-005 | UseCase: Delete | `api/src/usecase/trade-area/delete-trade-area.ts` | `delete-trade-area.test.ts` (4 tests) |
| FR-004 | UseCase: Demographics | `api/src/usecase/trade-area/get-demographics.ts` | `get-demographics.test.ts` (4 tests) |
| FR-005 | Presentation | `api/src/presentation/controllers/trade-area-controller.ts` | - |
| FR-005 | Routes | `api/src/presentation/routes/trade-areas.ts` | - |
| FR-001 | Feature: map-view | `web/src/features/map-view/ui/MapContainer.tsx` | - |
| FR-002 | Feature: creation | `web/src/features/trade-area-creation/` | - |
| FR-003 | Feature: management | `web/src/features/trade-area-management/` | - |
| FR-004 | Feature: demographics | `web/src/features/demographic-analysis/` | - |
| FR-001-004 | Widget: workspace | `web/src/widgets/map-workspace/ui/MapWorkspace.tsx` | - |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-14 | @claude | Initial spec (implementation already completed) |
