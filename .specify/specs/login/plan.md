# Plan: ログイン機能

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│   Backend API   │────▶│   PostgreSQL    │
│   (Frontend)    │     │   (Express)     │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Email Service  │
                        │  (Interface)    │
                        └─────────────────┘
```

### 認証フロー

```
1. Registration:
   Client → POST /api/auth/register → Hash password → Store user → 201

2. Login:
   Client → POST /api/auth/login → Verify password → Issue JWT → 200

3. Token Refresh:
   Client → POST /api/auth/refresh → Verify refresh token → Issue new tokens → 200

4. Logout:
   Client → POST /api/auth/logout → Invalidate refresh token → 204

5. Password Reset:
   Client → POST /api/auth/forgot-password → Generate token → Send email → 200
   Client → POST /api/auth/reset-password → Verify token → Update password → 200
```

## Components

### Backend (`projects/apps/api`)

| Component | Responsibility |
|-----------|----------------|
| `auth.controller.ts` | HTTP リクエストハンドリング |
| `auth.service.ts` | 認証ビジネスロジック |
| `auth.repository.ts` | ユーザーデータアクセス |
| `jwt.service.ts` | JWT 生成・検証 |
| `password.service.ts` | パスワードハッシュ・検証 |
| `email.service.ts` | メール送信インターフェース |
| `rate-limiter.middleware.ts` | レートリミット |
| `auth.middleware.ts` | JWT 認証ミドルウェア |

### Shared (`projects/packages/shared`)

| Component | Responsibility |
|-----------|----------------|
| `auth.types.ts` | 認証関連の型定義 |
| `auth.validators.ts` | バリデーションスキーマ |

### Database Schema

```sql
-- users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- refresh_tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- password_reset_tokens table
CREATE TABLE password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints (OpenAPI)

`docs/02_architecture/api/auth.yaml` に定義（Skill.OpenAPI_Contract_First に従う）

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | ユーザー登録 |
| POST | `/api/auth/login` | ログイン |
| POST | `/api/auth/logout` | ログアウト |
| POST | `/api/auth/refresh` | トークンリフレッシュ |
| POST | `/api/auth/forgot-password` | パスワードリセット要求 |
| POST | `/api/auth/reset-password` | パスワードリセット実行 |

## Dependencies

### npm packages

| Package | Purpose |
|---------|---------|
| `bcrypt` | パスワードハッシュ |
| `jsonwebtoken` | JWT 生成・検証 |
| `zod` | バリデーション |
| `express-rate-limit` | レートリミット |

### Infrastructure

- PostgreSQL database
- Email service (SMTP or API)

## Data Flow

### Login Flow

```
1. Client sends POST /api/auth/login { email, password }
2. Controller validates request body (zod)
3. Service retrieves user by email
4. Service verifies password with bcrypt
5. Service generates access token (15min) and refresh token (7d)
6. Service stores refresh token hash in DB
7. Controller returns tokens to client
8. Client stores access token in memory, refresh token in httpOnly cookie
```

### Token Refresh Flow

```
1. Client sends POST /api/auth/refresh with refresh token cookie
2. Controller extracts refresh token
3. Service verifies token signature and expiry
4. Service checks token hash exists in DB
5. Service generates new token pair
6. Service rotates refresh token (delete old, store new)
7. Controller returns new tokens
```

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| JWT secret 漏洩 | 全セッション偽装可能 | RS256 (公開鍵/秘密鍵)、定期ローテーション |
| ブルートフォース攻撃 | アカウント乗っ取り | レートリミット、アカウントロック |
| リフレッシュトークン盗難 | 長期セッション乗っ取り | httpOnly cookie、トークンローテーション |
| SQL インジェクション | データ漏洩 | Parameterized queries (ORM 使用) |

## Rollback Strategy

1. **Feature flag**: 認証エンドポイントを feature flag で制御
2. **Database migration**: down migration を用意
3. **API versioning**: `/api/v1/auth/*` でバージョニング

## Testing Strategy

| Level | Target | Tool |
|-------|--------|------|
| Unit | Service logic | vitest |
| Integration | API endpoints | supertest |
| E2E | Full auth flow | Playwright |
