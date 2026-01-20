# Plan: Unified Error Handling

## Metadata

- **Spec**: `.specify/specs/unified-error-handling/spec.md`
- **Status**: Implemented
- **Created**: 2026-01-20
- **Updated**: 2026-01-20

---

## Overview

REST API のエラーレスポンスを `application/problem+json` 互換の統一形式に変更する。OpenAPI でエラースキーマを定義し、orval で型生成、バックエンド/フロントエンド両方で一貫したエラーハンドリングを実現する。

---

## Architecture Decision

### 採用するアプローチ

**OpenAPI Contract-First + 集中型エラーハンドラ**

1. OpenAPI にエラースキーマを定義（単一の真実）
2. `@monorepo/shared` に `AppError` クラスを追加
3. 共通エラーハンドラミドルウェアで `AppError` → `ApiError` 変換
4. フロントエンドの API クライアントを更新

### 検討した代替案

| 案 | 概要 | メリット | デメリット | 採用 |
|----|------|----------|------------|------|
| A: 集中型ハンドラ | ルーターレベルで一括変換 | 一貫性、DRY | 既存コード変更大 | ✅ |
| B: 個別対応 | 各コントローラーで対応 | 変更小 | 一貫性担保困難、重複 | ❌ |
| C: HTTP フレームワーク導入 | Hono/Express 導入 | 機能豊富 | 大規模変更、学習コスト | ❌ |

### 決定理由

- 既存の Node.js native HTTP サーバーを維持しつつ、最小限の変更で統一を実現
- OpenAPI Contract-First で型安全性を確保
- 将来のフレームワーク導入時にも移植可能

---

## Technical Design

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  Request → Router → Controller → UseCase → Domain               │
│                                                                  │
│  ┌─────────────────┐    ┌──────────────────┐                   │
│  │ error-handler.ts│◄───│ AppError thrown  │                   │
│  └────────┬────────┘    └──────────────────┘                   │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ApiError Response                                        │   │
│  │ {                                                        │   │
│  │   type: "about:blank",                                   │   │
│  │   title: "Validation Error",                             │   │
│  │   status: 400,                                           │   │
│  │   code: "VALIDATION_ERROR",                              │   │
│  │   requestId: "uuid-...",                                 │   │
│  │   errors: [{ field: "email", code: "INVALID_FORMAT" }]   │   │
│  │ }                                                        │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model

```typescript
// ErrorCode (OpenAPI enum → TypeScript union)
type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_ERROR';

// ApiError (OpenAPI schema → TypeScript interface)
interface ApiError {
  type: string;
  title: string;
  status: number;
  code: ErrorCode;
  requestId: string;
  reason?: string;
  messageKey?: string;
  messageParams?: Record<string, unknown>;
  errors?: ErrorItem[];
}

// ErrorItem (validation details)
interface ErrorItem {
  field: string;
  code: string;
  messageKey?: string;
}
```

### API Design

- OpenAPI: `docs/02_architecture/api/common.yaml` (新規)
- 既存仕様: `docs/02_architecture/api/profile.yaml`, `docs/02_architecture/api/deep-ping.yaml`

---

## Implementation Strategy

### Phase 1: Contract Definition (OpenAPI + Types) ✅

**目的**: エラースキーマを OpenAPI で定義し、型を生成

**成果物**:
- [x] `docs/02_architecture/api/common.yaml` - エラースキーマ定義
- [x] 型は `@monorepo/shared` で手動定義（OpenAPI と同期）

### Phase 2: Shared Error Infrastructure ✅

**目的**: `@monorepo/shared` にエラー基盤を追加

**成果物**:
- [x] `projects/packages/shared/src/errors/error-codes.ts` - ErrorCode 定義
- [x] `projects/packages/shared/src/errors/app-error.ts` - AppError クラス
- [x] `projects/packages/shared/src/errors/index.ts` - エクスポート

### Phase 3: Backend Error Handler ✅

**目的**: API で統一エラーハンドリングを実装

**成果物**:
- [x] `projects/apps/api/src/presentation/middleware/error-handler.ts` - 共通ハンドラ
- [x] `projects/apps/api/src/presentation/middleware/request-id-middleware.ts` - requestId 生成/伝播
- [x] Router の更新（withErrorHandler + x-request-id ヘッダー）

### Phase 4: Controller Migration ✅

**目的**: 既存コントローラーを新形式に移行

**成果物**:
- [x] `auth-controller.ts` - AppError を使用
- [x] `profile-controller.ts` - AppError を使用
- [x] `user-controller.ts` - AppError を使用
- [x] 認証エラーを mapAuthErrorToAppError() で変換

### Phase 5: Frontend API Client ✅

**目的**: フロントエンドで統一エラーハンドリング

**成果物**:
- [x] `projects/packages/api-contract/src/http-client.ts` - RFC 7807 互換 ApiError 対応
- [x] `projects/apps/web/src/app/error.tsx` - 開発環境のみコンソール出力

### Phase 6: Tests & Documentation ✅

**目的**: テストとドキュメントの整備

**成果物**:
- [x] `projects/packages/shared/src/errors/app-error.test.ts` - AppError のユニットテスト（25 tests）
- [x] 本ドキュメント更新

---

## Test Strategy

### Unit Tests

| Component | Test Focus | Coverage Target |
|-----------|------------|-----------------|
| AppError | constructor, toApiError() | 100% |
| error-handler | AppError → ApiError 変換, 想定外エラー隠蔽 | 100% |
| request-id | 生成, ヘッダー伝播 | 100% |

### Integration Tests

| Scenario | Systems Involved | Test Method |
|----------|------------------|-------------|
| 400 Validation Error | Router → Controller → Handler | HTTP request test |
| 401 Unauthorized | Auth Middleware → Handler | HTTP request test |
| 500 Internal Error | Any → Handler | Throw non-AppError |

### E2E Tests

| User Flow | Priority | Automated |
|-----------|----------|-----------|
| Login with invalid credentials | High | Yes (existing) |
| Register with existing email | High | Yes (existing) |
| Access protected route without auth | High | Yes (existing) |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| 既存テストの破損 | Medium | Medium | フェーズごとにテスト実行 |
| フロントエンドの型不整合 | Medium | High | orval 再生成 + 型チェック |
| パフォーマンス劣化 | Low | Medium | ベンチマーク実施 |

---

## Dependencies

### External Dependencies

| Dependency | Version | Purpose | Risk |
|------------|---------|---------|------|
| orval | ^8.0.2 | OpenAPI 型生成 | Low |
| uuid | - | requestId 生成（node:crypto で代替可） | Low |

### Internal Dependencies

| Component | Owner | Status |
|-----------|-------|--------|
| @monorepo/shared | shared | Ready |
| @monorepo/api-contract | api-contract | Ready |
| api presentation layer | api | Ready |

---

## Rollback Plan

### Rollback Trigger

- 本番デプロイ後にエラーレスポンスが機能しない
- フロントエンドがエラーを正しく解釈できない

### Rollback Steps

1. 前のコミットに revert
2. `pnpm openapi:generate` で型を再生成
3. デプロイ

### Data Migration Rollback

データマイグレーションなし。

---

## Related Documents

- Spec: `.specify/specs/unified-error-handling/spec.md`
- Related Spec: `.specify/specs/error-log-troubleshoot/spec.md`
- ADR: `docs/02_architecture/adr/0007_unified_error_handling.md` (TBD)

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-20 | Claude | Initial plan |
| 1.1 | 2026-01-20 | Claude | Implementation complete - all 6 phases done |
