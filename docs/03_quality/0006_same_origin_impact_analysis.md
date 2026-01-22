# Impact Analysis: Same-Origin API Routing Migration

**Related ADR**: [ADR-0006](../02_architecture/adr/0006_same_origin_api_routing.md)
**Date**: 2026-01-22
**Status**: In Progress

## Executive Summary

**Change Type**: Architecture Migration
**Risk Level**: Medium
**Estimated Effort**: 4-6 hours
**Breaking Changes**: Yes (URL structure, environment variables)

This migration moves from cross-origin (separate fe.*/be.* domains) to same-origin architecture (single domain with /api routing). The change simplifies security, eliminates CORS complexity, and prepares for multi-repo deployment.

## Systems Impacted

### 1. Infrastructure (HIGH Impact)

**Files Changed**:
- `docker-compose.worktree.yml`
- `tools/worktree/spawn.sh`
- `infra/docker-compose.traefik.yml` (if exists)

**Changes**:
- Traefik router labels (remove fe.*/be.*, add unified + /api routing)
- Add StripPrefix middleware for /api
- Set router priorities (api=100, web=1)
- Update environment variable injection (WORKTREE → BRANCH + REPO)

**Risks**:
- Routing misconfiguration could break both frontend and backend
- Priority misconfiguration could route /api to frontend
- StripPrefix failure would send `/api/csrf-token` to backend (404)

**Mitigation**:
- Test routing with curl before browser testing
- Verify Traefik dashboard shows correct routes
- Keep old compose as backup during migration

### 2. Frontend (MEDIUM Impact)

**Files Changed**:
- `projects/apps/web/src/shared/config/env.ts`
- `projects/apps/web/src/shared/api/http.ts`
- `docker-compose.worktree.yml` (NEXT_PUBLIC_API_URL)

**Changes**:
- Change `apiBaseUrl` from dynamic URL to `/api`
- Remove `NEXT_PUBLIC_API_URL` environment variable
- Update all API calls to use `/api` prefix

**Current**:
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
fetch(`${apiUrl}/csrf-token`)
```

**After**:
```typescript
const apiUrl = '/api';
fetch('/api/csrf-token')
```

**Risks**:
- URL concatenation bugs (e.g., `//api/csrf-token`)
- Hardcoded absolute URLs in code
- External API calls mistakenly using `/api`

**Mitigation**:
- Grep for `http://` and `https://` in frontend code
- Test all API endpoints after migration
- Keep fallback for local development

### 3. Backend (LOW Impact)

**Files Changed**:
- `docker-compose.worktree.yml` (CORS_ALLOWED_ORIGINS)
- Documentation only

**Changes**:
- Update CORS_ALLOWED_ORIGINS (optional, will be unused)
- Document that CORS is no longer required
- **No code changes** (routes stay at root level)

**Risks**:
- Backend routes accidentally created at `/api/*` level
- CORS removal breaks non-browser clients

**Mitigation**:
- Document reserved `/api` prefix
- Keep CORS implementation for compatibility
- Add linting rule to prevent `/api` routes

### 4. Documentation (MEDIUM Impact)

**Files Changed**:
- `README.md`
- `docs/00_process/development_workflow.md`
- `CLAUDE.md`
- All docs referencing URLs

**Changes**:
- Update all `fe.*` and `be.*` references
- Document single unified URL
- Add multi-repo deployment guide
- Update troubleshooting sections

**Risks**:
- Stale documentation confuses developers
- Missing migration guide

**Mitigation**:
- Comprehensive doc review
- Add migration checklist
- Update all code examples

### 5. DevContainer / Worktree System (MEDIUM Impact)

**Files Changed**:
- `tools/worktree/spawn.sh`
- `.worktree-context.yaml` template
- Startup messages

**Changes**:
- Change URL output to single domain
- Update repository name detection logic
- Sanitize branch names for DNS compatibility

**Risks**:
- Worktree naming collisions
- Invalid DNS characters in domain

**Mitigation**:
- Robust sanitization function
- Test with various branch names (feature/foo, fix_bar)
- Validate repository name detection

## Backward Compatibility

### Breaking Changes

1. **URL Structure**: `fe.*/be.*` → `${branch}.${repo}.localhost`
   - **Impact**: Bookmarks, browser history, external links break
   - **Workaround**: None (intentional architectural change)

2. **Environment Variables**: `NEXT_PUBLIC_API_URL` removed
   - **Impact**: Local development without Docker needs update
   - **Workaround**: Document fallback to `http://localhost:8080/api`

3. **CORS Origins**: Frontend origin changes
   - **Impact**: Old CORS configuration becomes stale
   - **Workaround**: Update or document as unused

### Non-Breaking (Graceful)

1. **Backend Routes**: No changes required
2. **Backend CORS**: Kept for compatibility
3. **Database**: No impact

## Rollback Plan

### Quick Rollback (< 5 minutes)

1. **Git revert**:
   ```bash
   git revert HEAD
   ./tools/worktree/cleanup.sh
   ./tools/worktree/spawn.sh implementer <branch>
   ```

2. **Manual rollback**:
   - Restore `docker-compose.worktree.yml` from git
   - Run `docker compose down && docker compose up -d`
   - Verify old URLs work: `fe.${WORKTREE}.localhost`

### Full Rollback (if deployed)

**Not applicable** (dev-only change, no production deployment)

## Testing Strategy

### Pre-Deployment Testing

1. **Infrastructure**:
   ```bash
   # Verify Traefik routing
   curl -v http://${BRANCH}.${REPO}.localhost/
   curl -v http://${BRANCH}.${REPO}.localhost/api/health

   # Check Traefik dashboard
   open http://localhost:8080/dashboard/
   ```

2. **Frontend**:
   - Open `http://${BRANCH}.${REPO}.localhost` in browser
   - Check Network tab: all API calls go to `/api/*`
   - Verify no CORS errors in console
   - Test login flow end-to-end

3. **Backend**:
   ```bash
   # CSRF token (no CORS error)
   curl -v http://${BRANCH}.${REPO}.localhost/api/csrf-token

   # Health check
   curl http://${BRANCH}.${REPO}.localhost/api/health
   ```

4. **Parallel Branches**:
   ```bash
   # Start two branches simultaneously
   cd worktrees/main && docker compose up -d
   cd worktrees/feat-test && docker compose up -d

   # Verify both accessible
   curl http://main.${REPO}.localhost/api/health
   curl http://feat-test.${REPO}.localhost/api/health
   ```

### Acceptance Criteria

- [ ] Browser loads `http://${BRANCH}.${REPO}.localhost` (frontend)
- [ ] `/api/csrf-token` returns 200 (no CORS error)
- [ ] Network tab shows all API calls as same-origin
- [ ] Login/logout flow works end-to-end
- [ ] Parallel branches don't conflict
- [ ] Traefik dashboard shows correct routes
- [ ] No `fe.*` or `be.*` in logs or UI
- [ ] Documentation updated

## Dependencies

### Internal

- Traefik must be running (`docker network ls | grep traefik-public`)
- Repository structure unchanged
- Git branch names follow conventions

### External

None (dev-only change)

## Communication Plan

### Stakeholders

- **Developers**: All team members using worktree system
- **DevOps**: (N/A, dev-only)
- **QA**: (N/A, dev-only)

### Notification

1. **Before Migration**:
   - Team announcement: "URL structure changing"
   - Migration guide: Link to this document
   - Timeline: Merge to main after testing

2. **After Migration**:
   - Update onboarding docs
   - Team demo of new URL structure
   - FAQ for common issues

## Monitoring & Metrics

### Success Metrics

- [ ] Zero CORS errors in browser console
- [ ] All API calls use `/api` prefix
- [ ] No manual URL configuration needed
- [ ] Parallel branches work without conflicts

### Failure Indicators

- CORS errors reappear
- API calls fail with 404
- Traefik routing broken
- Branch collisions occur

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Planning** | 1 hour | ADR, Impact Analysis, Migration Plan |
| **Implementation** | 2-3 hours | Code changes, testing |
| **Documentation** | 1 hour | Update all docs |
| **Verification** | 1 hour | Full testing, parallel branches |
| **Total** | 5-6 hours | |

## Appendix: File Change Summary

### Modified Files (9)

1. `docker-compose.worktree.yml` - Traefik labels, env vars
2. `tools/worktree/spawn.sh` - URL output, naming logic
3. `projects/apps/web/src/shared/config/env.ts` - API URL config
4. `projects/apps/web/src/shared/api/http.ts` - baseUrl usage
5. `README.md` - URL examples
6. `CLAUDE.md` - Configuration docs
7. `docs/00_process/development_workflow.md` - Developer guide
8. `docs/02_architecture/adr/0006_same_origin_api_routing.md` - ADR (new)
9. `docs/03_quality/0006_same_origin_impact_analysis.md` - This file (new)

### Unchanged Files

- All backend route files (`projects/apps/api/src/presentation/routes/*`)
- Backend middleware (CORS kept for compatibility)
- Database schema
- Test files (will work as-is with new URLs)

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| Routing misconfiguration | Medium | High | Pre-deployment curl tests | Dev |
| URL concatenation bugs | Low | Medium | Grep for hardcoded URLs | Dev |
| Branch name collisions | Low | Low | Sanitization function | Dev |
| Documentation drift | Medium | Low | Comprehensive doc review | Dev |
| CORS reappears | Low | Medium | Keep backend CORS | Dev |

## Conclusion

This migration is **feasible and recommended**. The architectural benefits (eliminating CORS, simplifying security, multi-repo readiness) outweigh the moderate implementation effort. The risk is manageable with proper testing, and rollback is straightforward.

**Recommendation**: Proceed with migration in feature branch, test thoroughly, then merge to main.
