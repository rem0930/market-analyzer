# Spec: [機能名]

## Metadata

- **ID**: [kebab-case-id]
- **Status**: Draft | Approved | In Progress | Completed
- **Created**: YYYY-MM-DD
- **Updated**: YYYY-MM-DD

---

## Parent Documents

| Document | Path | Reference |
|----------|------|-----------|
| PRD | `docs/01_product/prd.md` | FR-XXX / US-XXX |
| Identity | `docs/01_product/identity.md` | [関連する原則] |
| Related ADR | `docs/02_architecture/adr/XXXX.md` | [ADR タイトル] |
| Parent Spec | `.specify/specs/xxx/spec.md` | [親 Spec がある場合] |

---

## Overview

[この機能の概要を 2-3 文で説明]

---

## Impact Analysis

### Affected Systems

- [ ] Frontend: [影響箇所を具体的に記載]
- [ ] Backend: [影響箇所を具体的に記載]
- [ ] Database: [スキーマ変更の有無と内容]
- [ ] API: [エンドポイント変更の有無と内容]

### Breaking Changes

- [ ] なし
- [ ] あり: [詳細を記載]

### Downstream Dependencies

| System | Impact | Migration Required |
|--------|--------|-------------------|
| [依存システム名] | [影響内容] | Yes / No |

---

## Functional Requirements (FR)

### FR-001: [要件タイトル]

[要件の詳細な説明]

- [詳細項目 1]
- [詳細項目 2]

### FR-002: [要件タイトル]

[要件の詳細な説明]

---

## Non-Functional Requirements (NFR)

### NFR-001: Performance

- [パフォーマンス要件]

### NFR-002: Security

- [セキュリティ要件]

### NFR-003: Availability

- [可用性要件]

---

## Acceptance Criteria (AC)

### AC-001: [テストケースタイトル]

**Given** [前提条件]
**When** [アクション]
**Then** [期待結果]

### AC-002: [テストケースタイトル]

**Given** [前提条件]
**When** [アクション]
**Then** [期待結果]

---

## Out of Scope

- [スコープ外項目 1]
- [スコープ外項目 2]

---

## Assumptions

- [前提条件 1]
- [前提条件 2]

---

## Code Map

| Requirement | Module | File(s) | Test |
|-------------|--------|---------|------|
| FR-001 | [モジュール名] | `src/path/to/file.ts` | `src/path/to/__tests__/file.test.ts` |
| FR-002 | [モジュール名] | `src/path/to/file.ts` | `src/path/to/__tests__/file.test.ts` |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | YYYY-MM-DD | @author | Initial spec |
