---
name: fsd-frontend
description: Feature-Sliced Design for React/Next.js frontend. Apply when organizing frontend code, creating features, or reviewing UI structure.
tools:
  - Read
  - Grep
  - Glob
---

# Feature-Sliced Design (FSD)

Frontend architecture for scalable React/Next.js apps.

## Layer Structure

```
src/
├── app/        # Next.js app router, global providers
├── pages/      # (if using pages router)
├── widgets/    # Composite UI blocks (optional)
├── features/   # User interactions, business features
├── entities/   # Business entities (User, Product, etc.)
└── shared/     # Reusable utilities, UI kit, types
```

## Dependency Rule

```
app → widgets → features → entities → shared
```

**Higher layers can import from lower layers, not vice versa.**

## Slice Structure

Each slice in features/entities follows:

```
features/auth/
├── ui/           # React components
├── model/        # State, hooks, logic
├── api/          # API calls
├── lib/          # Utilities for this feature
└── index.ts      # Public API (only export what's needed)
```

## Next.js App Router Integration

```
app/
├── (auth)/
│   ├── login/page.tsx     # Uses features/auth
│   └── register/page.tsx
├── dashboard/
│   └── page.tsx           # Uses features/dashboard
└── layout.tsx             # Global layout, providers
```

## Rules

### 1. Public API Only
```typescript
// features/auth/index.ts
export { LoginForm } from './ui/LoginForm';
export { useAuth } from './model/useAuth';
// Don't export internal components
```

### 2. No Cross-Feature Imports
```typescript
// features/cart/ui/Cart.tsx
import { ProductCard } from '@/entities/product'; // ✅ OK
import { CheckoutButton } from '@/features/checkout'; // ❌ NO
```

### 3. Shared is Framework-Agnostic
```typescript
// shared/lib/formatDate.ts - No React imports
// shared/ui/Button.tsx - Pure UI, no business logic
```

## When to Break Rules

- **Widgets**: When features need to compose, use widgets layer
- **Cross-feature**: Use events/context, not direct imports
- **Prototype**: Mark with TODO, refactor before merge

## See Also

- [Feature-Sliced Design](https://feature-sliced.design/)
- `docs/01_product/design_system/` for design tokens
