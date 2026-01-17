# Backend Rules (Always Applied)

## Architecture: Clean Architecture + DDD

```
presentation → usecase → domain ← infrastructure
```

**Dependencies point INWARD toward domain.**

## Layer Rules

### Domain Layer
- Pure business logic only
- No external dependencies (frameworks, I/O, DB)
- Location: `projects/apps/*/src/domain/`

### UseCase Layer
- Orchestrates domain objects
- Depends only on domain interfaces
- Location: `projects/apps/*/src/usecase/`

### Infrastructure Layer
- Implements domain interfaces
- Contains DB, external APIs, file system
- Location: `projects/apps/*/src/infrastructure/`

### Presentation Layer
- HTTP routes, controllers, CLI
- Thin adapter between HTTP and UseCase
- Location: `projects/apps/*/src/presentation/`

## API Rules

- Define OpenAPI spec FIRST (`docs/02_architecture/api/*.yaml`)
- Generate types from spec
- Never hand-write HTTP clients

## Database Rules

- Use parameterized queries only
- Migrations via `./tools/contract migrate`
- No raw SQL interpolation

## Testing

- Test UseCase layer thoroughly
- Mock infrastructure in tests
- Run with `./tools/contract test`
