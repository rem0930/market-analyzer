# TDD Workflow

## Overview

本リポジトリでは **DocDD + TDD** を組み合わせて開発します。
Spec の Acceptance Criteria (AC) をテストに変換し、Red-Green-Refactor サイクルで実装します。

---

## DocDD ステージとの対応

```text
DocDD Stage              TDD Phase
─────────────────────────────────────
Stage 1: Spec 作成       → AC を定義
Stage 2: Plan 作成       → テスト戦略を計画
Stage 3: Tasks 分解      → テストタスクを明確化
Stage 4: Contract(RED)   → AC → テストコード（失敗する）
Stage 5: Review          → テスト設計レビュー
Stage 6: Implement(GREEN)→ テストを通す最小限の実装
Stage 7: Refactor        → テストを維持しつつリファクタ
Stage 8: Quality Gates   → カバレッジ + CI 通過
```

---

## Red-Green-Refactor サイクル

### RED: テストを先に書く

```typescript
// AC-001: ログイン成功時にトークンが返る
describe('LoginUseCase', () => {
  it('should return tokens on successful login', async () => {
    // Arrange: モックを設定
    // Act: useCase.execute(validInput)
    // Assert: result.isSuccess() === true
  });
});
```

**この時点でテストは FAIL する。これが正しい状態。**

### GREEN: テストを通す最小限の実装

- テストが通る最小限のコードだけを書く
- 完璧なコードを目指さない
- ハードコードでも OK（後でリファクタする）

### REFACTOR: テストを維持しつつ改善

- テストが全て GREEN のまま
- 重複を排除
- 命名を改善
- パターンを適用

---

## AC → テスト マッピング

Spec の AC は直接テストケースに変換できます:

```markdown
### AC-001: ログイン成功
**Given** 有効なメールアドレスとパスワード
**When** ログイン API を呼ぶ
**Then** アクセストークンとリフレッシュトークンが返る
```

↓

```typescript
describe('AC-001: ログイン成功', () => {
  it('should return access and refresh tokens with valid credentials', async () => {
    // Given
    const input = validLoginInput();
    setupSuccessfulLoginMocks();

    // When
    const result = await useCase.execute(input);

    // Then
    expect(result).toBeSuccess();
    expect(result.value.accessToken).toBeDefined();
    expect(result.value.refreshToken).toBeDefined();
  });
});
```

---

## レイヤー別テスト戦略

### Domain Layer: モックなし

ドメイン層は純粋なビジネスロジックのため、モック不要:

```typescript
describe('Email', () => {
  it('should create valid email', () => {
    const email = Email.create('user@example.com');
    expect(email.value).toBe('user@example.com');
  });

  it('should reject invalid email', () => {
    expect(() => Email.create('invalid')).toThrow();
  });
});
```

### UseCase Layer: Repository をモック

ユースケース層はドメインインターフェースをモックして単体テスト:

```typescript
import { createMockAuthUserRepository } from '../__tests__/helpers/mock-builders.js';
import { createTestAuthUser, validLoginInput } from '../__tests__/fixtures/auth-fixtures.js';

describe('LoginUseCase', () => {
  const mockRepo = createMockAuthUserRepository();

  it('should login successfully', async () => {
    const user = createTestAuthUser();
    vi.mocked(mockRepo.findByEmail).mockResolvedValue(Result.ok(user));
    // ...
  });
});
```

### Presentation Layer: UseCase をモック

プレゼンテーション層はユースケースをモックして HTTP レベルのテスト:

```typescript
describe('POST /auth/login', () => {
  it('should return 200 with tokens', async () => {
    mockLoginUseCase.execute.mockResolvedValue(Result.ok(tokenResponse));

    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'user@example.com', password: 'pass' });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
  });
});
```

---

## テストユーティリティ

### カスタムマッチャー

`projects/apps/api/src/__tests__/matchers/result-matchers.ts`:

```typescript
expect(result).toBeSuccess();           // result.isSuccess() === true
expect(result).toBeFailure();           // result.isFailure() === true
expect(result).toBeFailureWithError('invalid_credentials');
```

### モックビルダー

`projects/apps/api/src/__tests__/helpers/mock-builders.ts`:

```typescript
const repo = createMockAuthUserRepository();
const passwordService = createMockPasswordService();
const jwtService = createMockJwtService();
```

### フィクスチャ

`projects/apps/api/src/__tests__/fixtures/auth-fixtures.ts`:

```typescript
const user = createTestAuthUser({ email: 'custom@example.com' });
const tokens = createTestTokenPair({ accessTokenExpiresIn: 1800 });
const input = validLoginInput({ password: 'CustomPass123' });
```

---

## カバレッジ要件

| Metric | Threshold |
|--------|-----------|
| Lines | 80% |
| Functions | 80% |
| Branches | 80% |
| Statements | 80% |

```bash
# カバレッジ付きでテスト実行
./tools/contract test -- --coverage
```

設定: `projects/apps/api/vitest.config.ts`

---

## テスト命名規約

```typescript
// ファイル名: 実装ファイルと同階層に .test.ts
// login.ts → login.test.ts

// describe: テスト対象のクラス/関数名
describe('LoginUseCase', () => {

  // ネストされた describe: テスト対象のシナリオ
  describe('successful login', () => {

    // it: 期待される振る舞い（should で始める）
    it('should return tokens on valid credentials', () => {});
  });

  describe('validation errors', () => {
    it('should fail with invalid email format', () => {});
  });
});
```

---

## See Also

- TDD スキル: `.claude/skills/tdd-workflow/SKILL.md`
- テスト品質基準: `docs/03_quality/`
- Vitest 設定: `projects/apps/api/vitest.config.ts`
- Spec テンプレート: `.specify/templates/spec.md`
- API Spec テンプレート: `.specify/templates/spec-api.md`
