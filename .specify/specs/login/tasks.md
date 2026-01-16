# Tasks: ログイン機能

## Prerequisites

- [ ] Task 0: OpenAPI 仕様を定義 (`docs/02_architecture/api/auth.yaml`)
- [ ] Task 1: 依存パッケージを追加 (bcrypt, jsonwebtoken, zod, express-rate-limit)
- [ ] Task 2: 環境変数を設定 (JWT_SECRET, JWT_EXPIRES_IN, etc.)

## Implementation Tasks

### Phase 1: Database & Shared Types

- [ ] Task 3: Database migration - users table 作成
- [ ] Task 4: Database migration - refresh_tokens table 作成
- [ ] Task 5: Database migration - password_reset_tokens table 作成
- [ ] Task 6: 認証関連の型定義 (`projects/packages/shared/src/auth.types.ts`)
- [ ] Task 7: バリデーションスキーマ (`projects/packages/shared/src/auth.validators.ts`)

### Phase 2: Core Services

- [ ] Task 8: Password service 実装 (hash, verify)
- [ ] Task 9: JWT service 実装 (sign, verify, decode)
- [ ] Task 10: Email service interface 定義
- [ ] Task 11: Rate limiter middleware 実装

### Phase 3: Auth Feature

- [ ] Task 12: User repository 実装 (CRUD operations)
- [ ] Task 13: RefreshToken repository 実装
- [ ] Task 14: PasswordResetToken repository 実装
- [ ] Task 15: Auth service 実装 (register, login, logout, refresh)
- [ ] Task 16: Auth controller 実装
- [ ] Task 17: Auth middleware 実装 (JWT 検証)
- [ ] Task 18: Auth routes 登録

### Phase 4: Password Reset

- [ ] Task 19: Forgot password service 実装
- [ ] Task 20: Reset password service 実装
- [ ] Task 21: Password reset endpoints 追加

## Testing Tasks

- [ ] Task 22: Password service unit tests
- [ ] Task 23: JWT service unit tests
- [ ] Task 24: Auth service unit tests
- [ ] Task 25: Auth controller integration tests
- [ ] Task 26: Rate limiter tests
- [ ] Task 27: E2E tests (full auth flow)

## Documentation Tasks

- [ ] Task 28: API ドキュメント更新 (OpenAPI)
- [ ] Task 29: README に認証フローの説明を追加

## Completion Criteria

- [ ] すべてのユニットテストが pass
- [ ] すべてのインテグレーションテストが pass
- [ ] `./tools/contract lint` が pass
- [ ] `./tools/contract typecheck` が pass
- [ ] `./tools/contract build` が pass
- [ ] OpenAPI 仕様と実装が一致
