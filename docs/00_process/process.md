# Development Process (DocDD)

このリポジトリは **Document-Driven Development (DocDD)** を採用しています。
すべての変更は、ドキュメント（Spec / Plan / AC）から始まります。

---

## Stages

```
1. Product Identity / PRD
       ↓
2. Spec (FR / NFR / AC)
       ↓
3. Plan (Architecture / ADR / Impact)
       ↓
4. Tasks (Implementation Plan)
       ↓
5. Implement + Unit Tests
       ↓
6. QA Evidence
       ↓
7. Release Plan / Delivery
```

---

## Stage Details

### 1. Product Identity / PRD

**目的**: プロダクトの方向性を定義する

**成果物**:
- [docs/01_product/identity.md](../01_product/identity.md) - Vision / Mission / Principles
- [docs/01_product/prd.md](../01_product/prd.md) - Product Requirements Document

### 2. Spec (FR / NFR / AC)

**目的**: 機能要件・非機能要件・受入基準を明確にする

**成果物**:
- `.specify/specs/<feature_id>/spec.md`

**必須項目**:
- Functional Requirements (FR)
- Non-Functional Requirements (NFR)
- Acceptance Criteria (AC)

### 3. Plan (Architecture / ADR / Impact)

**目的**: 技術的な設計と影響範囲を明確にする

**成果物**:
- [docs/02_architecture/adr/](../02_architecture/adr/) - Architecture Decision Records
- Impact Analysis（必要に応じて）

### 4. Tasks (Implementation Plan)

**目的**: 実装タスクを分解し、見積もりを行う

**成果物**:
- GitHub Issues / Project Board
- タスク分解（1 タスク = 1 PR が理想）

### 5. Implement + Unit Tests

**目的**: コードを実装し、テストで品質を担保する

**必須**:
```bash
./tools/contract format
./tools/contract lint
./tools/contract test
./tools/contract build
```

### 6. QA Evidence

**目的**: 受入基準を満たしていることを証明する

**成果物**:
- テスト結果のスクリーンショット / ログ
- AC チェックリストの完了

### 7. Release Plan / Delivery

**目的**: 安全にリリースする

**成果物**:
- [docs/04_delivery/release_process.md](../04_delivery/release_process.md)
- リリースノート

---

## Required Artifacts per Change Type

| Change Type | Required Artifacts |
|-------------|-------------------|
| **新機能** | Spec + Plan + Tasks + Tests |
| **アーキ変更** | ADR + Impact Analysis + Migration Plan |
| **UI 変更** | UI Requirements + AC update + Design system update |
| **バグ修正** | Issue link + Tests + (Spec update if behavior change) |
| **リファクタリング** | ADR (why) + Tests (no behavior change) |
| **依存更新** | Changelog review + Tests |

---

## PR Checklist

- [ ] Spec が存在し、AC が定義されている
- [ ] 関連する Docs が更新されている
- [ ] `./tools/contract lint` が通る
- [ ] `./tools/contract test` が通る
- [ ] `./tools/contract build` が通る
- [ ] PR テンプレが埋められている

---

## Links

- [AGENTS.md](../../AGENTS.md) - Canonical Instructions
- [docs/03_quality/template_acceptance_criteria.md](../03_quality/template_acceptance_criteria.md) - Template AC
- [docs/04_delivery/release_process.md](../04_delivery/release_process.md) - Release Process
