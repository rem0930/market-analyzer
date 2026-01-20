# Plan: Worktree + DevContainer Automation

## Overview

This plan addresses the P0 and P1 issues identified in the code review, making the worktree + DevContainer automation production-ready.

## Architecture

### Current Architecture

```
User/Agent
    ↓
spawn.sh (creates worktree, launches devcontainer)
    ↓
devcontainer CLI or init-environment.sh
    ↓
docker-compose up (db, dev, web, api)
    ↓
postCreateCommand hooks (pnpm install, db:init, git config)
    ↓
DONE (reports success immediately)
```

**Problem**: No validation that container actually started successfully.

### Target Architecture

```
User/Agent
    ↓
spawn.sh (creates worktree, launches devcontainer)
    ↓
devcontainer CLI or init-environment.sh (background with status file)
    ↓
docker-compose up (db, dev, web, api)
    ↓
postCreateCommand hooks (parallel)
    ↓
wait_for_ready() - NEW
    ├─ Poll .setup-status file
    ├─ Check container health
    ├─ Validate services ready
    └─ Timeout after 5 minutes
    ↓
DONE (success only if container healthy)
```

**Improvements**:
- Status file tracks progress (STARTING → READY/FAILED)
- Explicit health checks before success
- Cleanup on error (trap ERR)
- Detailed error messages

## Implementation Tasks

### Phase 1: Error Handling & Validation (P0 Blockers)

#### Task 1.1: Add Container Health Check Function
**File**: `tools/worktree/lib/container-health.sh` (new)

**Implementation**:
```bash
#!/usr/bin/env bash
# tools/worktree/lib/container-health.sh

check_container_health() {
    local container_id="$1"
    local max_wait="${2:-300}"  # 5 minutes default

    local start_time=$(date +%s)

    while true; do
        # Check if container exists and is running
        if ! docker ps --filter "id=${container_id}" --format "{{.ID}}" | grep -q .; then
            return 1  # Container not running
        fi

        # Check container health status (if healthcheck defined)
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "none")
        if [[ "$health" == "healthy" ]]; then
            return 0
        fi

        # If no healthcheck, check if services are ready
        if [[ "$health" == "none" ]]; then
            # Check for .dev-ready marker file
            if docker exec "$container_id" test -f /workspace/.dev-ready 2>/dev/null; then
                return 0
            fi
        fi

        # Timeout check
        local now=$(date +%s)
        local elapsed=$((now - start_time))
        if [[ $elapsed -ge $max_wait ]]; then
            return 2  # Timeout
        fi

        sleep 2
    done
}

get_container_id_by_worktree() {
    local worktree_id="$1"
    local worktree_path="$2"

    # Strategy 1: By worktree.id label
    local container_id=$(docker ps -q --filter "label=worktree.id=${worktree_id}" 2>/dev/null | head -1)
    if [[ -n "$container_id" ]]; then
        echo "$container_id"
        return 0
    fi

    # Strategy 2: By devcontainer.local_folder label
    container_id=$(docker ps -q --filter "label=devcontainer.local_folder=${worktree_path}" 2>/dev/null | head -1)
    if [[ -n "$container_id" ]]; then
        echo "$container_id"
        return 0
    fi

    # Strategy 3: By compose project name
    local safe_name=$(basename "$worktree_path" | tr '/' '-')
    container_id=$(docker ps -q --filter "label=com.docker.compose.project=${safe_name}" 2>/dev/null | head -1)
    if [[ -n "$container_id" ]]; then
        echo "$container_id"
        return 0
    fi

    return 1  # Not found
}
```

**Testing**:
- Unit test: Mock docker ps output
- Integration test: Spawn worktree, verify container detected

#### Task 1.2: Update spawn.sh with Validation
**File**: `tools/worktree/spawn.sh`

**Changes**:
1. Source container-health.sh library
2. After devcontainer launch, poll for container ID
3. Call check_container_health()
4. Update state file with container_id
5. Add cleanup trap

**Diff**:
```bash
# Around line 299-330 (after devcontainer up)

+# Source health check library
+source "${SCRIPT_DIR}/lib/container-health.sh"
+
+# Trap cleanup on error
+cleanup_on_error() {
+    log_error "Startup failed, cleaning up..."
+    if [[ -n "$container_id" ]]; then
+        docker stop "$container_id" 2>/dev/null || true
+    fi
+    git -C "${REPO_ROOT}" worktree remove --force "$worktree_path" 2>/dev/null || true
+    rm -f "$state_file"
+}
+trap cleanup_on_error ERR
+
 if command -v devcontainer &> /dev/null; then
     log_info "Launching DevContainer..."
     (
         cd "$worktree_path"
-        devcontainer up --workspace-folder . 2>&1 | while read -r line; do
-            log_info "[devcontainer] $line"
-        done
+        echo "STARTING" > .setup-status
+        if devcontainer up --workspace-folder .; then
+            echo "READY" > .setup-status
+        else
+            echo "FAILED" > .setup-status
+            exit 1
+        fi
     ) &
+    local bg_pid=$!
+
+    # Wait for container to appear (up to 60s)
+    log_info "Waiting for container to start..."
+    local wait_count=0
+    local container_id=""
+    while [[ $wait_count -lt 30 ]]; do
+        container_id=$(get_container_id_by_worktree "$worktree_id" "$worktree_path")
+        if [[ -n "$container_id" ]]; then
+            break
+        fi
+        sleep 2
+        ((wait_count++))
+    done
+
+    if [[ -z "$container_id" ]]; then
+        log_error "Container failed to start within 60 seconds"
+        wait $bg_pid || true
+        exit 1
+    fi
+
+    log_success "Container started: $container_id"
+
+    # Update state file with container ID
+    sed -i.bak "s/^container_id: \"\"/container_id: \"${container_id}\"/" "$state_file"
+    local container_name=$(docker inspect --format '{{.Name}}' "$container_id" | sed 's/^\///')
+    sed -i.bak "s/^container_name: \"\"/container_name: \"${container_name}\"/" "$state_file"
+    rm -f "${state_file}.bak"
+
+    # Wait for container to be healthy
+    log_info "Waiting for container to be ready (up to 5 minutes)..."
+    if check_container_health "$container_id" 300; then
+        log_success "Container is healthy!"
+    else
+        local exit_code=$?
+        if [[ $exit_code -eq 2 ]]; then
+            log_error "Container health check timed out after 5 minutes"
+            log_error "Check logs with: docker logs ${container_id}"
+        else
+            log_error "Container is not healthy"
+        fi
+        exit 1
+    fi
+
+    wait $bg_pid
 else
     # Fallback to init-environment.sh
     ...
 fi
+
+# Clear error trap on success
+trap - ERR
```

**Testing**:
- Scenario 1: Successful spawn → container healthy → exit 0
- Scenario 2: Container fails → cleanup triggered → exit 1
- Scenario 3: Timeout → error message → exit 1

#### Task 1.3: Update auto-setup.sh with Status File
**File**: `tools/worktree/auto-setup.sh`

**Changes** (around line 186-206):
```bash
 if command -v devcontainer &> /dev/null; then
     log_info "Starting DevContainer (this may take a few minutes)..."
     (
         cd "$worktree_path"
+        echo "STARTING" > .setup-status
         devcontainer up --workspace-folder . 2>&1 | while read -r line; do
             log_info "[devcontainer] $line"
         done
+        local exit_code=$?
+        if [[ $exit_code -eq 0 ]]; then
+            echo "READY" > .setup-status
+        else
+            echo "FAILED" > .setup-status
+            exit 1
+        fi
     ) &
+    local bg_pid=$!
+
+    # Monitor status file
+    log_info "Monitoring DevContainer startup..."
+    local wait_count=0
+    while [[ $wait_count -lt 150 ]]; do  # 5 minutes
+        if [[ -f "${worktree_path}/.setup-status" ]]; then
+            local status=$(cat "${worktree_path}/.setup-status")
+            if [[ "$status" == "READY" ]]; then
+                log_success "DevContainer ready!"
+                break
+            elif [[ "$status" == "FAILED" ]]; then
+                log_error "DevContainer startup failed"
+                wait $bg_pid || true
+                # Cleanup partial worktree
+                cd "${REPO_ROOT}"
+                git worktree remove --force "$worktree_path" 2>/dev/null || true
+                exit 1
+            fi
+        fi
+        sleep 2
+        ((wait_count++))
+    done
+
+    if [[ $wait_count -ge 150 ]]; then
+        log_error "DevContainer startup timed out"
+        exit 1
+    fi
 else
     # Fallback
     log_info "Starting environment with init-environment.sh..."
```

#### Task 1.4: Update cleanup.sh with Multi-Strategy Detection
**File**: `tools/worktree/cleanup.sh`

**Changes** (around line 52-68):
```bash
+# Source health check library for get_container_id_by_worktree
+source "${SCRIPT_DIR}/lib/container-health.sh"
+
 stop_devcontainer() {
     local worktree_path="$1"
+    local worktree_id="$2"

-    # Find container by label
-    local container_id=$(docker ps -q --filter "label=devcontainer.local_folder=${worktree_path}" 2>/dev/null | head -1)
+    # Multi-strategy container detection
+    local container_id=$(get_container_id_by_worktree "$worktree_id" "$worktree_path")

     if [[ -z "$container_id" ]]; then
-        return 0  # No container found, nothing to stop
+        # Try state file as last resort
+        local state_file="${STATE_DIR}/$(basename "${worktree_path}").yaml"
+        if [[ -f "$state_file" ]]; then
+            container_id=$(grep "^container_id:" "$state_file" | awk '{print $2}' | tr -d '"')
+        fi
+    fi
+
+    if [[ -z "$container_id" ]]; then
+        log_warn "No container found for ${worktree_path}"
+        return 0
     fi

     log_info "Stopping container: $container_id"
-    docker stop "$container_id" 2>/dev/null || true
-    docker rm "$container_id" 2>/dev/null || true
+
+    # Graceful stop with timeout
+    if docker stop -t 30 "$container_id" 2>/dev/null; then
+        log_success "Container stopped gracefully"
+    else
+        log_warn "Forcing container stop"
+        docker kill "$container_id" 2>/dev/null || true
+    fi
+
+    docker rm "$container_id" 2>/dev/null || true
 }
```

### Phase 2: Race Conditions & Idempotency (P1 Important)

#### Task 2.1: Add File Lock for ID Allocation
**File**: `tools/worktree/spawn.sh`

**Changes** (around line 80-96):
```bash
 get_next_worktree_id() {
+    local lock_file="${STATE_DIR}/.id-lock"
     mkdir -p "${STATE_DIR}"

+    # Acquire exclusive lock
+    exec 200>"$lock_file"
+    if ! flock -x -w 10 200; then
+        log_error "Failed to acquire lock for ID allocation"
+        exit 1
+    fi
+
     local max_id=0

     for f in "${STATE_DIR}"/*.yaml; do
         if [[ -f "$f" ]]; then
             local id=$(grep -E "^worktree_id:" "$f" | awk '{print $2}')
             if [[ "$id" -gt "$max_id" ]]; then
                 max_id="$id"
             fi
         fi
     done

     local new_id=$((max_id + 1))
+
+    # Release lock
+    flock -u 200
+    exec 200>&-
+
     echo "$new_id"
 }
```

**Testing**:
- Start 10 spawn.sh processes simultaneously
- Verify all get unique IDs
- Check no lock file left behind on error

#### Task 2.2: Add Database Initialization Idempotency
**File**: `.devcontainer/devcontainer.json`

**Changes** (line 14):
```json
{
  "postCreateCommand": {
    "deps": "cd /workspace/projects && pnpm install",
    "husky": "cd /workspace/projects && pnpm prepare",
    "git-config": "git config --global --add safe.directory /workspace",
    "db-init": "cd /workspace/projects && if [[ ! -f /workspace/.db-initialized ]]; then pnpm --filter @monorepo/api db:generate && pnpm --filter @monorepo/api db:push && pnpm --filter @monorepo/api db:seed && touch /workspace/.db-initialized; else echo 'Database already initialized, skipping'; fi"
  }
}
```

**New Contract Command**: `tools/contract/stack/db:reset`
```bash
#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="${REPO_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "${REPO_ROOT}/projects"

echo "Resetting database..."
rm -f /workspace/.db-initialized
pnpm --filter @monorepo/api db:generate
pnpm --filter @monorepo/api db:push
pnpm --filter @monorepo/api db:seed
touch /workspace/.db-initialized
echo "Database reset complete!"
```

### Phase 3: Health Monitoring & Diagnostics

#### Task 3.1: Create Worktree Health Check
**File**: `tools/worktree/health.sh` (new)

**Implementation**:
```bash
#!/usr/bin/env bash
# tools/worktree/health.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
STATE_DIR="${REPO_ROOT}/.worktree-state"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

source "${SCRIPT_DIR}/lib/container-health.sh"

check_worktree() {
    local worktree_path="$1"
    local state_file="${STATE_DIR}/$(basename "${worktree_path}").yaml"

    echo "Checking: $(basename "$worktree_path")"

    local issues=0

    # Check 1: Directory exists
    if [[ ! -d "$worktree_path" ]]; then
        echo -e "  ${RED}[FAIL]${NC} Directory missing"
        ((issues++))
    else
        echo -e "  ${GREEN}[OK]${NC} Directory exists"
    fi

    # Check 2: Git worktree tracked
    if ! git -C "${REPO_ROOT}" worktree list | grep -q "^${worktree_path} "; then
        echo -e "  ${YELLOW}[WARN]${NC} Not tracked by git"
        ((issues++))
    else
        echo -e "  ${GREEN}[OK]${NC} Git worktree tracked"
    fi

    # Check 3: State file exists
    if [[ ! -f "$state_file" ]]; then
        echo -e "  ${YELLOW}[WARN]${NC} No state file"
    else
        echo -e "  ${GREEN}[OK]${NC} State file exists"

        # Check 4: Container running
        local worktree_id=$(grep "^worktree_id:" "$state_file" | awk '{print $2}')
        local container_id=$(get_container_id_by_worktree "$worktree_id" "$worktree_path")

        if [[ -z "$container_id" ]]; then
            echo -e "  ${RED}[FAIL]${NC} Container not running"
            echo -e "    ${YELLOW}Fix:${NC} cd ${worktree_path} && devcontainer up --workspace-folder ."
            ((issues++))
        else
            echo -e "  ${GREEN}[OK]${NC} Container running: $container_id"

            # Check 5: Container health
            if check_container_health "$container_id" 5; then
                echo -e "  ${GREEN}[OK]${NC} Container healthy"
            else
                echo -e "  ${YELLOW}[WARN]${NC} Container not healthy"
                echo -e "    ${YELLOW}Check:${NC} docker logs $container_id"
                ((issues++))
            fi
        fi
    fi

    echo ""
    return $issues
}

main() {
    echo "=== Worktree Health Check ==="
    echo ""

    local total_issues=0

    while IFS= read -r line; do
        local worktree_path=$(echo "$line" | awk '{print $1}')
        if [[ "$worktree_path" == "${REPO_ROOT}" ]]; then
            continue  # Skip main repo
        fi

        check_worktree "$worktree_path" || true
        ((total_issues += $?))
    done < <(git -C "${REPO_ROOT}" worktree list 2>/dev/null)

    echo "=== Summary ==="
    if [[ $total_issues -eq 0 ]]; then
        echo -e "${GREEN}All worktrees healthy!${NC}"
        exit 0
    else
        echo -e "${RED}Found $total_issues issue(s)${NC}"
        exit 1
    fi
}

main "$@"
```

**Testing**:
- Create 3 worktrees (1 healthy, 1 no container, 1 missing directory)
- Run health.sh
- Verify correct status and suggested fixes

### Phase 4: Integration Tests

#### Task 4.1: Create Test Framework
**File**: `tests/worktree/integration/test-framework.sh` (new)

**Implementation**:
```bash
#!/usr/bin/env bash
# Simple test framework for worktree integration tests

TESTS_PASSED=0
TESTS_FAILED=0

assert_success() {
    local cmd="$1"
    local desc="$2"

    if eval "$cmd" &>/dev/null; then
        echo "[PASS] $desc"
        ((TESTS_PASSED++))
        return 0
    else
        echo "[FAIL] $desc"
        echo "  Command: $cmd"
        ((TESTS_FAILED++))
        return 1
    fi
}

assert_file_exists() {
    local file="$1"
    local desc="${2:-File $file should exist}"

    if [[ -f "$file" ]]; then
        echo "[PASS] $desc"
        ((TESTS_PASSED++))
        return 0
    else
        echo "[FAIL] $desc"
        ((TESTS_FAILED++))
        return 1
    fi
}

cleanup_test_worktrees() {
    local pattern="$1"
    git worktree list | grep "$pattern" | awk '{print $1}' | while read -r path; do
        git worktree remove --force "$path" 2>/dev/null || true
    done
}

report_results() {
    echo ""
    echo "=== Test Results ==="
    echo "Passed: $TESTS_PASSED"
    echo "Failed: $TESTS_FAILED"

    if [[ $TESTS_FAILED -eq 0 ]]; then
        echo "All tests passed!"
        exit 0
    else
        echo "Some tests failed!"
        exit 1
    fi
}
```

#### Task 4.2: Create Test Suite
**File**: `tests/worktree/integration/test-spawn-and-cleanup.sh` (new)

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../.." && pwd)"

source "${SCRIPT_DIR}/test-framework.sh"

# Test 1: Basic spawn
echo "Test 1: Basic spawn"
cleanup_test_worktrees "test-basic"
"${REPO_ROOT}/tools/worktree/spawn.sh" implementer test-basic
assert_file_exists "${REPO_ROOT}/worktrees/test-basic/.worktree-context.yaml" "Context file created"
assert_file_exists "${REPO_ROOT}/.worktree-state/test-basic.yaml" "State file created"

# Test 2: Parallel spawns (unique IDs)
echo "Test 2: Parallel spawns"
cleanup_test_worktrees "test-parallel"
(
    "${REPO_ROOT}/tools/worktree/spawn.sh" implementer test-parallel-1 &
    "${REPO_ROOT}/tools/worktree/spawn.sh" implementer test-parallel-2 &
    "${REPO_ROOT}/tools/worktree/spawn.sh" implementer test-parallel-3 &
    wait
)
local id1=$(grep "worktree_id:" "${REPO_ROOT}/.worktree-state/test-parallel-1.yaml" | awk '{print $2}')
local id2=$(grep "worktree_id:" "${REPO_ROOT}/.worktree-state/test-parallel-2.yaml" | awk '{print $2}')
local id3=$(grep "worktree_id:" "${REPO_ROOT}/.worktree-state/test-parallel-3.yaml" | awk '{print $2}')

if [[ "$id1" != "$id2" ]] && [[ "$id2" != "$id3" ]] && [[ "$id1" != "$id3" ]]; then
    echo "[PASS] Parallel spawns have unique IDs"
    ((TESTS_PASSED++))
else
    echo "[FAIL] Parallel spawns have duplicate IDs: $id1, $id2, $id3"
    ((TESTS_FAILED++))
fi

# Test 3: Cleanup
echo "Test 3: Cleanup"
"${REPO_ROOT}/tools/worktree/cleanup.sh" --all
assert_success "[[ ! -d ${REPO_ROOT}/worktrees/test-basic ]]" "test-basic worktree removed"

report_results
```

## File Changes Summary

### New Files
- `tools/worktree/lib/container-health.sh` - Container health checking utilities
- `tools/worktree/health.sh` - Worktree health check command
- `tools/contract/stack/db:reset` - Database reset command
- `tests/worktree/integration/test-framework.sh` - Test utilities
- `tests/worktree/integration/test-spawn-and-cleanup.sh` - Integration tests
- `.specify/specs/worktree-devcontainer-automation/spec.md` - This specification
- `.specify/specs/worktree-devcontainer-automation/plan.md` - This plan

### Modified Files
- `tools/worktree/spawn.sh` - Add health checks, error handling, container ID tracking
- `tools/worktree/cleanup.sh` - Multi-strategy container detection
- `tools/worktree/auto-setup.sh` - Status file monitoring
- `.devcontainer/devcontainer.json` - Idempotent database initialization

## Testing Strategy

### Unit Tests
- Test get_container_id_by_worktree() with mocked docker ps
- Test check_container_health() with mocked docker inspect
- Test file lock acquisition/release

### Integration Tests
- Test complete spawn → work → cleanup lifecycle
- Test parallel spawns (unique IDs, no conflicts)
- Test error scenarios (container fails, timeout)
- Test cleanup with running containers
- Test health check on mixed worktrees

### Manual Testing
1. Spawn 5 worktrees in parallel
2. Kill one container manually
3. Run health.sh to detect issue
4. Run cleanup.sh --all to verify zero orphans

## Rollout Plan

### Phase 1: Foundation (Days 1-2)
- Create container-health.sh library
- Add health checks to spawn.sh
- Update cleanup.sh with multi-strategy detection
- **Deliverable**: spawn.sh validates container startup

### Phase 2: Robustness (Days 3-4)
- Add file locks for ID allocation
- Add status file monitoring to auto-setup.sh
- Add database initialization idempotency
- **Deliverable**: Parallel spawns work reliably

### Phase 3: Observability (Days 5-6)
- Create health.sh command
- Add db:reset contract command
- Improve error messages
- **Deliverable**: Users can diagnose issues

### Phase 4: Testing (Days 7-8)
- Create test framework
- Write integration tests
- Run CI tests
- **Deliverable**: 100% test coverage

### Phase 5: Documentation (Days 9-10)
- Update tools/worktree/README.md with troubleshooting
- Add architecture diagrams
- Document port allocation strategy
- **Deliverable**: Production-ready documentation

## Success Criteria

- [ ] `spawn.sh` exits with error if container fails (no silent failures)
- [ ] 10 parallel spawns complete with unique IDs and no conflicts
- [ ] `health.sh` accurately reports status of all worktrees
- [ ] `cleanup.sh --all` leaves zero orphaned containers
- [ ] Integration tests pass in CI
- [ ] Database initialization is idempotent (container restart preserves data)
- [ ] All scripts have trap ERR for cleanup on failure

## Risks

1. **Docker daemon instability**: Mitigation: Retry transient errors
2. **Breaking existing workflows**: Mitigation: Backward compatibility, feature flags
3. **Performance regression**: Mitigation: Benchmark spawn time before/after
4. **State file corruption**: Mitigation: Add checksum validation

## Rollback Plan

If critical issues found after merge:
1. Revert to previous spawn.sh/cleanup.sh
2. Keep spec.md and plan.md for future attempt
3. Document lessons learned in ADR

## Future Enhancements (Out of Scope)

- Worktree templates (pre-configured environments)
- Metrics collection (spawn time, failure rate)
- Web dashboard for worktree status
- Remote worktree support (Docker context)
