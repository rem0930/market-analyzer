---
paths:
  - "projects/**/*.ts"
  - "projects/**/*.tsx"
---

# TypeScript Rules

## Style

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use explicit return types for exported functions
- No `any` unless absolutely necessary (use `unknown` instead)

## Imports

- Use absolute imports via tsconfig paths
- Group imports: external, internal, relative
- No circular dependencies

## Error Handling

- Use Result pattern or explicit error types
- Never swallow errors silently
- Log errors with context

## Testing

- Co-locate tests: `*.test.ts` next to source
- Use Vitest for unit tests
- Mock at boundaries only
