# Migration Plan: Same-Origin API Routing

**Related**: [ADR-0006](../02_architecture/adr/0006_same_origin_api_routing.md) | [Impact Analysis](0006_same_origin_impact_analysis.md)
**Status**: Ready for Implementation
**Target Date**: 2026-01-22

## Overview

This document provides step-by-step instructions for migrating from cross-origin (`fe.*/be.*`) to same-origin (`${branch}.${repo}.localhost`) architecture.

## Prerequisites

- [ ] Review [ADR-0006](../02_architecture/adr/0006_same_origin_api_routing.md)
- [ ] Review [Impact Analysis](0006_same_origin_impact_analysis.md)
- [ ] Ensure no uncommitted changes in working directory
- [ ] Backup current `docker-compose.worktree.yml`
- [ ] Traefik is running: `docker ps | grep traefik`

## Migration Steps

### Phase 1: Update Traefik Routing (docker-compose.worktree.yml)

#### 1.1 Add Environment Variables for Naming

**Location**: Top of `docker-compose.worktree.yml`

**Before**: (implicit `${WORKTREE}`)
**After**: Add dynamic branch/repo detection

```yaml
# Add these environment variable substitutions
# ${WORKTREE} - sanitized branch name (already exists)
# ${REPO_NAME} - auto-derived from $(basename $PWD)
# ${UNIFIED_DOMAIN} - ${WORKTREE}.${REPO_NAME}.localhost
```

**Note**: These will be injected by `spawn.sh`, no hardcoding needed.

#### 1.2 Update Frontend Service Labels

**Location**: `services.web.labels` (lines 61-65)

**Remove**:
```yaml
- "traefik.http.routers.${WORKTREE}-fe.rule=Host(`fe.${WORKTREE}.localhost`)"
- "traefik.http.routers.${WORKTREE}-fe.entrypoints=web"
- "traefik.http.services.${WORKTREE}-fe.loadbalancer.server.port=3000"
```

**Add**:
```yaml
- "traefik.http.routers.${WORKTREE}-web.rule=Host(`${WORKTREE}.${REPO_NAME}.localhost`)"
- "traefik.http.routers.${WORKTREE}-web.entrypoints=web"
- "traefik.http.routers.${WORKTREE}-web.priority=1"
- "traefik.http.services.${WORKTREE}-web.loadbalancer.server.port=3000"
```

#### 1.3 Update Backend Service Labels

**Location**: `services.api.labels` (lines 91-95)

**Remove**:
```yaml
- "traefik.http.routers.${WORKTREE}-be.rule=Host(`be.${WORKTREE}.localhost`)"
- "traefik.http.routers.${WORKTREE}-be.entrypoints=web"
- "traefik.http.services.${WORKTREE}-be.loadbalancer.server.port=8080"
```

**Add**:
```yaml
- "traefik.http.routers.${WORKTREE}-api.rule=Host(`${WORKTREE}.${REPO_NAME}.localhost`) && PathPrefix(`/api`)"
- "traefik.http.routers.${WORKTREE}-api.entrypoints=web"
- "traefik.http.routers.${WORKTREE}-api.priority=100"
- "traefik.http.routers.${WORKTREE}-api.middlewares=${WORKTREE}-strip-api"
- "traefik.http.middlewares.${WORKTREE}-strip-api.stripprefix.prefixes=/api"
- "traefik.http.services.${WORKTREE}-api.loadbalancer.server.port=8080"
```

**Key Points**:
- Priority 100 for API (vs 1 for web) ensures `/api` matches first
- `StripPrefix` removes `/api` before forwarding to backend
- Middleware name must be unique per worktree

#### 1.4 Update Environment Variables

**Location**: `services.web.environment` (line 57)

**Remove**:
```yaml
- NEXT_PUBLIC_API_URL=http://be.${WORKTREE}.localhost
```

**Add**: (Nothing - frontend will use `/api` hardcoded)

**Location**: `services.api.environment` (line 83)

**Before**:
```yaml
- CORS_ALLOWED_ORIGINS=http://fe.${WORKTREE}.localhost,http://localhost:3000
```

**After**:
```yaml
- CORS_ALLOWED_ORIGINS=http://${WORKTREE}.${REPO_NAME}.localhost,http://localhost:3000
```

### Phase 2: Update Frontend Configuration

#### 2.1 Update API Base URL

**File**: `projects/apps/web/src/shared/config/env.ts`
**Lines**: 43-49

**Before**:
```typescript
const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'http://localhost:3001';

return {
  apiBaseUrl: apiUrl,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
```

**After**:
```typescript
// Same-origin API calls (always /api)
// No environment variable needed
const apiUrl = '/api';

return {
  apiBaseUrl: apiUrl,
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
```

**Rationale**: Frontend never needs to know backend URL (same origin).

#### 2.2 Verify API Client Usage

**File**: `projects/apps/web/src/shared/api/http.ts`
**Lines**: 46-49

**Current** (should work as-is):
```typescript
const config = getConfig();
const { baseUrl = config.apiBaseUrl, headers: customHeaders, ...fetchOptions } = options;

const url = `${baseUrl}${path}`;  // e.g., "/api" + "/csrf-token" = "/api/csrf-token"
```

**Verify**: No changes needed if `path` starts with `/`.

**Potential Issue**: If API calls pass full paths like `/api/csrf-token`, result would be `//api/csrf-token`.

**Fix** (if needed):
```typescript
// Ensure no double slashes
const url = `${baseUrl}${path}`.replace(/([^:]\/)\/+/g, "$1");
```

### Phase 3: Update Worktree Spawn Script

**File**: `tools/worktree/spawn.sh`

#### 3.1 Add Repository Name Detection

**Location**: After line 72 (in `get_worktree_path` function)

**Add new function**:
```bash
# Get repository name from folder
get_repo_name() {
    basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g'
}
```

#### 3.2 Export Environment Variables

**Location**: Before `docker compose` commands (around line 200)

**Add**:
```bash
# Export for docker compose
export REPO_NAME=$(get_repo_name)
log_info "Repository: $REPO_NAME"
log_info "Unified domain: ${WORKTREE}.${REPO_NAME}.localhost"
```

#### 3.3 Update URL Output Messages

**Location**: End of script (around line 250)

**Before**:
```bash
log_info "Frontend: http://fe.${WORKTREE}.localhost"
log_info "Backend: http://be.${WORKTREE}.localhost"
```

**After**:
```bash
log_success "=== Access your application ==="
log_info "URL: http://${WORKTREE}.${REPO_NAME}.localhost"
log_info "API: http://${WORKTREE}.${REPO_NAME}.localhost/api/health"
```

### Phase 4: Update Documentation

#### 4.1 Update README.md

**File**: `README.md`

**Find and replace**:
- `fe.${WORKTREE}.localhost` → `${WORKTREE}.${REPO}.localhost`
- `be.${WORKTREE}.localhost/api` → `${WORKTREE}.${REPO}.localhost/api`
- Remove references to separate frontend/backend URLs

**Add section**:
```markdown
## Same-Origin Architecture

This project uses a unified domain for frontend and backend:

- **Application**: `http://${branch}.vibecoding-template-node-next.localhost`
- **API**: `http://${branch}.vibecoding-template-node-next.localhost/api/*`

The frontend and backend share the same origin, eliminating CORS complexity.

### Why Same-Origin?

- ✅ No CORS configuration needed
- ✅ Simpler security (SameSite=Strict cookies)
- ✅ Single URL for development and testing
- ✅ Multi-repo ready (frontend/backend can be separate repos)
```

#### 4.2 Update CLAUDE.md

**File**: `CLAUDE.md`

**Find section**: "Quick Reference" or "Development URLs"

**Update** to show single URL pattern.

#### 4.3 Update Development Workflow Docs

**File**: `docs/00_process/development_workflow.md` (if exists)

**Update** any URL examples or environment variable references.

### Phase 5: Testing & Verification

#### 5.1 Infrastructure Tests

```bash
# 1. Stop current worktree
./tools/worktree/cleanup.sh

# 2. Start with new configuration
./tools/worktree/spawn.sh implementer feat/same-origin-api-routing

# 3. Verify Traefik routes
open http://localhost:8080/dashboard/

# Check for:
# - ${WORKTREE}-web router (priority 1)
# - ${WORKTREE}-api router (priority 100)
# - ${WORKTREE}-strip-api middleware

# 4. Test routing with curl
curl -v http://${WORKTREE}.${REPO_NAME}.localhost/
# Should return: HTML (frontend)

curl -v http://${WORKTREE}.${REPO_NAME}.localhost/api/health
# Should return: {"status":"ok"} (backend)

curl -v http://${WORKTREE}.${REPO_NAME}.localhost/api/csrf-token
# Should return: {"token":"..."} (no CORS errors)
```

#### 5.2 Browser Tests

```bash
# 1. Open application
open http://${WORKTREE}.${REPO_NAME}.localhost

# 2. Open DevTools (F12) → Network tab

# 3. Test login flow:
#    - Navigate to login page
#    - Check Network tab: all API calls should show:
#      - Request URL: http://${WORKTREE}.${REPO_NAME}.localhost/api/*
#      - No CORS preflight (OPTIONS) requests
#      - No CORS errors in console

# 4. Verify:
#    - Login succeeds
#    - Cookies are set with SameSite=Strict
#    - No CORS warnings in console
```

#### 5.3 Parallel Branch Test

```bash
# 1. Start main branch
cd /path/to/repo
./tools/worktree/spawn.sh implementer main

# 2. Start feature branch (in new terminal)
cd /path/to/repo
./tools/worktree/spawn.sh implementer feat/test

# 3. Verify both accessible
curl http://main.vibecoding-template-node-next.localhost/api/health
curl http://feat-test.vibecoding-template-node-next.localhost/api/health

# 4. Check Traefik dashboard
open http://localhost:8080/dashboard/
# Should show separate routers for each branch
```

### Phase 6: Quality Gates

```bash
# Run all quality checks
./tools/contract format
./tools/contract lint
./tools/contract typecheck
./tools/contract test
./tools/contract build
```

**Expected**: All pass (no breaking changes to code logic).

## Rollback Procedure

If issues occur during migration:

### Option 1: Git Revert (Recommended)

```bash
# 1. Revert the migration commit
git revert HEAD

# 2. Restart worktree
./tools/worktree/cleanup.sh
./tools/worktree/spawn.sh implementer <branch>

# 3. Verify old URLs work
curl http://fe.${WORKTREE}.localhost
curl http://be.${WORKTREE}.localhost/health
```

### Option 2: Manual Restore

```bash
# 1. Restore compose file
git checkout HEAD~1 -- docker-compose.worktree.yml
git checkout HEAD~1 -- projects/apps/web/src/shared/config/env.ts
git checkout HEAD~1 -- tools/worktree/spawn.sh

# 2. Restart services
docker compose down
docker compose up -d

# 3. Verify
curl http://fe.${WORKTREE}.localhost
```

## Post-Migration Checklist

- [ ] Browser loads `http://${WORKTREE}.${REPO_NAME}.localhost` successfully
- [ ] API calls visible in Network tab with `/api` prefix
- [ ] No CORS errors in browser console
- [ ] Login/logout flow works end-to-end
- [ ] Parallel branches don't conflict (tested with 2+ worktrees)
- [ ] Traefik dashboard shows correct routes and priorities
- [ ] No references to `fe.*` or `be.*` in logs or UI
- [ ] Documentation updated (README, CLAUDE.md, workflow docs)
- [ ] Quality gates pass (format, lint, typecheck, test, build)
- [ ] Team notified of URL structure change

## Common Issues & Solutions

### Issue 1: `/api` routes to frontend (404)

**Symptom**: `curl http://${WORKTREE}.${REPO}.localhost/api/health` returns HTML

**Cause**: Router priority not set or incorrect

**Solution**:
```yaml
# Ensure API router has higher priority
- "traefik.http.routers.${WORKTREE}-api.priority=100"
- "traefik.http.routers.${WORKTREE}-web.priority=1"
```

### Issue 2: Backend receives `/api/csrf-token` (404)

**Symptom**: Backend logs show "GET /api/csrf-token 404"

**Cause**: StripPrefix middleware not applied

**Solution**:
```yaml
# Check middleware is defined and attached
- "traefik.http.routers.${WORKTREE}-api.middlewares=${WORKTREE}-strip-api"
- "traefik.http.middlewares.${WORKTREE}-strip-api.stripprefix.prefixes=/api"
```

### Issue 3: `${REPO_NAME}` not expanding

**Symptom**: URL shows literal `${REPO_NAME}` instead of repo name

**Cause**: Environment variable not exported in spawn.sh

**Solution**:
```bash
# In spawn.sh, before docker compose:
export REPO_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g')
```

### Issue 4: CORS errors still appear

**Symptom**: Browser console shows CORS errors

**Cause**: Frontend still using absolute URL or CORS headers sent incorrectly

**Solution**:
1. Verify `env.ts` uses `/api` (not `http://...`)
2. Check Network tab: Request URL should be same origin
3. Clear browser cache and hard refresh (Cmd+Shift+R)

## Multi-Repo Deployment (Future)

When splitting frontend/backend into separate repos:

### Frontend Repo Setup

```yaml
# frontend-repo/docker-compose.yml
services:
  web:
    labels:
      - "traefik.http.routers.${WORKTREE}-web.rule=Host(`${WORKTREE}.${REPO_NAME}.localhost`)"
      - "traefik.http.routers.${WORKTREE}-web.priority=1"
    networks:
      - traefik-public

networks:
  traefik-public:
    external: true
```

### Backend Repo Setup

```yaml
# backend-repo/docker-compose.yml
services:
  api:
    labels:
      - "traefik.http.routers.${WORKTREE}-api.rule=Host(`${WORKTREE}.${REPO_NAME}.localhost`) && PathPrefix(`/api`)"
      - "traefik.http.routers.${WORKTREE}-api.priority=100"
      - "traefik.http.routers.${WORKTREE}-api.middlewares=${WORKTREE}-strip-api"
      - "traefik.http.middlewares.${WORKTREE}-strip-api.stripprefix.prefixes=/api"
    networks:
      - traefik-public

networks:
  traefik-public:
    external: true
```

**Key Point**: Both repos use **same domain** (`${WORKTREE}.${REPO_NAME}.localhost`). Traefik routes based on path.

## Timeline

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Docker Compose | 30 min | Not Started |
| Phase 2: Frontend Config | 15 min | Not Started |
| Phase 3: Spawn Script | 30 min | Not Started |
| Phase 4: Documentation | 30 min | Not Started |
| Phase 5: Testing | 45 min | Not Started |
| Phase 6: Quality Gates | 15 min | Not Started |
| **Total** | **2.75 hours** | |

## Success Criteria

✅ Migration is successful when:

1. Single URL (`http://${WORKTREE}.${REPO_NAME}.localhost`) serves both frontend and API
2. Zero CORS errors in browser console
3. All API calls use `/api` prefix (verified in Network tab)
4. Login/logout flow works end-to-end
5. Parallel branches work without conflicts
6. Quality gates pass
7. Documentation reflects new URL structure

## References

- [ADR-0006: Same-Origin API Routing](../02_architecture/adr/0006_same_origin_api_routing.md)
- [Impact Analysis](0006_same_origin_impact_analysis.md)
- [Traefik PathPrefix Documentation](https://doc.traefik.io/traefik/routing/routers/#rule)
- [Traefik StripPrefix Middleware](https://doc.traefik.io/traefik/middlewares/http/stripprefix/)
