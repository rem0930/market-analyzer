---
description: Create or update DocDD specification
allowed-tools: Read, Write, Edit, Glob, Grep
argument-hint: <feature-name>
context: fork
agent: pdm
---

# DocDD Spec First

Create specification before implementation.

## Feature

$ARGUMENTS

## Output Structure

```
.specify/specs/<id>/
├── spec.md      # What & Why
├── plan.md      # How (after spec approved)
└── tasks.md     # Breakdown (after plan approved)
```

## Spec Template

```markdown
# Spec: <Feature Name>

## Summary
One paragraph describing the feature.

## Problem
What problem does this solve?

## Solution
High-level approach.

## Acceptance Criteria
- [ ] AC-001: <criterion>
- [ ] AC-002: <criterion>

## Non-Functional Requirements
- Performance: <target>
- Security: <considerations>

## Out of Scope
- <explicitly excluded items>
```
