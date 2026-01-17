# Frontend Rules (Always Applied)

## Architecture: Feature-Sliced Design (FSD)

```text
app → widgets → features → entities → shared
```

**Higher layers import from lower layers, never vice versa.**

## Layer Constraints (MUST)

| Rule                   | Description                                    |
|------------------------|------------------------------------------------|
| Public API only        | Import from `index.ts`, not internal files     |
| No cross-feature       | Use events/context, not direct imports         |
| Shared is agnostic     | No React/Next.js in `shared/lib/`              |
| Design tokens          | No inline styles, use design system            |

## Directory Structure

```text
src/
├── app/        # Next.js app router, global providers
├── widgets/    # Composite UI blocks (optional)
├── features/   # User interactions, business features
├── entities/   # Business entities (User, Product, etc.)
└── shared/     # Reusable utilities, UI kit, types
```

## Slice Structure (MUST follow)

```text
features/<name>/
├── ui/           # React components
├── model/        # State, hooks, logic
├── api/          # API calls
├── lib/          # Utilities for this feature
└── index.ts      # Public API only
```

## Design System Reference

- Tokens: `design/tokens/`
- Docs: `docs/01_product/design_system/`

## Detailed Reference

For Next.js integration, component patterns, and state management:

→ `.claude/skills/fsd-frontend/SKILL.md`
