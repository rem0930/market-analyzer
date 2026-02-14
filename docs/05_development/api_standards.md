# API Standards

## Overview

本リポジトリの HTTP API に適用される命名規約、エラースキーマ、設計パターンを定義します。

---

## 命名規約

### operationId (camelCase)

```yaml
# Good
operationId: createUser
operationId: getUserById
operationId: updateUserName
operationId: deleteRefreshToken

# Bad
operationId: create_user        # snake_case は不可
operationId: CreateUser          # PascalCase は不可
operationId: create-user         # kebab-case は不可
```

### Path (kebab-case)

```yaml
# Good
/auth/forgot-password
/auth/reset-password
/users/me/name

# Bad
/auth/forgotPassword             # camelCase は不可
/auth/forgot_password            # snake_case は不可
```

### Schema 名 (PascalCase)

```yaml
# Good
CreateUserRequest
TokenResponse
AuthUser
ErrorResponse

# Bad
createUserRequest                # camelCase は不可
create_user_request              # snake_case は不可
```

### Property 名 (camelCase)

```yaml
# Good
properties:
  accessToken: ...
  refreshToken: ...
  createdAt: ...
  userId: ...

# Bad
properties:
  access_token: ...              # snake_case は不可
  AccessToken: ...               # PascalCase は不可
```

---

## エラースキーマ

### 基本エラーレスポンス

`projects/packages/api-contract/openapi.yaml` で定義:

```yaml
ErrorResponse:
  type: object
  required:
    - code
    - message
  properties:
    code:
      type: string
    message:
      type: string
    details:
      type: array
      items:
        type: object
```

### RFC 7807 拡張 (将来対応)

`docs/02_architecture/api/common.yaml` に RFC 7807 準拠の `ApiError` スキーマが定義されています。
新規 API は段階的にこちらへ移行予定:

```yaml
ApiError:
  type: object
  required: [type, title, status, code, requestId]
  properties:
    type:
      type: string
      format: uri
    title:
      type: string
    status:
      type: integer
    code:
      $ref: '#/components/schemas/ErrorCode'
    requestId:
      type: string
      format: uuid
```

### エラーコード体系

| ErrorCode | HTTP Status | 用途 |
|-----------|-------------|------|
| `VALIDATION_ERROR` | 400 | 入力バリデーション失敗 |
| `UNAUTHORIZED` | 401 | 認証エラー |
| `FORBIDDEN` | 403 | 認可エラー |
| `NOT_FOUND` | 404 | リソース未発見 |
| `CONFLICT` | 409 | 重複・競合 |
| `RATE_LIMIT` | 429 | レート制限 |
| `EXTERNAL_SERVICE_ERROR` | 502 | 外部サービス障害 |
| `INTERNAL_ERROR` | 500 | 内部エラー |

---

## パス構造

### RESTful パターン

```text
GET    /resources           → リスト取得
POST   /resources           → 作成
GET    /resources/{id}      → 単一取得
PATCH  /resources/{id}      → 部分更新
DELETE /resources/{id}      → 削除
```

### 認証関連

```text
POST   /auth/register       → ユーザー登録
POST   /auth/login          → ログイン
POST   /auth/logout         → ログアウト
POST   /auth/refresh        → トークンリフレッシュ
POST   /auth/forgot-password → パスワードリセット要求
POST   /auth/reset-password  → パスワードリセット実行
GET    /auth/me             → 認証ユーザー情報
```

### ユーザー操作

```text
PATCH  /users/me/name       → 自分の名前変更
PATCH  /users/me/password   → 自分のパスワード変更
```

---

## 共通スキーマ

### Pagination

```yaml
PaginatedResponse:
  type: object
  required:
    - items
    - total
    - page
    - pageSize
  properties:
    items:
      type: array
    total:
      type: integer
      minimum: 0
    page:
      type: integer
      minimum: 1
    pageSize:
      type: integer
      minimum: 1
      maximum: 100
```

### Timestamps

すべてのエンティティスキーマに含める:

```yaml
properties:
  createdAt:
    type: string
    format: date-time
  updatedAt:
    type: string
    format: date-time
```

---

## セキュリティ

### BearerAuth デフォルト

```yaml
security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

### 公開エンドポイント

認証不要のエンドポイントには明示的に空の security を指定:

```yaml
paths:
  /auth/login:
    post:
      security: []   # 認証不要を明示
```

### レスポンスヘッダ

すべてのレスポンスに `x-request-id` ヘッダを含める:

```yaml
headers:
  x-request-id:
    description: リクエスト追跡用の一意な ID
    schema:
      type: string
      format: uuid
```

---

## See Also

- OpenAPI ワークフロー: `docs/05_development/openapi_workflow.md`
- 共通スキーマ定義: `docs/02_architecture/api/common.yaml`
- 統合 OpenAPI: `projects/packages/api-contract/openapi.yaml`
