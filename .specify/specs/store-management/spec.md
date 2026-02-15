# Spec: 自店舗管理 - ドメインモデル & CRUD API

## Metadata

- **ID**: store-management
- **Status**: Draft
- **Created**: 2026-02-14
- **Updated**: 2026-02-14

---

## Parent Documents

| Document | Path | Reference |
|----------|------|-----------|
| PRD | `docs/01_product/prd.md` | 自店舗管理機能 |
| Identity | `docs/01_product/identity.md` | MarketAnalyzer プロダクトビジョン |
| Issue | GitHub #13 | [Feature] 自店舗管理 - ドメインモデル & CRUD API |
| Related Spec | `.specify/specs/trade-area-analysis/spec.md` | 商圏分析（パターン参照） |

---

## Overview

自店舗（Store）を登録・管理するバックエンド基盤を提供する。競合分析の基点となる物理店舗の概念をドメインモデルとして定義し、CRUD API を実装する。既存の TradeArea パターン（AggregateRoot, Result 型, DomainEvent, Repository interface）を踏襲し、CenterPoint ValueObject を再利用する。

---

## API Contract

### Endpoints

| Method | Path | Summary | Auth |
|--------|------|---------|------|
| `POST` | `/stores` | 店舗を作成 | BearerAuth |
| `GET` | `/stores` | ユーザーの店舗一覧を取得 | BearerAuth |
| `GET` | `/stores/{storeId}` | 店舗を個別取得 | BearerAuth |
| `PATCH` | `/stores/{storeId}` | 店舗を更新 | BearerAuth |
| `DELETE` | `/stores/{storeId}` | 店舗を削除 | BearerAuth |

### OpenAPI Snippet

```yaml
paths:
  /stores:
    post:
      operationId: createStore
      tags: [Stores]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateStoreRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StoreResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
    get:
      operationId: listStores
      tags: [Stores]
      security:
        - BearerAuth: []
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StoresResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'

  /stores/{storeId}:
    parameters:
      - name: storeId
        in: path
        required: true
        schema:
          type: string
          format: uuid
    get:
      operationId: getStore
      tags: [Stores]
      security:
        - BearerAuth: []
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StoreResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'
    patch:
      operationId: updateStore
      tags: [Stores]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateStoreRequest'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StoreResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'
    delete:
      operationId: deleteStore
      tags: [Stores]
      security:
        - BearerAuth: []
      responses:
        '204':
          description: No Content
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

components:
  schemas:
    CreateStoreRequest:
      type: object
      required: [name, address, longitude, latitude]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        address:
          type: string
          minLength: 1
          maxLength: 500
        longitude:
          type: number
          minimum: -180
          maximum: 180
        latitude:
          type: number
          minimum: -90
          maximum: 90

    UpdateStoreRequest:
      type: object
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        address:
          type: string
          minLength: 1
          maxLength: 500
        longitude:
          type: number
          minimum: -180
          maximum: 180
        latitude:
          type: number
          minimum: -90
          maximum: 90

    StoreResponse:
      type: object
      required: [id, userId, name, address, longitude, latitude, createdAt, updatedAt]
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        name:
          type: string
        address:
          type: string
        longitude:
          type: number
        latitude:
          type: number
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    StoresResponse:
      type: object
      required: [stores]
      properties:
        stores:
          type: array
          items:
            $ref: '#/components/schemas/StoreResponse'
```

---

## Impact Analysis

### Affected Systems

- [ ] Frontend: なし（本 Issue はバックエンドのみ。Issue #14 でフロントエンド対応）
- [x] Backend: Store ドメイン、UseCase、Controller、Repository 追加
- [x] Database: `stores` テーブル新設
- [x] API: 5 エンドポイント新設

### Breaking Changes

- [x] なし（全て新規追加）

### Downstream Dependencies

| System | Impact | Migration Required |
|--------|--------|-------------------|
| AuthUser model | `stores` relation 追加 | No（後方互換） |
| Issue #14 (Store Frontend) | 本 API に依存 | No（本 Issue 完了後に着手） |
| Issue #15 (Competitor Backend) | Store を参照する可能性 | No（将来の拡張で対応） |

---

## Functional Requirements (FR)

### FR-001: Store ドメインモデル

Clean Architecture + DDD パターンで自店舗ドメインを実装する。

- `Store`: AggregateRoot（id, userId, name, address, location, timestamps）
- `StoreId`: UUIDIdentifier
- `StoreName`: ValueObject（1〜100 文字、トリム処理）
- `StoreAddress`: ValueObject（1〜500 文字、トリム処理）
- Store の location は既存の `CenterPoint` ValueObject を再利用（lng/lat バリデーション）
- `StoreCreatedEvent`: ドメインイベント
- `StoreRepository`: Interface（domain 層に定義）

### FR-002: Store CRUD API

OpenAPI 仕様に準拠した 5 エンドポイントを提供する。

- `POST /stores` — 店舗を新規作成（201 Created）
- `GET /stores` — ユーザーの全店舗を取得（200 OK）
- `GET /stores/{storeId}` — 店舗を個別取得（200 OK）
- `PATCH /stores/{storeId}` — 店舗を部分更新（200 OK）
- `DELETE /stores/{storeId}` — 店舗を削除（204 No Content）

### FR-003: UseCases

5 つの UseCase を実装する。

- `CreateStoreUseCase`: 入力バリデーション → Store 生成 → 永続化
- `GetStoreUseCase`: ID + userId による取得（所有権チェック）
- `ListStoresUseCase`: userId による一覧取得
- `UpdateStoreUseCase`: 部分更新（name, address, location の任意組み合わせ）
- `DeleteStoreUseCase`: ID + userId による削除（所有権チェック）

### FR-004: データ永続化

Prisma を使用した `stores` テーブルを作成する。

- カラム: id (UUID PK), user_id (FK), name, address, longitude, latitude, created_at, updated_at
- `user_id` にインデックス
- AuthUser との relation（onDelete: Cascade）
- Prisma Repository + InMemory Repository（テスト用）の 2 実装

### FR-005: アクセス制御

userId によるオーナーシップベースのアクセス制御を実装する。

- 全エンドポイントに BearerAuth 必須
- userId は JWT から auth middleware で抽出
- GET /stores は自分の店舗のみ返却
- GET/PATCH/DELETE /stores/{id} は UseCase 層で所有権チェック（他ユーザー → 404）
- GET /stores は Repository レベルで userId フィルタリング（findByUserId）
- 単一店舗操作（GET/PATCH/DELETE by ID）は findById 後に UseCase 層で userId を検証

---

## Non-Functional Requirements (NFR)

### NFR-001: Performance

- 店舗一覧 API レスポンスタイム: p95 < 200ms
- 店舗作成 API レスポンスタイム: p95 < 300ms

### NFR-002: Security

- 全エンドポイント BearerAuth 必須
- userId によるオーナーシップチェック（他ユーザーの店舗へのアクセス → 404）
- 入力バリデーション（Zod スキーマ: 名前長、住所長、座標範囲）
- CSRF 保護（既存ミドルウェアで自動適用）
- POST /stores にレート制限（10 req/min/IP）

### NFR-003: Maintainability

- ドメイン層はフレームワーク非依存（Pure TypeScript）
- Repository は InMemory / Prisma の切り替え可能
- 既存 TradeArea パターンとの一貫性を維持

### NFR-004: Testability

- ドメイン層のユニットテスト（ValueObject バリデーション、AggregateRoot 操作）
- UseCase 層のユニットテスト（InMemory Repository 使用）
- 全エラーパスのテストカバレッジ

---

## Acceptance Criteria (AC)

### AC-001: 店舗作成（正常系）

**Given** 認証済みユーザーが有効なリクエストボディを送信
**When** `POST /stores` にリクエスト
**Then** 201 Created が返り、作成された店舗の全フィールド（id, userId, name, address, longitude, latitude, createdAt, updatedAt）が含まれる

### AC-002: 店舗作成（バリデーション）

**Given** 名前が空、住所が空、座標が範囲外のいずれか
**When** `POST /stores` にリクエスト
**Then** 400 Bad Request が返り、該当フィールドのバリデーションエラーメッセージが含まれる

### AC-003: 店舗一覧取得

**Given** 認証済みユーザーが複数の店舗を持つ
**When** `GET /stores` にリクエスト
**Then** 自分の店舗のみがリスト表示される（他ユーザーの店舗は含まれない）

### AC-004: 店舗個別取得（正常系）

**Given** 認証済みユーザーが自分の店舗 ID を指定
**When** `GET /stores/{storeId}` にリクエスト
**Then** 200 OK で店舗の全フィールドが返る

### AC-005: 店舗個別取得（他ユーザー）

**Given** ユーザー A が作成した店舗
**When** ユーザー B が `GET /stores/{storeId}` にリクエスト
**Then** 404 Not Found が返る（店舗の存在を漏らさない）

### AC-006: 店舗更新（部分更新）

**Given** 認証済みユーザーが自分の店舗に対して name のみ送信
**When** `PATCH /stores/{storeId}` にリクエスト
**Then** 200 OK で name が更新され、他フィールドは変更されない

### AC-007: 店舗更新（バリデーション）

**Given** 名前が 100 文字超、または座標が範囲外
**When** `PATCH /stores/{storeId}` にリクエスト
**Then** 400 Bad Request が返る

### AC-008: 店舗削除

**Given** 認証済みユーザーが自分の店舗 ID を指定
**When** `DELETE /stores/{storeId}` にリクエスト
**Then** 204 No Content が返り、再度 GET すると 404 になる

### AC-009: 未認証アクセス拒否

**Given** Authorization ヘッダーなし、または無効なトークン
**When** いずれかの `/stores` エンドポイントにリクエスト
**Then** 401 Unauthorized が返る

### AC-010: ドメインバリデーション

**Given** 不正な座標値（lng > 180, lat > 90 等）
**When** CenterPoint ValueObject の作成を試みる
**Then** バリデーションエラーが発生し、Store は生成されない

### AC-011: StoreName バリデーション

**Given** 空文字列、または 100 文字超の名前
**When** StoreName ValueObject の作成を試みる
**Then** バリデーションエラーが発生する

### AC-012: StoreAddress バリデーション

**Given** 空文字列、または 500 文字超の住所
**When** StoreAddress ValueObject の作成を試みる
**Then** バリデーションエラーが発生する

---

## Out of Scope

- フロントエンド UI（Issue #14 で対応）
- 競合店舗との関連付け（Issue #15, #16 で対応）
- CSV インポート（Issue #18 で対応）
- Google Places API 連携（Issue #17 で対応）
- 店舗の検索・フィルタリング（将来拡張）
- 店舗画像のアップロード
- 店舗の公開・共有機能
- バッチ作成・更新 API

---

## Assumptions

- 認証基盤（JWT トークン発行・検証）は実装済み
- PostgreSQL データベースが利用可能
- Prisma ORM がセットアップ済み
- 既存の CenterPoint ValueObject が Store の位置情報に適用可能
- Store と TradeArea は独立した概念（Store = 物理店舗、TradeArea = 分析範囲）

---

## Code Map

| Requirement | Module | File(s) | Test |
|-------------|--------|---------|------|
| FR-001 | Domain: StoreId | `api/src/domain/store/store.ts` | `store.test.ts` |
| FR-001 | Domain: StoreName | `api/src/domain/store/store-name.ts` | `store-name.test.ts` |
| FR-001 | Domain: StoreAddress | `api/src/domain/store/store-address.ts` | `store-address.test.ts` |
| FR-001 | Domain: Store | `api/src/domain/store/store.ts` | `store.test.ts` |
| FR-004 | Infra: PrismaStoreRepo | `api/src/infrastructure/repositories/prisma-store-repository.ts` | - |
| FR-004 | Infra: InMemoryStoreRepo | `api/src/infrastructure/repositories/in-memory-store-repository.ts` | - |
| FR-003 | UseCase: Create | `api/src/usecase/store/create-store.ts` | `create-store.test.ts` |
| FR-003 | UseCase: Get | `api/src/usecase/store/get-store.ts` | `get-store.test.ts` |
| FR-003 | UseCase: List | `api/src/usecase/store/list-stores.ts` | `list-stores.test.ts` |
| FR-003 | UseCase: Update | `api/src/usecase/store/update-store.ts` | `update-store.test.ts` |
| FR-003 | UseCase: Delete | `api/src/usecase/store/delete-store.ts` | `delete-store.test.ts` |
| FR-002 | Presentation: Controller | `api/src/presentation/controllers/store-controller.ts` | - |
| FR-002 | Presentation: Routes | `api/src/presentation/routes/stores.ts` | - |
| FR-002 | Presentation: Schemas | `api/src/presentation/schemas/store-schemas.ts` | - |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-14 | @claude | Initial spec |
