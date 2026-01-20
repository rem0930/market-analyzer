# Spec: Modular API Router

## Metadata

- **ID**: modular-router
- **Status**: Draft
- **Created**: 2026-01-20
- **Updated**: 2026-01-20

---

## Parent Documents

| Document | Path | Reference |
|----------|------|-----------|
| AGENTS.md | `AGENTS.md` | Non-negotiables, Clean Architecture |
| Backend Rules | `.claude/rules/02-backend.md` | presentation layer rules |
| Related Spec | `.specify/specs/login/spec.md` | Auth routes reference |

---

## Overview

APIルーターをパス階層ごとにモジュール分割し、ルート登録時に認証・エラーハンドリングを自動的にラップする仕組みを導入する。これにより、`router.ts` の肥大化を防ぎ、一貫したエラー処理と認証適用を保証する。

---

## Impact Analysis

### Affected Systems

- [ ] Frontend: 影響なし（API契約は変更なし）
- [x] Backend: `src/presentation/router.ts` を分割、新規ファイル追加
- [ ] Database: 変更なし
- [ ] API: エンドポイント変更なし（内部リファクタリングのみ）

### Breaking Changes

- [x] なし（既存APIの動作は完全に保持）

### Downstream Dependencies

| System | Impact | Migration Required |
|--------|--------|-------------------|
| Web Frontend | なし | No |
| Tests | ルーターテストの追加 | No |

---

## Functional Requirements (FR)

### FR-001: Route Module Split by Path Hierarchy

パスの1階層目ごとにルートファイルを分割する。

- `/auth/*` → `routes/auth.ts`
- `/users/*` → `routes/users.ts`
- `/health`, `/ping/*` → `routes/health.ts`
- `/` (root) → `routes/root.ts`

### FR-002: Route Factory with Middleware Wrapping

ルート登録時にミドルウェアを自動適用するファクトリ関数を提供する。

```typescript
// Example usage
const authRoutes = createRouteGroup({
  prefix: '/auth',
  middleware: [rateLimitMiddleware],
  routes: [
    route('POST', '/register', authController.register),
    route('POST', '/login', authController.login),
    route('POST', '/logout', authController.logout, { auth: true }),
  ],
});
```

### FR-003: Automatic Error Handling Wrapper

すべてのルートハンドラをtry-catchでラップし、一貫したエラーレスポンスを返す。

- 未処理例外 → 500 Internal Server Error
- ドメインエラー → 適切なHTTPステータスコード
- エラーログ出力（構造化ログ）

### FR-004: Authentication Middleware Integration

`{ auth: true }` オプションを指定したルートは自動的に認証ミドルウェアを適用する。

- 認証成功時: `userId` をハンドラに渡す
- 認証失敗時: 401 Unauthorized を返す

### FR-005: Type-Safe Route Registration

TypeScriptの型システムを活用し、ルート登録時に型エラーを検出する。

---

## Non-Functional Requirements (NFR)

### NFR-001: Performance

- ルーティング処理のオーバーヘッド < 1ms
- 既存のパフォーマンス特性を維持

### NFR-002: Maintainability

- 新規ルート追加時のコード量削減（ボイラープレート50%以上削減）
- 各ルートファイルは100行以下を目標

### NFR-003: Testability

- 各ルートモジュールを独立してテスト可能
- ミドルウェアのモック注入が容易

---

## Acceptance Criteria (AC)

### AC-001: Route Split Works Correctly

**Given** 分割されたルートファイルが存在する
**When** 既存のすべてのAPIエンドポイントにリクエストを送信
**Then** 分割前と同じレスポンスが返る

### AC-002: Auth Wrapper Applies Correctly

**Given** `auth: true` オプションで登録されたルート
**When** 認証トークンなしでアクセス
**Then** 401 Unauthorized が返る

### AC-003: Error Handling Is Consistent

**Given** ルートハンドラで例外がスローされる
**When** APIリクエストを送信
**Then** `{ code: string, message: string }` 形式のエラーレスポンスが返る

### AC-004: Rate Limiting Still Works

**Given** レート制限が設定されたルート（/auth/login等）
**When** 制限を超えるリクエストを送信
**Then** 429 Too Many Requests が返る

### AC-005: Quality Gates Pass

**Given** すべての変更が完了
**When** `./tools/contract lint && ./tools/contract typecheck && ./tools/contract test` を実行
**Then** すべてパスする

---

## Out of Scope

- APIエンドポイントの変更・追加
- 新しいミドルウェアの追加
- データベーススキーマの変更
- フロントエンドの変更

---

## Assumptions

- 既存のミドルウェア（auth, csrf, cors, rate-limit, security）は変更しない
- Node.js標準HTTPモジュールを継続使用（Expressへの移行はスコープ外）
- すべての開発コマンドはDevContainer内で実行

---

## Code Map

| Requirement | Module | File(s) | Test |
|-------------|--------|---------|------|
| FR-001 | routes | `src/presentation/routes/auth.ts` | `routes/auth.test.ts` |
| FR-001 | routes | `src/presentation/routes/users.ts` | `routes/users.test.ts` |
| FR-001 | routes | `src/presentation/routes/health.ts` | `routes/health.test.ts` |
| FR-002 | route-factory | `src/presentation/route-factory.ts` | `route-factory.test.ts` |
| FR-003 | error-handler | `src/presentation/middleware/error-handler.ts` | `error-handler.test.ts` |
| FR-004 | route-factory | `src/presentation/route-factory.ts` | `route-factory.test.ts` |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-20 | Claude | Initial spec |
