---
name: docdd-spec-first
description: Create Spec/Plan/Tasks before any implementation
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
user-invocable: true
---

# Skill: DocDD Spec First

## Trigger

- Feature implementation request
- Architecture change request

## Guardrail

**CRITICAL**: Do NOT start implementation without Spec/Plan/Tasks.

## Outputs

```
.specify/specs/<id>/
├── spec.md      # What & Why
├── plan.md      # How
└── tasks.md     # Work breakdown
```

## Step 1: Create Spec

Location: `.specify/specs/<id>/spec.md`

```markdown
# Spec: [Feature Name]

## Summary
One paragraph.

## Problem
What problem does this solve?

## Solution
High-level approach.

## Acceptance Criteria

### AC-001: [Title]
**Given** [precondition]
**When** [action]
**Then** [expected result]

## Non-Functional Requirements

- Performance: [target]
- Security: [considerations]

## Out of Scope
- [explicitly excluded items]
```

## Step 2: Create Plan

Location: `.specify/specs/<id>/plan.md`

For architecture changes, also create ADR:
- `docs/02_architecture/adr/<id>.md`

## Step 3: Create Tasks

Location: `.specify/specs/<id>/tasks.md`

**Test-First Principle**: Tests before implementation.

```markdown
# Tasks

## Phase 1: Contract (before implementation)
- [ ] Define OpenAPI spec (if API)
- [ ] Write unit tests (test cases)
- [ ] Write integration tests

## Phase 2: Implementation
- [ ] Implement to pass tests

## Phase 3: Verification
- [ ] All tests pass
- [ ] Docs updated
```
