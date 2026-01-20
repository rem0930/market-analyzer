# Spec: Unified Error Handling

## Metadata

- **ID**: unified-error-handling
- **Status**: Draft
- **Created**: 2026-01-20
- **Updated**: 2026-01-20

---

## Parent Documents

| Document | Path | Reference |
|----------|------|-----------|
| PRD | `docs/01_product/prd.md` | Developer Experience |
| Identity | `docs/01_product/identity.md` | 信頼性・一貫性 |
| Related ADR | TBD: `docs/02_architecture/adr/0007_unified_error_handling.md` | Unified Error Handling |
| Related Spec | `.specify/specs/error-log-troubleshoot/spec.md` | Error Logging |

---

## Overview

REST API のエラーレスポンス形式を全エンドポイントで統一し、フロントエンドが `code` ベースで安定してハンドリングできるようにする。OpenAPI を単一の真実として、エラースキーマを定義し、型生成まで一貫させる。`application/problem+json` 互換の拡張形式を採用する。

---

## Impact Analysis

### Affected Systems

- [x] Frontend: API クライアント（`shared/api/http.ts`）、Error Boundary（`app/error.tsx`）、Feature API 層
- [x] Backend: 全コントローラー、Router、ミドルウェア、Logger
- [ ] Database: スキーマ変更なし
- [x] API: 全エンドポイントのエラーレスポンス形式変更

### Breaking Changes

- [x] あり: エラーレスポンス形式が `{ code, message }` から `{ type, title, status, code, requestId, ... }` に変更

### Downstream Dependencies

| System | Impact | Migration Required |
|--------|--------|-------------------|
| api-contract | OpenAPI スキーマ追加、型再生成 | Yes |
| shared package | AppError クラス追加 | Yes |
| Frontend API client | エラーハンドリング更新 | Yes |

---

## Functional Requirements (FR)

### FR-001: 統一エラーレスポンス形式

全 API エンドポイントが `application/problem+json` 互換の統一形式でエラーを返す。

**必須フィールド:**
- `type`: string - エラー種別 URL（例: `"about:blank"` or 固定 URL）
- `title`: string - 大分類（例: `"Validation Error"`, `"Unauthorized"`）
- `status`: number - HTTP ステータスコード
- `code`: string - アプリ共通エラーコード（UI 分岐の主キー）
- `requestId`: string - リクエスト追跡用 ID

**任意フィールド:**
- `reason`: string - code の下位理由（列挙型）
- `messageKey`: string - i18n キー
- `messageParams`: object - i18n パラメータ
- `errors`: array - バリデーションエラー詳細（field 単位）

### FR-002: エラーコード体系

以下のエラーコードと HTTP ステータスの対応を標準とする。

| Code | Status | 用途 |
|------|--------|------|
| `VALIDATION_ERROR` | 400 | 入力検証エラー |
| `UNAUTHORIZED` | 401 | 認証エラー |
| `FORBIDDEN` | 403 | 権限エラー |
| `NOT_FOUND` | 404 | リソース未発見 |
| `CONFLICT` | 409 | リソース競合 |
| `RATE_LIMIT` | 429 | レート制限超過 |
| `EXTERNAL_SERVICE_ERROR` | 502 | 外部サービスエラー |
| `INTERNAL_ERROR` | 500 | 内部エラー（想定外） |

### FR-003: OpenAPI エラースキーマ定義

`docs/02_architecture/api/common.yaml` に以下を定義:

- `components/schemas/ErrorCode` - エラーコード列挙
- `components/schemas/ErrorReason` - エラー理由列挙
- `components/schemas/ApiError` - エラーレスポンス本体
- `components/schemas/ErrorItem` - バリデーションエラー詳細
- `components/responses/ErrorResponse` - 共通エラーレスポンス

### FR-004: AppError クラス実装

`@monorepo/shared` に `AppError` クラスを追加。

```typescript
class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly status: number,
    options?: {
      reason?: string;
      messageKey?: string;
      messageParams?: Record<string, unknown>;
      errors?: ErrorItem[];
      cause?: Error;
    }
  );
}
```

- 既存の `Result<T, E>` と統合可能
- `toApiError(requestId: string): ApiError` メソッドを提供

### FR-005: 共通エラーハンドラ

API ルーターレベルで共通エラーハンドラを実装。

- `AppError` → `ApiError` 形式に変換
- 想定外エラー → ログに詳細、クライアントには `INTERNAL_ERROR` のみ
- `requestId` をリクエストヘッダー `x-request-id` から取得、なければ生成
- レスポンスヘッダー `x-request-id` を必ず付与
- `Content-Type: application/problem+json` を設定

### FR-006: フロントエンド API クライアント更新

`@monorepo/api-contract` の `customFetch` を更新。

- 非 2xx レスポンスを `ApiError` として parse
- `AppError` に変換して throw
- `code` を必須フィールドとして扱う
- `errors[]` をフォームフィールドにマッピング可能に

### FR-007: バリデーションエラー詳細

`VALIDATION_ERROR` の場合、`errors[]` に詳細を含める。

```typescript
interface ErrorItem {
  field: string;      // フィールド名（例: "email"）
  code: string;       // フィールドエラーコード（例: "INVALID_FORMAT"）
  messageKey?: string; // i18n キー
}
```

---

## Non-Functional Requirements (NFR)

### NFR-001: Performance

- エラーハンドリングによるレイテンシ増加は 1ms 以下
- 想定外エラー時のスタックトレース取得は同期処理

### NFR-002: Security

- 想定外エラーの詳細（スタックトレース、内部パス）をクライアントに返さない
- エラーメッセージに PII を含めない
- `requestId` はログとレスポンスで突合可能にする

### NFR-003: Maintainability

- エラーコードは TypeScript の string literal union で型安全に管理
- OpenAPI から生成した型をフロントエンド/バックエンド両方で使用
- 新しいエラーコード追加時は OpenAPI → 型生成 → 実装の順

---

## Acceptance Criteria (AC)

### AC-001: 統一エラーレスポンス形式

**Given** API エンドポイントでエラーが発生する
**When** エラーレスポンスが返される
**Then** レスポンスボディに `type`, `title`, `status`, `code`, `requestId` が含まれる

### AC-002: requestId ヘッダー

**Given** API リクエストを送信する
**When** エラーまたは成功レスポンスが返される
**Then** レスポンスヘッダーに `x-request-id` が含まれる

### AC-003: Content-Type

**Given** API エンドポイントでエラーが発生する
**When** エラーレスポンスが返される
**Then** `Content-Type: application/problem+json` が設定される

### AC-004: 想定外エラーの隠蔽

**Given** API で未捕捉の例外が発生する
**When** エラーレスポンスが返される
**Then** クライアントには `INTERNAL_ERROR` のみ返り、詳細（スタックトレース等）は含まれない

### AC-005: バリデーションエラー詳細

**Given** リクエストボディのバリデーションが失敗する
**When** エラーレスポンスが返される
**Then** `code` が `VALIDATION_ERROR` で、`errors[]` にフィールド単位の詳細が含まれる

### AC-006: フロントエンド code ベースハンドリング

**Given** フロントエンドが API エラーを受信する
**When** エラーをハンドリングする
**Then** `error.code` で分岐でき、`VALIDATION_ERROR` の場合は `error.errors[]` にアクセスできる

### AC-007: requestId によるログ追跡

**Given** API でエラーが発生する
**When** サーバーログを確認する
**Then** レスポンスの `requestId` と同じ ID でログエントリを検索できる

### AC-008: OpenAPI 型生成

**Given** `pnpm openapi:generate` を実行する
**When** 生成が完了する
**Then** `ApiError`, `ErrorCode`, `ErrorItem` 型がフロントエンド/バックエンドで使用可能になる

---

## Out of Scope

- i18n メッセージの実装（messageKey は返すが、翻訳は別 Spec）
- リトライロジック（フロントエンド側の自動リトライ）
- エラー監視サービスへの連携（Sentry 等）
- GraphQL エラーハンドリング

---

## Assumptions

- 既存の `Result<T, E>` 型は維持し、`AppError` と併用する
- OpenAPI 3.0.3 形式を継続使用
- orval による型生成を継続使用
- DevContainer 環境で開発・テストを行う

---

## Code Map

| Requirement | Module | File(s) | Test |
|-------------|--------|---------|------|
| FR-001, FR-002 | shared | `projects/packages/shared/src/errors/app-error.ts` | `app-error.test.ts` |
| FR-003 | api-contract | `docs/02_architecture/api/common.yaml` | OpenAPI validation |
| FR-004 | shared | `projects/packages/shared/src/errors/error-codes.ts` | `error-codes.test.ts` |
| FR-005 | api | `projects/apps/api/src/presentation/middleware/error-handler.ts` | `error-handler.test.ts` |
| FR-006 | api-contract | `projects/packages/api-contract/src/http-client.ts` | `http-client.test.ts` |
| FR-007 | api | `projects/apps/api/src/presentation/middleware/validation-middleware.ts` | existing tests |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-20 | Claude | Initial spec |
