---
paths:
  - "projects/apps/api/**/*"
  - "docs/02_architecture/api/**/*"
---

# API Development Rules

## Contract First

1. Define OpenAPI spec in `docs/02_architecture/api/*.yaml`
2. Generate types and client code
3. Never hand-write HTTP clients/handlers

## Structure

```
projects/apps/api/src/
├── domain/           # Business logic (framework-agnostic)
├── application/      # Use cases
├── infrastructure/   # DB, external services
└── presentation/     # HTTP routes, controllers
```

## Conventions

- RESTful endpoints: `GET /users`, `POST /users`, `GET /users/:id`
- Error responses: RFC 7807 Problem Details
- Validation: Zod schemas derived from OpenAPI
- Auth: Bearer token in Authorization header
