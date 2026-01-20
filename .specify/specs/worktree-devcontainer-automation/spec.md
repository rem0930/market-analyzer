# Spec: Worktree + DevContainer Automation

## Problem Statement

**ID**: worktree-devcontainer-automation
**Status**: Implementation
**Priority**: P0 (Critical Infrastructure)

### Background

The repository enforces a worktree-based development workflow (Non-negotiable #1 in AGENTS.md):
- All changes must occur in dedicated worktrees (not on main/master directly)
- Each worktree must run in an isolated DevContainer environment
- All development commands must execute inside the DevContainer

**Current Pain Points:**

1. DevContainer startup is not validated - scripts report success even when containers fail
2. Background processes (devcontainer up, init-environment.sh) have no error monitoring
3. Container detection for cleanup is fragile (label-based only)
4. Race conditions in worktree ID allocation can cause port conflicts
5. Database initialization runs on every container rebuild (data loss)
6. No integration tests for the worktree/DevContainer lifecycle

### Problem

**For AI Agents:**
- Silent failures mean agents work in broken environments without knowing
- Orphaned containers consume resources and cause port conflicts
- Inconsistent state makes parallel agent work unreliable

**For Developers:**
- Manual recovery required when DevContainer fails
- No health checks to diagnose environment issues
- Unclear troubleshooting procedures

### Goal

Make the worktree + DevContainer automation **production-ready** with:
- Reliable container startup validation
- Robust error handling and recovery
- Clear health status and diagnostics
- Comprehensive testing

## Requirements

### Functional Requirements

#### FR1: DevContainer Startup Validation
**Priority**: P0 (Blocker)

**Current**: `spawn.sh:314` reports success immediately after launching devcontainer, without validating actual startup.

**Required**:
- Wait for container to reach healthy state before reporting success
- Validate all postCreateCommand hooks completed successfully
- Check that services (db, web, api) are ready
- Timeout after 5 minutes with clear error message

**Success Criteria**:
- `spawn.sh` exits with error code 1 if container fails to start
- User receives actionable error message (e.g., "DB connection failed: check DATABASE_URL")
- State file status reflects actual container health

#### FR2: Background Process Error Handling
**Priority**: P0 (Blocker)

**Current**: `auto-setup.sh:186-206` runs devcontainer in background with no failure tracking.

**Required**:
- Capture background process exit codes
- Write status to `.setup-status` file (STARTING, READY, FAILED)
- Main process waits for READY or FAILED before continuing
- Failed startups trigger cleanup of partial state

**Success Criteria**:
- If devcontainer fails, auto-setup.sh returns error and cleans up worktree
- Users never enter broken worktree environments
- Clear distinction between "container starting" and "container ready"

#### FR3: Multi-Strategy Container Detection
**Priority**: P0 (Blocker)

**Current**: `cleanup.sh:61` uses only Docker labels for container detection.

**Required**:
- Try multiple strategies in order:
  1. Docker label `worktree.id=<id>`
  2. Docker label `devcontainer.local_folder=<path>`
  3. State file `container_id` field
  4. Docker compose project name
- Update state file with actual container ID after startup
- Graceful handling when no container found

**Success Criteria**:
- `cleanup.sh --all` removes all worktree containers, zero orphans
- Containers detectable even after devcontainer CLI upgrade changes labels
- State files always contain accurate container_id

#### FR4: Atomic Worktree ID Allocation
**Priority**: P1 (Important)

**Current**: `spawn.sh:86-96` calculates max ID without locking, causing race conditions.

**Required**:
- Use file lock (`flock`) during ID allocation
- Atomic read-modify-write for max ID calculation
- Release lock after ID assigned and state file created

**Success Criteria**:
- 10 parallel `spawn.sh` invocations get unique IDs
- No port conflicts from duplicate IDs
- Lock released even on error (cleanup in trap)

#### FR5: Database Initialization Idempotency
**Priority**: P1 (Important)

**Current**: `devcontainer.json:14` runs db:generate, db:push, db:seed on every postCreateCommand.

**Required**:
- Check for `/workspace/.db-initialized` marker file
- Skip db operations if marker exists
- Create marker only after successful seed
- Provide `./tools/contract db:reset` to re-initialize

**Success Criteria**:
- First container start: DB initialized
- Container restart: DB preserved, no re-seed
- `db:reset` command: Marker removed, full re-init on next start

#### FR6: Container Health Monitoring
**Priority**: P1 (Important)

**Required**:
- New command: `./tools/worktree/health.sh`
- Checks for each worktree:
  - Directory exists
  - Git worktree tracked
  - Container running
  - Services healthy (db, web, api)
  - Port bindings active
- Output: table with status per worktree

**Success Criteria**:
- `health.sh` shows clear HEALTHY/DEGRADED/FAILED per worktree
- Suggests fixes for failed worktrees
- Exits with error code 1 if any worktree unhealthy

### Non-Functional Requirements

#### NFR1: Performance
- Worktree spawn: < 2 minutes (container build cached)
- Worktree spawn (cold): < 5 minutes (including pnpm install)
- Health check: < 10 seconds
- Cleanup: < 30 seconds per worktree

#### NFR2: Scalability
- Support at least 10 concurrent worktrees
- Port allocation: 3000-65535 range (up to 625 worktrees with 100-port ranges)
- Disk space: Warn if < 10GB available

#### NFR3: Observability
- All scripts log to stderr with timestamps
- State files include created_at, updated_at
- Container logs accessible via `./tools/contract up:logs`
- Clear error messages with remediation steps

#### NFR4: Reliability
- Graceful degradation when devcontainer CLI missing
- Automatic retry for transient Docker errors
- Cleanup on error (trap ERR in all scripts)
- State file validation on startup

## Out of Scope

- Changing port allocation strategy (stays 100-port ranges)
- Multi-host worktree support (single machine only)
- Worktree templates (future enhancement)
- Metrics/telemetry collection (future enhancement)

## User Stories

### US1: AI Agent Parallel Development
**As an** AI agent orchestrator
**I want** to spawn multiple worktrees in parallel
**So that** different agents can work simultaneously without conflicts

**Acceptance Criteria**:
- Spawn 5 worktrees in parallel, all succeed
- Each gets unique ID and port range
- No race conditions or partial failures

### US2: Developer Environment Recovery
**As a** developer
**I want** to diagnose and fix broken worktree environments
**So that** I can resume work without manual Docker commands

**Acceptance Criteria**:
- Run `./tools/worktree/health.sh` to see status
- Health check suggests fixes (e.g., "run ./tools/contract up")
- Clear instructions for manual recovery

### US3: Safe Worktree Cleanup
**As a** developer
**I want** to clean up merged worktrees automatically
**So that** I don't accumulate stale environments

**Acceptance Criteria**:
- `./tools/worktree/cleanup.sh --merged` removes only merged branches
- Stops containers gracefully (SIGTERM → 30s → SIGKILL)
- No orphaned containers or volumes

## Success Metrics

- **Reliability**: 0 silent failures in CI (errors always propagated)
- **Observability**: 100% of spawn failures have actionable error messages
- **Cleanup**: 0 orphaned containers after `cleanup.sh --all`
- **Performance**: 95% of spawns complete in < 2 minutes (cached)
- **Testing**: 100% coverage of worktree lifecycle in integration tests

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Docker daemon crash during spawn | Low | High | Retry logic, cleanup trap |
| Disk full during container build | Medium | High | Pre-check disk space, warn at 10GB |
| Port conflicts with other apps | Low | Medium | Document port ranges, make configurable |
| Race in parallel spawns | Medium | Medium | File locks, atomic ID allocation |
| State file corruption | Low | High | Add checksum, validate on load |

## Dependencies

- Docker >= 20.10
- docker-compose >= 2.0
- bash >= 4.0
- flock (util-linux)
- devcontainer CLI (optional, fallback to init-environment.sh)

## References

- [AGENTS.md](../../../AGENTS.md) - Repository contract
- [spawn.sh](../../../tools/worktree/spawn.sh) - Current implementation
- [cleanup.sh](../../../tools/worktree/cleanup.sh) - Current cleanup logic
- [devcontainer.json](../../../.devcontainer/devcontainer.json) - Container config
