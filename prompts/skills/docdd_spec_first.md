# Skill: DocDD Spec First

## Trigger
- 機能実装のリクエスト
- アーキテクチャ変更のリクエスト

## Purpose
Spec/Plan/Tasks を先に作成してから実装に移る。

## Guardrails

**重要**: Spec/Plan/Tasks がない限り Implementer に移行しない。

## Steps

### Step 1: Create or Update Spec

場所: `.specify/specs/<id>/spec.md`

```markdown
# Spec: [Feature Name]

## Overview
[機能の概要]

## Functional Requirements (FR)

### FR-001: [タイトル]
[詳細な要件説明]

## Non-Functional Requirements (NFR)

### NFR-001: Performance
[パフォーマンス要件]

### NFR-002: Security
[セキュリティ要件]

## Acceptance Criteria (AC)

### AC-001: [タイトル]

**Given** [前提条件]
**When** [実行するアクション]
**Then** [期待される結果]

## Out of Scope
[スコープ外の項目]

## Assumptions
[前提・仮定]
```

### Step 2: Create Plan (if needed)

場所: `.specify/specs/<id>/plan.md`

アーキテクチャ変更がある場合は ADR も作成:
- `docs/02_architecture/adr/<id>.md`

```markdown
# Plan: [Feature Name]

## Architecture Overview
[アーキテクチャの概要]

## Components
[影響を受けるコンポーネント]

## Data Flow
[データの流れ]

## Dependencies
[依存関係]

## Risks and Mitigations
[リスクと軽減策]

## Rollback Strategy
[ロールバック戦略]
```

### Step 3: Create Tasks

場所: `.specify/specs/<id>/tasks.md`

```markdown
# Tasks: [Feature Name]

## Prerequisites
- [ ] Task 0: [前提タスク]

## Implementation Tasks

### Phase 1: [フェーズ名]
- [ ] Task 1: [タスク詳細] (estimate: Xh)
- [ ] Task 2: [タスク詳細] (estimate: Xh)

### Phase 2: [フェーズ名]
- [ ] Task 3: [タスク詳細] (estimate: Xh)

## Testing Tasks
- [ ] Task N: Write unit tests
- [ ] Task N+1: Write integration tests

## Documentation Tasks
- [ ] Task M: Update API docs
- [ ] Task M+1: Update user guide
```

## Output
- `.specify/specs/<id>/spec.md`
- `.specify/specs/<id>/plan.md`
- `.specify/specs/<id>/tasks.md`
- `docs/02_architecture/adr/<id>.md` (if needed)
