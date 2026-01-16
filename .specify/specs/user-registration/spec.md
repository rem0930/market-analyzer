# Spec: 新規登録 UI

## Overview

ログイン Spec (`.specify/specs/login/spec.md`) の FR-001 に対応するフロントエンド UI を実装する。
Backend API (`POST /auth/register`) は既に実装済みのため、フロントエンドのみを追加する。

## Parent Spec

- [login/spec.md](../../login/spec.md) - FR-001: ユーザー登録

## Scope

### In Scope

- 新規登録ページ (`/register`)
- 新規登録フォーム UI
- フォームバリデーション（クライアントサイド）
- ログインページへの導線
- 登録成功後のリダイレクト

### Out of Scope

- Backend API（実装済み）
- メール認証フロー
- ソーシャルログイン

## Functional Requirements (FR)

### FR-UI-001: 新規登録ページ

- `/register` パスでアクセス可能
- 認証済みユーザーはダッシュボードにリダイレクト
- (auth) layout を使用（ログインページと同じレイアウト）

### FR-UI-002: 新規登録フォーム

- 入力項目:
  - メールアドレス
  - パスワード
  - パスワード確認
- クライアントサイドバリデーション（既存の `registerSchema` を使用）
- サーバーエラーの表示
- 送信中の Loading 状態表示

### FR-UI-003: ナビゲーション

- 新規登録ページにログインへのリンク
- ログインページに新規登録へのリンク

## Acceptance Criteria (AC)

### AC-UI-001: 新規登録フォーム表示

**Given** 未認証ユーザー
**When** `/register` にアクセス
**Then** 新規登録フォームが表示される

### AC-UI-002: バリデーションエラー表示

**Given** 新規登録フォーム
**When** 無効な入力で送信
**Then** バリデーションエラーが表示される（パスワード不一致、形式エラー等）

### AC-UI-003: 登録成功

**Given** 有効な入力
**When** 新規登録フォームを送信
**Then** ユーザーが作成され、ログインページにリダイレクト（または自動ログイン）

### AC-UI-004: 重複メールエラー

**Given** 既に登録済みのメールアドレス
**When** 新規登録フォームを送信
**Then** 「このメールアドレスは既に登録されています」エラーが表示される

### AC-UI-005: ログインへのリンク

**Given** 新規登録ページ
**When** 「ログイン」リンクをクリック
**Then** `/login` に遷移する

## UI Components

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `RegisterPage` | `app/(auth)/register/page.tsx` | 新規登録ページ |
| `RegisterForm` | `features/auth/ui/RegisterForm.tsx` | 新規登録フォーム |
| `useRegister` | `features/auth/api/mutations.ts` | 登録 API mutation |
