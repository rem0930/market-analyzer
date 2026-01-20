# Plan: [機能名]

## Metadata

- **Spec**: `.specify/specs/[id]/spec.md`
- **Status**: Draft | Approved | In Progress | Completed
- **Created**: YYYY-MM-DD
- **Updated**: YYYY-MM-DD

---

## Overview

[この Plan の概要。Spec で定義された要件をどのように実現するかの方針を説明]

---

## Architecture Decision

### 採用するアプローチ

[選択したアーキテクチャ/設計アプローチの説明]

### 検討した代替案

| 案 | 概要 | メリット | デメリット | 採用 |
|----|------|----------|------------|------|
| A | [説明] | [メリット] | [デメリット] | ✅ |
| B | [説明] | [メリット] | [デメリット] | ❌ |

### 決定理由

[なぜこのアプローチを選択したかの説明]

---

## Technical Design

### System Components

```
[コンポーネント図やシーケンス図をテキストで記述]
```

### Data Model

```
[データモデルの定義]
```

### API Design

[API がある場合は OpenAPI 仕様へのリンク]

- OpenAPI: `docs/02_architecture/api/[name].yaml`

---

## Implementation Strategy

### Phase 1: [フェーズ名]

**目的**: [このフェーズの目的]

**成果物**:
- [ ] [成果物 1]
- [ ] [成果物 2]

### Phase 2: [フェーズ名]

**目的**: [このフェーズの目的]

**成果物**:
- [ ] [成果物 1]
- [ ] [成果物 2]

---

## Test Strategy

### Unit Tests

| Component | Test Focus | Coverage Target |
|-----------|------------|-----------------|
| [コンポーネント] | [テストの焦点] | [カバレッジ目標] |

### Integration Tests

| Scenario | Systems Involved | Test Method |
|----------|------------------|-------------|
| [シナリオ] | [関連システム] | [テスト方法] |

### E2E Tests

| User Flow | Priority | Automated |
|-----------|----------|-----------|
| [ユーザーフロー] | High / Medium / Low | Yes / No |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| [リスク内容] | High / Medium / Low | High / Medium / Low | [対策] |

---

## Dependencies

### External Dependencies

| Dependency | Version | Purpose | Risk |
|------------|---------|---------|------|
| [ライブラリ名] | [バージョン] | [用途] | [リスク] |

### Internal Dependencies

| Component | Owner | Status |
|-----------|-------|--------|
| [コンポーネント] | [担当] | Ready / In Progress / Blocked |

---

## Rollback Plan

### Rollback Trigger

[どのような状況でロールバックするか]

### Rollback Steps

1. [ロールバック手順 1]
2. [ロールバック手順 2]

### Data Migration Rollback

[データマイグレーションがある場合のロールバック方法]

---

## Related Documents

- Spec: `.specify/specs/[id]/spec.md`
- Tasks: `.specify/specs/[id]/tasks.md`
- ADR: `docs/02_architecture/adr/[id].md`

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | YYYY-MM-DD | @author | Initial plan |
