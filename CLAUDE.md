# Claude Code Notes

**Canonical instructions are in `AGENTS.md`.**

If anything conflicts, follow `AGENTS.md`.

---

## Configuration Architecture (2-Layer Design)

Claude Code の設定は **2 レイヤー** で構成されています。

### Layer A: Offense (速度と品質を同時に上げる)

「Claude が迷わない」「毎回同じ手順で終わる」「品質ゲートが自動で掛かる」

| Component | Path | Purpose |
|-----------|------|---------|
| **Rules** | `.claude/rules/` | 常設コンテキスト（メモリ階層） |
| **Commands** | `.claude/commands/` | カスタム slash commands |
| **Skills** | `.claude/skills/` | 再利用可能な知識・手順 |
| **Hooks (Post)** | `settings.json` | 自動フォーマット・lint |
| **Agents** | `.claude/agents/` | タスク特化サブエージェント |

### Layer B: Defense (セキュリティ・ガードレール)

「事故を起こせない」「起きても被害半径が小さい」「監査できる」

| Component | Path | Purpose |
|-----------|------|---------|
| **Deny Rules** | `settings.json` | 絶対禁止（secrets保護、破壊的コマンド） |
| **PreToolUse Hook** | `.claude/hooks/` | 実行前ブロック |
| **DevContainer** | `.devcontainer/` | 隔離環境での実行 |
| **Ask Rules** | `settings.local.json` | 確認が必要な操作 |

---

## Directory Structure

```
.claude/
├── agents/                    # Sub-agents (task-specific)
│   ├── architect.md
│   ├── implementer.md
│   ├── reviewer.md
│   └── ...
├── commands/                  # Slash commands (/kickoff, /review)
│   ├── kickoff.md
│   ├── review.md
│   ├── fix-ci.md
│   └── spec.md
├── rules/                     # Persistent context rules
│   ├── 00-core.md            # Non-negotiables
│   ├── 01-typescript.md      # TypeScript conventions
│   ├── 02-api.md             # API development
│   └── 03-frontend.md        # Frontend conventions
├── skills/                    # Reusable skills
│   ├── minimize-diff/
│   ├── docdd-spec-first/
│   └── guardrails/
├── hooks/                     # Execution hooks
│   ├── pre-bash.sh           # PreToolUse: block dangerous ops
│   └── post-edit.sh          # PostToolUse: auto-format
├── settings.json              # Layer B: deny rules + hooks
└── settings.local.json.template  # Layer A: allow/ask template
```

---

## Sub-Agents

| Agent | Purpose | Trigger Example |
|-------|---------|-----------------|
| Implementer | Feature implementation, bug fixes | "Implement user auth" |
| Architect | ADR creation, system design | "Create caching ADR" |
| QA Tester | Test planning, quality assurance | "Create test plan for AC-001" |
| Code Reviewer | PR reviews, code quality | "Review this PR" |
| Product Designer | UX/UI design | "Design login flow" |
| Product Manager | Requirements, Spec creation | "Create user registration spec" |

---

## Slash Commands

| Command | Description |
|---------|-------------|
| `/kickoff <task>` | Start development workflow |
| `/review [pr]` | Review code with Staff perspective |
| `/fix-ci [error]` | Fix CI failures with minimal diff |
| `/spec <feature>` | Create DocDD specification |

---

## Security Configuration

### Deny Rules (settings.json) - DO NOT MODIFY

Always blocked:

- **Secrets**: `.env*`, `secrets/`, `*.pem`, `*.key`, `credentials*`
- **Destructive**: `rm -rf /`, `sudo *`, `curl | bash`
- **Exfiltration**: `echo $*_KEY*`, `printenv *SECRET*`, `env > *`
- **Git Dangerous**: `git push --force`, `git reset --hard`

### Allow Rules (settings.local.json) - Personal

Auto-approved:

- `./tools/contract *` (Golden Commands)
- `git status/diff/log` (read-only)
- `docker ps/logs` (read-only)

### Ask Rules (settings.local.json) - Confirm Each Time

- `git add/commit/push` (write operations)
- `docker compose up/down` (container lifecycle)
- `pnpm install` (dependency changes)

### Setup

```bash
cp .claude/settings.local.json.template .claude/settings.local.json
```

---

## Hooks

### PreToolUse (pre-bash.sh)

- Block main/master branch operations
- Block force push
- Warn about raw commands (use `./tools/contract`)

### PostToolUse (post-edit.sh)

- Auto-format TypeScript files after edit

---

## Quick Reference

```bash
# Golden Commands
./tools/contract format
./tools/contract lint
./tools/contract typecheck
./tools/contract test
./tools/contract build
./tools/contract guardrail

# Development
./tools/contract dev
./tools/contract dev:stop

# Worktree
./tools/worktree/spawn.sh <branch>
./tools/worktree/cleanup.sh
```

---

## Key Paths

| Category | Path |
|----------|------|
| Process | `docs/00_process/` |
| Product | `docs/01_product/` |
| Architecture | `docs/02_architecture/` |
| Quality | `docs/03_quality/` |
| Code | `projects/` |
| Agent Prompts | `prompts/agents/` |
| Skill Prompts | `prompts/skills/` |

---

## Workflow

1. **Read Contract First**: `AGENTS.md` + `docs/00_process/process.md`
2. **DocDD**: No implementation without Spec/Plan/AC
3. **Golden Commands**: Always use `./tools/contract`
4. **Docs Drift**: Update docs with code changes
5. **Minimize Diff**: Single root cause, smallest fix

---

## Context7 MCP

Use `context7` for latest library documentation:

```text
Create Prisma user table use context7
```

Recommended for:
- New library introduction
- Library updates
- API implementation
- Config file creation
