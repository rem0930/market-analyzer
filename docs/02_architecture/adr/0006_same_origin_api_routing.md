# ADR-0006: Same-Origin API Routing with Unified Domain

## Status

Proposed

## Context

### Current State

The development environment uses separate subdomains for frontend and backend:

- **Frontend**: `fe.${WORKTREE}.localhost` (port 3000)
- **Backend**: `be.${WORKTREE}.localhost` (port 8080)
- **API Access**: Frontend calls `http://be.${WORKTREE}.localhost/*`

This cross-origin architecture requires:
- CORS configuration in backend middleware
- Environment variable `NEXT_PUBLIC_API_URL` to specify backend URL
- CORS-related security considerations (credentials, preflight requests)
- Different origins visible to the browser

### Problems

1. **CORS Complexity**: Cross-origin requests require CORS headers, preflight requests (OPTIONS), and credential handling
2. **CSRF Protection**: Cross-origin makes CSRF protection more complex
3. **Cookie Security**: Cross-origin cookies require `SameSite=None; Secure`, which is less secure than `SameSite=Strict`
4. **Environment Coupling**: Frontend is tightly coupled to backend URL via environment variables
5. **Multi-Repo Future**: When frontend/backend split into separate repos, maintaining cross-origin setup becomes harder

### Goals

1. **Eliminate CORS by Design**: Use same-origin architecture
2. **Single Entry Point**: One domain for both frontend and backend (`${BRANCH}.${REPO}.localhost`)
3. **Path-Based Routing**: Route `/api/*` to backend, everything else to frontend
4. **Environment Agnostic**: Frontend never needs to know backend URL (always use `/api`)
5. **Multi-Repo Ready**: Architecture works when frontend/backend are separate repos

## Decision

### Unified Domain Architecture

Adopt a **same-origin architecture** using a single domain with path-based routing:

```
http://${BRANCH}.${REPO}.localhost/         → Frontend (Next.js)
http://${BRANCH}.${REPO}.localhost/api/*    → Backend (Express/Node)
```

### Implementation Strategy

#### 1. Domain Naming Convention

**Format**: `${branch-name}.${repository-name}.localhost`

- `${repository-name}`: Auto-derived from repository folder name (`basename $PWD`)
  - Ensures different repos don't collide when running concurrently
  - No manual env var needed
- `${branch-name}`: Sanitized git branch name
  - Convert `/` and `_` to `-`
  - Remove special characters
  - Max 40 characters

**Examples**:
- `main.vibecoding-template-node-next.localhost`
- `feat-auth.vibecoding-template-node-next.localhost`

#### 2. Traefik L7 Routing

**Router Rules** (with priority):
```yaml
# API Router (priority: 100)
- "traefik.http.routers.${WORKTREE}-api.rule=Host(`${BRANCH}.${REPO}.localhost`) && PathPrefix(`/api`)"
- "traefik.http.routers.${WORKTREE}-api.priority=100"
- "traefik.http.routers.${WORKTREE}-api.middlewares=${WORKTREE}-strip-api"
- "traefik.http.middlewares.${WORKTREE}-strip-api.stripprefix.prefixes=/api"

# Web Router (priority: 1)
- "traefik.http.routers.${WORKTREE}-web.rule=Host(`${BRANCH}.${REPO}.localhost`)"
- "traefik.http.routers.${WORKTREE}-web.priority=1"
```

**Key Points**:
- API router has **higher priority** (100 vs 1) to match first
- `StripPrefix` middleware removes `/api` before forwarding to backend
  - Browser sends: `/api/csrf-token`
  - Backend receives: `/csrf-token`
- Backend code remains unchanged (no `/api` prefix in routes)

#### 3. Frontend Configuration

**Remove environment variable dependency**:
```typescript
// Before
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// After
const apiUrl = '/api';  // Always relative, same-origin
```

**All API calls use `/api` prefix**:
```typescript
// Before
fetch(`${config.apiBaseUrl}/csrf-token`)

// After
fetch('/api/csrf-token')  // Browser resolves to same origin
```

#### 4. Backend (No Changes Required)

Backend routes remain at root level:
```typescript
// Routes stay as-is
router.post('/csrf-token', ...)
router.post('/auth/login', ...)
router.get('/health', ...)
```

Traefik `StripPrefix` handles the `/api` prefix removal.

#### 5. CORS Configuration

**Current**: Backend allows `http://fe.${WORKTREE}.localhost`
**Future**: CORS becomes unnecessary (same-origin), but keep implementation for:
- Backward compatibility
- Future cross-origin scenarios (e.g., mobile apps)
- Document in migration plan that CORS is no longer required

### Multi-Repo Strategy

When frontend/backend split into separate repos:

**Shared Traefik Network**:
```yaml
# Frontend repo compose
networks:
  traefik-public:
    external: true

# Backend repo compose
networks:
  traefik-public:
    external: true
```

**Naming Convention Prevents Collisions**:
- Frontend: `${BRANCH}.${FRONTEND_REPO}.localhost`
- Backend: Shares same domain via Traefik labels
- Both connect to `traefik-public` network
- Traefik routes based on path (`/api` vs `/`)

**Example**:
```yaml
# frontend-repo/docker-compose.yml
services:
  web:
    labels:
      - "traefik.http.routers.${WORKTREE}-web.rule=Host(`${BRANCH}.${REPO}.localhost`)"
      - "traefik.http.routers.${WORKTREE}-web.priority=1"
    networks:
      - traefik-public

# backend-repo/docker-compose.yml
services:
  api:
    labels:
      - "traefik.http.routers.${WORKTREE}-api.rule=Host(`${BRANCH}.${REPO}.localhost`) && PathPrefix(`/api`)"
      - "traefik.http.routers.${WORKTREE}-api.priority=100"
      - "traefik.http.middlewares.${WORKTREE}-strip-api.stripprefix.prefixes=/api"
    networks:
      - traefik-public
```

## Consequences

### Positive

1. **No CORS Required**: Same-origin eliminates CORS complexity
2. **Simpler Security**: `SameSite=Strict` cookies, no preflight requests
3. **Environment Agnostic**: Frontend code never references backend URL
4. **Single Entry Point**: One URL for browser access and testing
5. **Multi-Repo Ready**: Architecture supports separate repos naturally
6. **Better DX**: Developers only need one URL to remember

### Negative

1. **Traefik Dependency**: Requires L7 proxy (not optional)
2. **Path Collision Risk**: Backend must never use `/api` at root (reserved)
3. **Migration Effort**: Existing code needs updates (env vars, API calls)

### Neutral

1. **Backend Unchanged**: Routes stay at root level (Traefik handles prefix)
2. **CORS Kept**: Backend CORS implementation remains for compatibility

## Alternatives Considered

### Alternative 1: Keep Cross-Origin, Improve CORS

**Pros**: No architectural change
**Cons**: Still complex, doesn't solve multi-repo, environment coupling remains

### Alternative 2: Backend Prefix at Code Level

Add `/api` prefix in backend routes:
```typescript
router.post('/api/csrf-token', ...)
```

**Pros**: No Traefik StripPrefix needed
**Cons**:
- Backend code now has deployment-specific prefix
- Harder to change later
- Violates separation of concerns (routing vs application)

**Decision**: Use Traefik StripPrefix (cleaner separation)

## Implementation Plan

See: [Migration Plan](../03_impact_analysis/0006_same_origin_migration_plan.md)

## References

- OWASP CORS: https://owasp.org/www-community/attacks/csrf
- Traefik Path Prefix: https://doc.traefik.io/traefik/routing/routers/#rule
- Same-Origin Policy: https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
