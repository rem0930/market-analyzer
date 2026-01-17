# Profile Edit Implementation Plan

## Phase 1: API Contract (OpenAPI)

1. Add profile endpoints to `openapi.yaml`
   - `PATCH /users/me/name`
   - `PATCH /users/me/password`

2. Generate types from OpenAPI spec

## Phase 2: Backend Implementation

### 2.1 Domain Layer

- Leverage existing `AuthUser.changePassword()` method
- Add `User.changeName()` method if not exists

### 2.2 UseCase Layer

```
projects/apps/api/src/usecase/profile/
├── change-name-usecase.ts
├── change-password-usecase.ts
└── index.ts
```

### 2.3 Infrastructure Layer

- Leverage existing repositories
- No new infrastructure needed

### 2.4 Presentation Layer

```
projects/apps/api/src/presentation/controllers/
└── profile-controller.ts
```

### 2.5 Routes

- Add profile routes to router

## Phase 3: Frontend Implementation

```
projects/apps/web/src/features/profile/
├── api/
│   ├── change-name.ts
│   ├── change-password.ts
│   └── index.ts
├── ui/
│   ├── ProfileEditForm.tsx
│   ├── NameChangeSection.tsx
│   └── PasswordChangeSection.tsx
└── index.ts
```

## Phase 4: Quality Gates

1. `./tools/contract format`
2. `./tools/contract lint`
3. `./tools/contract typecheck`
4. `./tools/contract test`
5. `./tools/contract build`

## Dependencies

- Existing: `AuthUser`, `User`, `AuthMiddleware`, `JwtService`, `PasswordService`
- New: None

## Risks

- **Low**: bcrypt default mismatch (container.ts: 10 vs PasswordService: 12)
  - Mitigation: Fix container.ts default to 12
