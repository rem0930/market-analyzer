# Frontend Rules (Always Applied)

## Architecture: Feature-Sliced Design (FSD)

```
app → widgets → features → entities → shared
```

**Higher layers import from lower layers, never vice versa.**

## Directory Structure

```
src/
├── app/        # Next.js app router, global providers
├── widgets/    # Composite UI blocks (optional)
├── features/   # User interactions, business features
├── entities/   # Business entities (User, Product, etc.)
└── shared/     # Reusable utilities, UI kit, types
```

## Slice Structure

```
features/<name>/
├── ui/           # React components
├── model/        # State, hooks, logic
├── api/          # API calls
├── lib/          # Utilities for this feature
└── index.ts      # Public API only
```

## Import Rules

1. **Public API only**: Import from `index.ts`, not internal files
2. **No cross-feature imports**: Use events/context instead
3. **Shared is framework-agnostic**: No React in `shared/lib/`

## Component Rules

- Functional components with hooks
- Props types defined with TypeScript
- No inline styles (use design tokens)
- Accessibility: semantic HTML, ARIA labels

## State Management

- Local state: `useState`, `useReducer`
- Server state: React Query / SWR
- Global state: Context or Zustand (minimal)

## Testing

- Component tests with Testing Library
- No snapshot tests unless justified
- Run with `./tools/contract test`

## Design System

- Reference: `docs/01_product/design_system/`
- Tokens: `design/tokens/`
- Use existing components before creating new
