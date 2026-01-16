# Plan: 新規登録 UI

## Implementation Strategy

既存の LoginForm/LoginPage パターンに従い、最小差分で実装する。

## Files to Create

| File | Purpose |
|------|---------|
| `projects/apps/web/src/app/(auth)/register/page.tsx` | 新規登録ページ |
| `projects/apps/web/src/features/auth/ui/RegisterForm.tsx` | 新規登録フォーム |

## Files to Modify

| File | Change |
|------|--------|
| `projects/apps/web/src/features/auth/api/mutations.ts` | `useRegister` mutation 追加 |
| `projects/apps/web/src/features/auth/index.ts` | `RegisterForm`, `useRegister` エクスポート追加 |
| `projects/apps/web/src/features/auth/ui/LoginForm.tsx` | 新規登録リンク追加 |

## Implementation Order

1. **API Layer**: `useRegister` mutation を追加
2. **UI Layer**: `RegisterForm` コンポーネント作成
3. **App Layer**: 新規登録ページ作成
4. **Navigation**: ログイン ↔ 登録のリンク追加
5. **Export**: index.ts 更新

## Component Design

### RegisterForm

```tsx
// 既存の LoginForm と同じパターン
// - react-hook-form + zod (registerSchema)
// - useRegister mutation
// - エラー表示
// - Loading 状態
```

### RegisterPage

```tsx
// 既存の LoginPage と同じパターン
// - (auth) layout 使用
// - RegisterForm をレンダリング
```

## Testing Strategy

| Level | What | How |
|-------|------|-----|
| Unit | RegisterForm | Vitest + Testing Library |
| Integration | Register flow | E2E (Playwright) |

## Dependencies

- 既存の `registerSchema` (`shared/lib/validation/auth.ts`)
- 既存の `FormField`, `Button` コンポーネント
- 既存の `(auth)` layout

## Rollback

- 新規ファイル削除
- index.ts の export 削除
- LoginForm のリンク削除
