# Spec: Google Places API による競合自動検索

## Metadata

- **ID**: competitor-search
- **Status**: Draft
- **Created**: 2026-02-15
- **Updated**: 2026-02-15

---

## Parent Documents

| Document | Path | Reference |
|----------|------|-----------|
| PRD | `docs/01_product/prd.md` | 競合店舗自動検索機能 |
| Identity | `docs/01_product/identity.md` | MarketAnalyzer プロダクトビジョン |
| Issue | GitHub #17 | [Feature] Google Places API による競合自動検索 |
| Parent Spec | `.specify/specs/competitor-management/spec.md` | 競合店舗 CRUD API（Issue #15） |
| Related Spec | `.specify/specs/trade-area-analysis/spec.md` | DemographicDataProvider パターン参照 |

---

## Overview

自店舗の周辺にある同業種の競合店舗を Google Places API で自動検索し、プレビュー → 選択 → 一括保存するワークフローを提供する。DemographicDataProvider と同じ Provider パターンで `CompetitorSearchProvider` インターフェースを domain 層に定義し、`GooglePlacesCompetitorSearchProvider`（本番用）と `MockCompetitorSearchProvider`（開発・テスト用）を infra 層で実装する。既存の Competitor CRUD（Issue #15）と Competitor Frontend（Issue #16）の上に構築する。

---

## API Contract

### Endpoints

| Method | Path | Summary | Auth | Rate Limit |
|--------|------|---------|------|------------|
| `POST` | `/stores/{storeId}/competitors/search` | 周辺競合店舗を検索（プレビュー） | BearerAuth | Yes |
| `POST` | `/stores/{storeId}/competitors/bulk` | 検索結果から一括登録 | BearerAuth | Yes |

### OpenAPI Snippet

```yaml
paths:
  /stores/{storeId}/competitors/search:
    parameters:
      - name: storeId
        in: path
        required: true
        schema:
          type: string
          format: uuid
    post:
      operationId: searchCompetitors
      summary: Search Nearby Competitors
      description: |
        自店舗の位置情報を基準に、指定した半径・キーワードで周辺の競合店舗を
        Google Places API（または Mock）で検索する。
        結果はプレビュー用であり、この時点ではデータベースに保存されない。
      tags:
        - CompetitorSearch
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/SearchCompetitorsRequest'
            examples:
              basic:
                summary: 基本検索
                value:
                  radiusMeters: 1000
                  keyword: "コンビニ"
              wideRange:
                summary: 広範囲検索
                value:
                  radiusMeters: 5000
                  keyword: "スーパーマーケット"
                  maxResults: 30
      responses:
        '200':
          description: 検索結果（プレビュー）
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SearchCompetitorsResponse'
        '400':
          description: バリデーションエラー
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: 認証エラー
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: 店舗が見つからない
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '429':
          description: レート制限超過
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '503':
          description: 外部サービス利用不可
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

  /stores/{storeId}/competitors/bulk:
    parameters:
      - name: storeId
        in: path
        required: true
        schema:
          type: string
          format: uuid
    post:
      operationId: bulkCreateCompetitors
      summary: Bulk Create Competitors
      description: |
        検索結果から選択された競合店舗を一括登録する。
        既に同じ googlePlaceId で登録済みの場合はスキップし、新規のみ作成する。
        source は自動的に "google_places" に設定される。
      tags:
        - CompetitorSearch
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BulkCreateCompetitorsRequest'
            examples:
              basic:
                summary: 3件一括登録
                value:
                  competitors:
                    - name: "セブンイレブン 東京駅前店"
                      longitude: 139.7671
                      latitude: 35.6812
                      googlePlaceId: "ChIJN1t_tDeuEmsRUsoyG83frY4"
                      category: "コンビニ"
                    - name: "ファミリーマート 丸の内店"
                      longitude: 139.7690
                      latitude: 35.6820
                      googlePlaceId: "ChIJe7wRAHuLGGARkFYMDqhIEZY"
                      category: "コンビニ"
                    - name: "ローソン 八重洲店"
                      longitude: 139.7710
                      latitude: 35.6805
                      googlePlaceId: "ChIJZ2b5KDeLGGARxvWYpTa7FQo"
                      category: "コンビニ"
      responses:
        '201':
          description: 一括登録結果
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BulkCreateCompetitorsResponse'
        '400':
          description: バリデーションエラー
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '401':
          description: 認証エラー
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
        '404':
          description: 店舗が見つからない
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'

components:
  schemas:
    SearchCompetitorsRequest:
      type: object
      required: [radiusMeters, keyword]
      properties:
        radiusMeters:
          type: integer
          minimum: 100
          maximum: 50000
          description: 検索半径（メートル、100〜50,000）
          example: 1000
        keyword:
          type: string
          minLength: 1
          maxLength: 100
          description: 検索キーワード（業種・店名など）
          example: "コンビニ"
        maxResults:
          type: integer
          minimum: 1
          maximum: 60
          default: 20
          description: 最大取得件数（1〜60、デフォルト 20）
          example: 20

    SearchCompetitorItem:
      type: object
      required: [name, longitude, latitude, googlePlaceId, category, address]
      properties:
        name:
          type: string
          description: 店舗名
          example: "セブンイレブン 東京駅前店"
        longitude:
          type: number
          description: 経度
          example: 139.7671
        latitude:
          type: number
          description: 緯度
          example: 35.6812
        googlePlaceId:
          type: string
          description: Google Places の Place ID
          example: "ChIJN1t_tDeuEmsRUsoyG83frY4"
        category:
          type: string
          description: Google Places のカテゴリ
          example: "コンビニ"
        address:
          type: string
          description: 住所
          example: "東京都千代田区丸の内1-9-1"
        distanceMeters:
          type: number
          description: 自店舗からの距離（メートル）
          example: 350.5
        alreadyRegistered:
          type: boolean
          description: 既に競合として登録済みかどうか
          example: false

    SearchCompetitorsResponse:
      type: object
      required: [results, total, searchCenter]
      properties:
        results:
          type: array
          items:
            $ref: '#/components/schemas/SearchCompetitorItem'
        total:
          type: integer
          description: 検索結果の総数
          example: 15
        searchCenter:
          type: object
          required: [longitude, latitude]
          properties:
            longitude:
              type: number
              example: 139.7670
            latitude:
              type: number
              example: 35.6810
          description: 検索の中心点（自店舗の位置）

    BulkCreateCompetitorItem:
      type: object
      required: [name, longitude, latitude, googlePlaceId]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
          description: 競合店舗名
        longitude:
          type: number
          minimum: -180
          maximum: 180
          description: 経度
        latitude:
          type: number
          minimum: -90
          maximum: 90
          description: 緯度
        googlePlaceId:
          type: string
          maxLength: 200
          description: Google Places の Place ID
        category:
          type: string
          maxLength: 100
          description: カテゴリ（任意）

    BulkCreateCompetitorsRequest:
      type: object
      required: [competitors]
      properties:
        competitors:
          type: array
          minItems: 1
          maxItems: 50
          items:
            $ref: '#/components/schemas/BulkCreateCompetitorItem'
          description: 登録する競合店舗のリスト（最大 50 件）

    BulkCreateCompetitorsResponse:
      type: object
      required: [created, skipped, total]
      properties:
        created:
          type: array
          items:
            $ref: '#/components/schemas/CompetitorResponse'
          description: 新規作成された競合店舗
        skipped:
          type: array
          items:
            type: object
            required: [googlePlaceId, reason]
            properties:
              googlePlaceId:
                type: string
              reason:
                type: string
                enum: [already_registered]
          description: スキップされた店舗（既に登録済み）
        total:
          type: object
          required: [created, skipped]
          properties:
            created:
              type: integer
              example: 3
            skipped:
              type: integer
              example: 1
```

---

## Impact Analysis

### Affected Systems

- [x] Frontend: 「周辺の競合を検索」ボタン、検索パラメータ入力、結果プレビュー、選択 → 一括保存
- [x] Backend: CompetitorSearchProvider interface、UseCase 2 件、Controller メソッド 2 件、Route 2 件
- [ ] Database: スキーマ変更なし（既存 Competitor テーブルで対応可能）
- [x] API: 2 エンドポイント新設

### Breaking Changes

- [x] なし（全て新規追加）

### Downstream Dependencies

| System | Impact | Migration Required |
|--------|--------|-------------------|
| Competitor model | `googlePlaceId` を重複チェックに使用 | No（既存カラム） |
| CompetitorRepository | `findByGooglePlaceId` メソッド追加 | No（後方互換） |
| Container / DI | CompetitorSearchProvider の配線追加 | No（追記のみ） |
| Environment | `GOOGLE_PLACES_API_KEY` 環境変数追加 | Yes（.env に追加） |

---

## Functional Requirements (FR)

### FR-001: CompetitorSearchProvider インターフェース

Domain 層に外部検索サービスの抽象化インターフェースを定義する。DemographicDataProvider パターンを踏襲する。

- `CompetitorSearchProvider` interface を `domain/competitor/` に定義
- メソッド: `searchNearby(center: CenterPoint, radiusMeters: number, keyword: string, maxResults?: number): Promise<CompetitorSearchResult[]>`
- `CompetitorSearchResult` ValueObject を定義（name, location, googlePlaceId, category, address, distanceMeters）
- Domain 層はフレームワーク・外部 API に依存しない（Pure TypeScript）

### FR-002: MockCompetitorSearchProvider

開発・テスト時に API コール不要なモック実装を提供する。

- `MockCompetitorSearchProvider` を `infrastructure/services/` に実装
- 座標ベースの決定論的データ生成（同じ中心点 = 同じ結果）
- 5〜15 件のモック店舗を生成（半径・キーワードに応じて変動）
- `config.useMockSearch` フラグで切り替え

### FR-003: GooglePlacesCompetitorSearchProvider

Google Places API (Nearby Search) を使用した本番実装を提供する。

- `GooglePlacesCompetitorSearchProvider` を `infrastructure/services/` に実装
- Google Places API (New) の Nearby Search エンドポイントを使用
- API キーは環境変数 `GOOGLE_PLACES_API_KEY` から取得
- レスポンスを `CompetitorSearchResult[]` にマッピング
- API エラーは内部で処理し、クライアントに Google 固有のエラー情報を漏らさない
- タイムアウト: 10 秒
- HTTPS 強制

### FR-004: SearchCompetitorsUseCase

店舗の位置情報を基準に周辺競合を検索し、プレビュー結果を返す。

- Store の所有権チェック（userId → storeId）
- Store の位置情報（CenterPoint）を検索の中心点として使用
- CompetitorSearchProvider を呼び出して検索実行
- 既存の Competitor と googlePlaceId で重複チェックし、`alreadyRegistered` フラグを付与
- 検索結果を距離順にソートして返す

### FR-005: BulkCreateCompetitorsUseCase

検索結果から選択された競合店舗を一括登録する。

- Store の所有権チェック（userId → storeId）
- 入力の競合店舗リストを検証（最大 50 件）
- 各アイテムに対して:
  - googlePlaceId で既存チェック → 重複はスキップ
  - `source: "google_places"` で Competitor を作成
  - Repository に保存
- 作成件数とスキップ件数を返す

### FR-006: Presentation 層

2 つの新エンドポイントの HTTP レイヤーを実装する。

- `POST /stores/:storeId/competitors/search` → SearchCompetitorsUseCase
- `POST /stores/:storeId/competitors/bulk` → BulkCreateCompetitorsUseCase
- Zod スキーマによる入力バリデーション
- レート制限ミドルウェア適用（search: 5 req/min, bulk: 10 req/min）
- 認証必須（BearerAuth）

### FR-007: CompetitorRepository 拡張

既存リポジトリに重複チェック用メソッドを追加する。

- `findByGooglePlaceIds(storeId: string, placeIds: string[]): Promise<Result<Competitor[], RepositoryError>>`
- InMemoryCompetitorRepository と PrismaCompetitorRepository の両方に実装

### FR-008: Frontend - 競合検索 UI

FSD パターンで `competitor-search` feature を作成する。

- 「周辺の競合を検索」ボタン（既存の competitor 一覧画面に追加）
- 検索パラメータ入力: 半径（スライダー: 100m〜5km）、キーワード（テキスト入力）
- 検索結果プレビュー: リスト + 地図上のマーカー表示
- チェックボックスで選択（全選択 / 個別選択）
- 「登録済み」ラベル表示（`alreadyRegistered: true` の結果）
- 「一括登録」ボタン → bulk API 呼び出し → 成功通知 → 一覧リフレッシュ

---

## Non-Functional Requirements (NFR)

### NFR-001: Performance

- 検索 API レスポンスタイム: p95 < 3s（外部 API 依存、Mock 時は < 200ms）
- 一括登録 API レスポンスタイム: p95 < 1s（50 件まで）
- 外部 API タイムアウト: 10 秒

### NFR-002: Security

- 全エンドポイント BearerAuth 必須
- userId → storeId の所有権チェック（404 で応答、存在を漏らさない）
- `GOOGLE_PLACES_API_KEY` は環境変数で管理（コードにハードコードしない）
- 入力バリデーション: radius 範囲（100〜50,000m）、keyword 長さ（1〜100 文字）
- 外部 API エラーの内部処理（Google 固有情報をクライアントに漏らさない）
- レート制限: search 5 req/min/IP、bulk 10 req/min/IP
- 一括登録サイズ制限: 最大 50 件/リクエスト
- API キーのログ出力禁止（sanitizer で自動マスク）

### NFR-003: Reliability

- Google Places API 障害時はグレースフルデグラデーション（503 + ユーザーフレンドリーなメッセージ）
- Mock モードが常に利用可能（API キー未設定時は自動フォールバック）
- 一括登録はトランザクション対応（部分失敗なし: 全成功 or 全失敗）

### NFR-004: Testability

- Domain 層のユニットテスト（CompetitorSearchResult ValueObject）
- UseCase 層のユニットテスト（MockCompetitorSearchProvider + InMemoryRepository）
- 外部 API の統合テストは MockProvider で代替
- 全エラーパスのテストカバレッジ

### NFR-005: Maintainability

- Provider パターンにより外部 API を差し替え可能（Yelp, Yahoo! ロコサーチ等）
- Mock/Real の切り替えは環境変数のみで制御
- ドメイン層はフレームワーク非依存（Pure TypeScript）

---

## Acceptance Criteria (AC)

### AC-001: 競合検索（正常系）

**Given** 認証済みユーザーが自分の店舗を所有
**When** `POST /stores/{storeId}/competitors/search` に `{ radiusMeters: 1000, keyword: "コンビニ" }` を送信
**Then** 200 OK が返り、`results` 配列に周辺の店舗情報（name, location, googlePlaceId, category, address, distanceMeters）が含まれる

### AC-002: 競合検索（店舗未所有）

**Given** ユーザー A がユーザー B の店舗 ID を指定
**When** `POST /stores/{storeId}/competitors/search` にリクエスト
**Then** 404 Not Found が返る（店舗の存在を漏らさない）

### AC-003: 競合検索（バリデーション）

**Given** `radiusMeters` が 50（下限未満）または `keyword` が空
**When** `POST /stores/{storeId}/competitors/search` にリクエスト
**Then** 400 Bad Request が返り、バリデーションエラーメッセージが含まれる

### AC-004: 競合検索（登録済みフラグ）

**Given** 店舗に googlePlaceId "abc123" の競合が既に登録済み
**When** 検索結果に同じ googlePlaceId の店舗が含まれる
**Then** その結果の `alreadyRegistered` が `true` になる

### AC-005: 一括登録（正常系）

**Given** 認証済みユーザーが 3 件の検索結果を選択
**When** `POST /stores/{storeId}/competitors/bulk` に送信
**Then** 201 Created が返り、`created` に 3 件の CompetitorResponse、`total.created: 3, total.skipped: 0` が含まれる

### AC-006: 一括登録（重複スキップ）

**Given** 3 件中 1 件が既に同じ googlePlaceId で登録済み
**When** `POST /stores/{storeId}/competitors/bulk` に送信
**Then** 201 Created が返り、`created` に 2 件、`skipped` に 1 件（reason: "already_registered"）が含まれる

### AC-007: 一括登録（上限超過）

**Given** 51 件以上の competitors を含むリクエスト
**When** `POST /stores/{storeId}/competitors/bulk` に送信
**Then** 400 Bad Request が返る

### AC-008: 一括登録（source 自動設定）

**Given** 一括登録で作成された Competitor
**When** その Competitor を GET で取得
**Then** `source` が `"google_places"` に設定されている

### AC-009: 一括登録（店舗未所有）

**Given** ユーザー A がユーザー B の店舗 ID を指定
**When** `POST /stores/{storeId}/competitors/bulk` にリクエスト
**Then** 404 Not Found が返る

### AC-010: 未認証アクセス拒否

**Given** Authorization ヘッダーなし、または無効なトークン
**When** `/competitors/search` または `/competitors/bulk` エンドポイントにリクエスト
**Then** 401 Unauthorized が返る

### AC-011: 外部 API エラー時のグレースフルデグラデーション

**Given** Google Places API がタイムアウトまたはエラーを返す
**When** `POST /stores/{storeId}/competitors/search` にリクエスト
**Then** 503 Service Unavailable が返り、ユーザーフレンドリーなメッセージが含まれ、Google 固有のエラー情報は含まれない

### AC-012: レート制限

**Given** 同一 IP から 1 分以内に 6 回の検索リクエスト
**When** 6 回目のリクエストを送信
**Then** 429 Too Many Requests が返る

### AC-013: CompetitorSearchResult バリデーション

**Given** 不正な座標値（lng > 180, lat > 90 等）の検索結果
**When** CompetitorSearchResult ValueObject の作成を試みる
**Then** バリデーションエラーが発生する

### AC-014: Frontend 検索フロー

**Given** 認証済みユーザーが競合一覧画面を表示
**When** 「周辺の競合を検索」ボタンをクリックし、半径とキーワードを入力して検索
**Then** 検索結果がリスト表示され、チェックボックスで選択 → 「一括登録」ボタンで登録できる

---

## Out of Scope

- Google Places API 以外の外部 API 連携（Yelp, Yahoo! ロコサーチ等）
- 検索履歴の保存・管理
- 定期的な自動検索（スケジュール実行）
- 検索結果のキャッシュ
- Place Details API による詳細情報取得（営業時間、レビュー等）
- ページネーション（検索結果は maxResults で制御）
- 検索結果の地図上での範囲描画（円の表示）は trade-area-analysis の機能を流用検討

---

## Assumptions

- 認証基盤（JWT トークン発行・検証）は実装済み
- Competitor CRUD API（Issue #15）が実装済み
- Competitor Frontend（Issue #16）が実装済み
- Store ドメインが実装済み（位置情報: CenterPoint を保持）
- PostgreSQL データベースが利用可能
- Google Places API キーを取得済み（開発中は Mock で代替可能）
- 既存の CenterPoint ValueObject が検索の中心点に適用可能

---

## Code Map

| Requirement | Module | File(s) | Test |
|-------------|--------|---------|------|
| FR-001 | Domain: CompetitorSearchProvider | `api/src/domain/competitor/competitor-search-provider.ts` | - |
| FR-001 | Domain: CompetitorSearchResult | `api/src/domain/competitor/competitor-search-result.ts` | `competitor-search-result.test.ts` |
| FR-002 | Infra: MockSearchProvider | `api/src/infrastructure/services/mock-competitor-search-provider.ts` | - |
| FR-003 | Infra: GooglePlacesSearchProvider | `api/src/infrastructure/services/google-places-competitor-search-provider.ts` | - |
| FR-004 | UseCase: SearchCompetitors | `api/src/usecase/competitor/search-competitors.ts` | `search-competitors.test.ts` |
| FR-005 | UseCase: BulkCreateCompetitors | `api/src/usecase/competitor/bulk-create-competitors.ts` | `bulk-create-competitors.test.ts` |
| FR-006 | Presentation: Schemas | `api/src/presentation/schemas/competitor-search-schemas.ts` | - |
| FR-006 | Presentation: Controller | `api/src/presentation/controllers/competitor-controller.ts` | - |
| FR-006 | Presentation: Routes | `api/src/presentation/routes/competitors.ts` | - |
| FR-007 | Domain: CompetitorRepository | `api/src/domain/competitor/competitor-repository.ts` | - |
| FR-007 | Infra: InMemoryCompetitorRepo | `api/src/infrastructure/repositories/in-memory-competitor-repository.ts` | - |
| FR-007 | Infra: PrismaCompetitorRepo | `api/src/infrastructure/repositories/prisma-competitor-repository.ts` | - |
| FR-008 | Frontend: competitor-search | `web/src/features/competitor-search/` | - |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | @claude | Initial spec |
