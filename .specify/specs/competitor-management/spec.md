# Spec: 競合店舗 - ドメインモデル & CRUD API

## Metadata

- **ID**: competitor-management
- **Status**: Implemented
- **Created**: 2026-02-15
- **Updated**: 2026-02-15

---

## Parent Documents

| Document | Path | Reference |
|----------|------|-----------|
| PRD | `docs/01_product/prd.md` | 競合店舗管理機能 |
| Identity | `docs/01_product/identity.md` | MarketAnalyzer プロダクトビジョン |
| Issue | GitHub #15 | [Feature] 競合店舗 - ドメインモデル & CRUD API |
| Related Spec | `.specify/specs/store-management/spec.md` | 自店舗管理（パターン参照、親エンティティ） |

---

## Overview

自店舗（Store）に紐づく競合店舗（Competitor）を登録・管理するバックエンド基盤を提供する。手動登録と Google Places API 自動検索の 2 経路を `source` フィールドで区別して管理する。Store パターン（AggregateRoot, Result 型, DomainEvent, Repository interface）を踏襲し、CenterPoint ValueObject を再利用する。アクセス制御は userId → storeId → competitorId の 2 段階で実施する。

---

## API Contract

### Endpoints

| Method | Path | Summary | Auth |
|--------|------|---------|------|
| `POST` | `/stores/{storeId}/competitors` | 競合店舗を作成 | BearerAuth |
| `GET` | `/stores/{storeId}/competitors` | 店舗の競合一覧を取得 | BearerAuth |
| `GET` | `/competitors/{competitorId}` | 競合店舗を個別取得 | BearerAuth |
| `PATCH` | `/competitors/{competitorId}` | 競合店舗を更新 | BearerAuth |
| `DELETE` | `/competitors/{competitorId}` | 競合店舗を削除 | BearerAuth |

### OpenAPI Snippet

```yaml
paths:
  /stores/{storeId}/competitors:
    parameters:
      - name: storeId
        in: path
        required: true
        schema:
          type: string
          format: uuid
    post:
      operationId: createCompetitor
      tags: [Competitors]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateCompetitorRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompetitorResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'
    get:
      operationId: listCompetitorsByStore
      tags: [Competitors]
      security:
        - BearerAuth: []
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompetitorsResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'

  /competitors/{competitorId}:
    parameters:
      - name: competitorId
        in: path
        required: true
        schema:
          type: string
          format: uuid
    get:
      operationId: getCompetitor
      tags: [Competitors]
      security:
        - BearerAuth: []
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompetitorResponse'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'
    patch:
      operationId: updateCompetitor
      tags: [Competitors]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateCompetitorRequest'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompetitorResponse'
        '400':
          $ref: '#/components/responses/ValidationError'
        '401':
          $ref: '#/components/responses/UnauthorizedError'
        '404':
          $ref: '#/components/responses/NotFoundError'
    delete:
      operationId: deleteCompetitor
      tags: [Competitors]
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
    CreateCompetitorRequest:
      type: object
      required: [name, longitude, latitude, source]
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
        source:
          type: string
          enum: [manual, google_places]
        googlePlaceId:
          type: string
          maxLength: 200
        category:
          type: string
          maxLength: 100

    UpdateCompetitorRequest:
      type: object
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
        category:
          type: string
          maxLength: 100
          nullable: true

    CompetitorResponse:
      type: object
      required: [id, storeId, name, longitude, latitude, source, googlePlaceId, category, createdAt, updatedAt]
      properties:
        id:
          type: string
          format: uuid
        storeId:
          type: string
          format: uuid
        name:
          type: string
        longitude:
          type: number
        latitude:
          type: number
        source:
          type: string
          enum: [manual, google_places]
        googlePlaceId:
          type: string
          nullable: true
        category:
          type: string
          nullable: true
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    CompetitorsResponse:
      type: object
      required: [competitors, total]
      properties:
        competitors:
          type: array
          items:
            $ref: '#/components/schemas/CompetitorResponse'
        total:
          type: integer
```

---

## Impact Analysis

### Affected Systems

- [ ] Frontend: なし（本 Issue はバックエンドのみ）
- [x] Backend: Competitor ドメイン、UseCase、Controller、Repository 追加
- [x] Database: `competitors` テーブル新設
- [x] API: 5 エンドポイント新設

### Breaking Changes

- [x] なし（全て新規追加）

### Downstream Dependencies

| System | Impact | Migration Required |
|--------|--------|-------------------|
| Store model | `competitors` relation 追加 | No（後方互換） |
| Issue #4 (Google Places API) | 本 API の source フィールドに依存 | No（将来の拡張） |

---

## Functional Requirements (FR)

### FR-001: Competitor ドメインモデル

Clean Architecture + DDD パターンで競合店舗ドメインを実装する。

- `Competitor`: AggregateRoot（id, storeId, name, location, source, googlePlaceId?, category?, timestamps）
- `CompetitorId`: UUIDIdentifier
- `CompetitorName`: ValueObject（1〜100 文字、トリム処理）
- `CompetitorSource`: ValueObject（`manual` | `google_places` の enum）
- Competitor の location は既存の `CenterPoint` ValueObject を再利用（lng/lat バリデーション）
- `CompetitorCreatedEvent`: ドメインイベント
- `CompetitorRepository`: Interface（domain 層に定義）

### FR-002: Competitor CRUD API

OpenAPI 仕様に準拠した 5 エンドポイントを提供する。

- `POST /stores/{storeId}/competitors` — 競合店舗を新規作成（201 Created）
- `GET /stores/{storeId}/competitors` — 店舗の競合一覧を取得（200 OK）
- `GET /competitors/{competitorId}` — 競合店舗を個別取得（200 OK）
- `PATCH /competitors/{competitorId}` — 競合店舗を部分更新（200 OK）
- `DELETE /competitors/{competitorId}` — 競合店舗を削除（204 No Content）

### FR-003: UseCases

5 つの UseCase を実装する。

- `CreateCompetitorUseCase`: storeId の所有権確認 → 入力バリデーション → Competitor 生成 → 永続化
- `GetCompetitorUseCase`: competitorId で取得 → storeId 経由で所有権チェック
- `ListCompetitorsByStoreUseCase`: storeId の所有権確認 → 一覧取得
- `UpdateCompetitorUseCase`: 所有権確認 → 部分更新（name, location, category の任意組み合わせ）
- `DeleteCompetitorUseCase`: 所有権確認 → 削除

### FR-004: データ永続化

Prisma を使用した `competitors` テーブルを作成する。

- カラム: id (UUID PK), store_id (FK), name, longitude, latitude, source, google_place_id?, category?, created_at, updated_at, version
- `store_id` にインデックス
- Store との relation（onDelete: Cascade）
- Prisma Repository + InMemory Repository（テスト用）の 2 実装

### FR-005: アクセス制御

userId → storeId → competitorId の 2 段階アクセス制御を実装する。

- 全エンドポイントに BearerAuth 必須
- userId は JWT から auth middleware で抽出
- POST/GET /stores/{storeId}/competitors は storeId の所有権を UseCase 層で検証
- GET/PATCH/DELETE /competitors/{id} は competitor の storeId を経由して所有権チェック
- 他ユーザー → 404（存在を漏らさない）

---

## Non-Functional Requirements (NFR)

### NFR-001: Performance

- 競合一覧 API レスポンスタイム: p95 < 200ms
- 競合作成 API レスポンスタイム: p95 < 300ms

### NFR-002: Security

- 全エンドポイント BearerAuth 必須
- 2 段階所有権チェック（userId → storeId → competitorId）
- 入力バリデーション（Zod スキーマ: 名前長、座標範囲、source enum）
- CSRF 保護（既存ミドルウェアで自動適用）

### NFR-003: Maintainability

- ドメイン層はフレームワーク非依存（Pure TypeScript）
- Repository は InMemory / Prisma の切り替え可能
- 既存 Store パターンとの一貫性を維持

### NFR-004: Testability

- ドメイン層のユニットテスト（ValueObject バリデーション、AggregateRoot 操作）
- UseCase 層のユニットテスト（InMemory Repository 使用）
- 全エラーパスのテストカバレッジ

---

## Acceptance Criteria (AC)

### AC-001: 競合店舗作成（正常系）

**Given** 認証済みユーザーが自分の店舗に対して有効なリクエストボディを送信
**When** `POST /stores/{storeId}/competitors` にリクエスト
**Then** 201 Created が返り、作成された競合店舗の全フィールドが含まれる

### AC-002: 競合店舗作成（バリデーション）

**Given** 名前が空、座標が範囲外、source が不正のいずれか
**When** `POST /stores/{storeId}/competitors` にリクエスト
**Then** 400 Bad Request が返り、該当フィールドのバリデーションエラーメッセージが含まれる

### AC-003: 競合店舗作成（店舗未所有）

**Given** ユーザー A がユーザー B の店舗 ID を指定
**When** `POST /stores/{storeId}/competitors` にリクエスト
**Then** 404 Not Found が返る（店舗の存在を漏らさない）

### AC-004: 店舗別競合一覧取得

**Given** 認証済みユーザーが複数の競合店舗を持つ店舗を指定
**When** `GET /stores/{storeId}/competitors` にリクエスト
**Then** 自分の店舗の競合のみがリスト表示され、total フィールドに件数が含まれる

### AC-005: 競合店舗個別取得（正常系）

**Given** 認証済みユーザーが自分の店舗に紐づく競合 ID を指定
**When** `GET /competitors/{competitorId}` にリクエスト
**Then** 200 OK で競合店舗の全フィールドが返る

### AC-006: 競合店舗個別取得（他ユーザー）

**Given** ユーザー A の店舗に紐づく競合店舗
**When** ユーザー B が `GET /competitors/{competitorId}` にリクエスト
**Then** 404 Not Found が返る

### AC-007: 競合店舗更新（部分更新）

**Given** 認証済みユーザーが name のみ送信
**When** `PATCH /competitors/{competitorId}` にリクエスト
**Then** 200 OK で name が更新され、他フィールドは変更されない

### AC-008: 競合店舗更新（座標ペア必須）

**Given** longitude のみ送信（latitude なし）
**When** `PATCH /competitors/{competitorId}` にリクエスト
**Then** 400 Bad Request が返る（座標はペアで指定が必要）

### AC-009: 競合店舗削除

**Given** 認証済みユーザーが自分の店舗に紐づく競合 ID を指定
**When** `DELETE /competitors/{competitorId}` にリクエスト
**Then** 204 No Content が返り、再度 GET すると 404 になる

### AC-010: 未認証アクセス拒否

**Given** Authorization ヘッダーなし、または無効なトークン
**When** いずれかの `/competitors` エンドポイントにリクエスト
**Then** 401 Unauthorized が返る

### AC-011: CompetitorName バリデーション

**Given** 空文字列、または 100 文字超の名前
**When** CompetitorName ValueObject の作成を試みる
**Then** バリデーションエラーが発生する

### AC-012: CompetitorSource バリデーション

**Given** `manual` でも `google_places` でもない値
**When** CompetitorSource ValueObject の作成を試みる
**Then** バリデーションエラーが発生する

---

## Out of Scope

- フロントエンド UI
- Google Places API 連携（Issue #4 で対応）
- 競合店舗の検索・フィルタリング（将来拡張）
- 競合店舗の一括インポート
- 競合店舗の画像管理
- ページネーション（将来拡張）

---

## Assumptions

- 認証基盤（JWT トークン発行・検証）は実装済み
- PostgreSQL データベースが利用可能
- Prisma ORM がセットアップ済み
- Store ドメインが実装済み（Issue #13）
- 既存の CenterPoint ValueObject が Competitor の位置情報に適用可能

---

## Code Map

| Requirement | Module | File(s) | Test |
|-------------|--------|---------|------|
| FR-001 | Domain: CompetitorId | `api/src/domain/competitor/competitor.ts` | `competitor.test.ts` |
| FR-001 | Domain: CompetitorName | `api/src/domain/competitor/competitor-name.ts` | `competitor-name.test.ts` |
| FR-001 | Domain: CompetitorSource | `api/src/domain/competitor/competitor-source.ts` | `competitor-source.test.ts` |
| FR-001 | Domain: Competitor | `api/src/domain/competitor/competitor.ts` | `competitor.test.ts` |
| FR-004 | Infra: PrismaCompetitorRepo | `api/src/infrastructure/repositories/prisma-competitor-repository.ts` | - |
| FR-004 | Infra: InMemoryCompetitorRepo | `api/src/infrastructure/repositories/in-memory-competitor-repository.ts` | - |
| FR-003 | UseCase: Create | `api/src/usecase/competitor/create-competitor.ts` | `create-competitor.test.ts` |
| FR-003 | UseCase: Get | `api/src/usecase/competitor/get-competitor.ts` | `get-competitor.test.ts` |
| FR-003 | UseCase: ListByStore | `api/src/usecase/competitor/list-competitors-by-store.ts` | `list-competitors-by-store.test.ts` |
| FR-003 | UseCase: Update | `api/src/usecase/competitor/update-competitor.ts` | `update-competitor.test.ts` |
| FR-003 | UseCase: Delete | `api/src/usecase/competitor/delete-competitor.ts` | `delete-competitor.test.ts` |
| FR-002 | Presentation: Controller | `api/src/presentation/controllers/competitor-controller.ts` | - |
| FR-002 | Presentation: Routes | `api/src/presentation/routes/competitors.ts` | - |
| FR-002 | Presentation: Schemas | `api/src/presentation/schemas/competitor-schemas.ts` | - |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | @claude | Initial spec (retroactive documentation of existing implementation) |
