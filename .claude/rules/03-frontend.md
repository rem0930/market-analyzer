---
paths:
  - "projects/apps/web/**/*"
  - "projects/packages/ui/**/*"
---

# Frontend Rules

## React Conventions

- Functional components only
- Use hooks for state and effects
- Prefer composition over inheritance
- Keep components small (<100 lines)

## File Structure

```
components/
├── ComponentName/
│   ├── index.tsx        # Main component
│   ├── ComponentName.test.tsx
│   └── ComponentName.stories.tsx
```

## Styling

- Use design tokens from `design/tokens/`
- Prefer CSS-in-JS or Tailwind (check project config)
- Responsive-first design

## State Management

- Local state: `useState`
- Server state: TanStack Query
- Global state: Only when necessary (Zustand/Jotai)
