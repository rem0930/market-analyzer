# Profile Edit Feature Specification

## Overview

ユーザーが自分のプロフィール情報を編集できる機能を提供する。

## User Stories

### US-1: Name Change

> As a logged-in user,
> I want to change my display name,
> So that my profile reflects my preferred name.

**Acceptance Criteria:**

- [ ] AC-1.1: 認証済みユーザーのみがアクセス可能
- [ ] AC-1.2: 名前は1〜100文字の範囲で入力可能
- [ ] AC-1.3: 変更成功時に成功メッセージを表示
- [ ] AC-1.4: 変更はDBに永続化される

### US-2: Password Change

> As a logged-in user,
> I want to change my password,
> So that I can keep my account secure.

**Acceptance Criteria:**

- [ ] AC-2.1: 認証済みユーザーのみがアクセス可能
- [ ] AC-2.2: 現在のパスワードの入力が必須
- [ ] AC-2.3: 新しいパスワードは8文字以上、英数字を含む
- [ ] AC-2.4: 新しいパスワードと確認用パスワードが一致する必要がある
- [ ] AC-2.5: 現在のパスワードが正しくない場合はエラーを表示
- [ ] AC-2.6: 変更成功時に成功メッセージを表示

## Technical Constraints

1. **Authentication**: JWT Bearer token required
2. **Password Hashing**: bcrypt with cost factor 12
3. **Validation**: Zod schemas for input validation
4. **Architecture**: Clean Architecture + DDD patterns

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| PATCH | /users/me/name | Update current user's name |
| PATCH | /users/me/password | Update current user's password |

## Security Considerations

- Current password verification required for password change
- Rate limiting on password change endpoint
- No password in logs
