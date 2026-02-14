---
name: tdd-workflow
description: Test-Driven Development workflow integrated with DocDD. Apply when writing tests, implementing features with TDD, or reviewing test coverage. Triggers on "test", "TDD", "red-green-refactor", "coverage", "AC", "acceptance criteria".
globs:
  - "projects/**/*.test.ts"
  - "projects/**/__tests__/**"
  - "projects/apps/api/vitest.config.ts"
  - "projects/apps/api/vitest.setup.ts"
alwaysApply: false
---

# TDD Workflow

Test-Driven Development integrated with DocDD for this repository.

## Red-Green-Refactor Cycle

```
1. RED    → AC からテストを書く（FAIL する）
2. GREEN  → テストを通す最小限の実装
3. REFACTOR → テスト GREEN を維持しつつ改善
```

**Rule**: テストなしで実装コードを書かない。

## AC → Test Mapping

Spec の Acceptance Criteria を直接テストに変換:

```typescript
// AC-001: ログイン成功時にトークンが返る
describe('AC-001: ログイン成功', () => {
  it('should return tokens with valid credentials', async () => {
    // Given: 有効なメールアドレスとパスワード
    const input = validLoginInput();
    // When: ログインを実行
    const result = await useCase.execute(input);
    // Then: トークンが返る
    expect(result).toBeSuccess();
  });
});
```

## Layer-Specific Strategy

| Layer | Mock Strategy | Example |
|-------|--------------|---------|
| Domain | No mocks | `Email.create('test@example.com')` |
| UseCase | Mock repositories/services | `createMockAuthUserRepository()` |
| Presentation | Mock use cases | `mockLoginUseCase.execute.mockResolvedValue(...)` |

## Test Utilities

### Custom Matchers

```typescript
expect(result).toBeSuccess();
expect(result).toBeFailure();
expect(result).toBeFailureWithError('invalid_credentials');
```

Location: `projects/apps/api/src/__tests__/matchers/result-matchers.ts`

### Mock Builders

```typescript
import { createMockAuthUserRepository } from '../__tests__/helpers/mock-builders.js';
```

Location: `projects/apps/api/src/__tests__/helpers/mock-builders.ts`

### Fixtures

```typescript
import { createTestAuthUser, validLoginInput } from '../__tests__/fixtures/auth-fixtures.js';
```

Location: `projects/apps/api/src/__tests__/fixtures/auth-fixtures.ts`

## Coverage Requirements

All metrics at **80% threshold**: lines, functions, branches, statements.

```bash
./tools/contract test -- --coverage
```

Config: `projects/apps/api/vitest.config.ts`

## Test File Conventions

- Co-locate with source: `login.ts` → `login.test.ts`
- Use nested `describe` for scenarios
- Use `it('should ...')` format
- Follow Arrange-Act-Assert pattern

## See Also

- Full workflow doc: `docs/05_development/tdd_workflow.md`
- Vitest config: `projects/apps/api/vitest.config.ts`
- Quality gates: `.claude/skills/quality-gates/SKILL.md`
