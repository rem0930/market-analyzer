# Backend Rules (Always Applied)

## Architecture: Clean Architecture + DDD

```text
presentation → usecase → domain ← infrastructure
```

**Dependencies point INWARD toward domain.**

## Layer Constraints (MUST)

| Layer          | MUST                          | MUST NOT                        |
|----------------|-------------------------------|---------------------------------|
| Domain         | Pure business logic           | Import frameworks, I/O, DB      |
| UseCase        | Orchestrate domain            | Contain business logic          |
| Infrastructure | Implement domain interfaces   | Be imported by domain/usecase   |
| Presentation   | Map HTTP ↔ UseCase            | Contain business logic          |

## API Rules (MUST)

- Define OpenAPI spec FIRST (`docs/02_architecture/api/*.yaml`)
- Generate types from spec
- Never hand-write HTTP clients

## Database Rules (MUST)

- Parameterized queries only (no raw SQL interpolation)
- Migrations via `./tools/contract migrate`

## Detailed Reference

For code examples, patterns, and when-to-break-rules guidance:

→ `.claude/skills/ddd-clean-architecture/SKILL.md`
