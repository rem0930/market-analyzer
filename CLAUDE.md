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
| **Agents** | `.claude/agents/` | 並列サブエージェント（探索/監査/テスト/レビュー/実装） |
| **Skills** | `.claude/skills/` | ドメイン知識（DDD, FSD, Security, Quality Gates） |
| **Commands** | `.claude/commands/` | スラッシュコマンド（/kickoff, /pr-check） |
| **Hooks (Post)** | `settings.json` | 自動フォーマット |

### Layer B: Defense (セキュリティ・ガードレール)

「事故を起こせない」「起きても被害半径が小さい」「監査できる」

| Component | Path | Purpose |
|-----------|------|---------|
| **Deny Rules** | `settings.json` | 絶対禁止（secrets保護、破壊的コマンド） |
| **PreToolUse Hook** | `.claude/hooks/` | 実行前ブロック |
| **Allow (minimal)** | `settings.json` | 背景サブエージェント用最小権限 |
| **DevContainer** | `.devcontainer/` | 隔離環境での実行 |

---

## Sub-Agents (Parallel by Default)

サブエージェントは **並列実行がデフォルト**。`"use proactively"` で自動委譲。

| Agent | Role | Tools | Trigger Keywords |
|-------|------|-------|------------------|
| `repo-explorer` | コードベース探索（read-only） | Read, Grep, Glob | explore, find, where, how |
| `security-auditor` | セキュリティ監査（read-only） | Read, Grep, Glob | security, audit, vulnerability |
| `test-runner` | テスト/lint実行 | Bash, Read | test, lint, typecheck, ci |
| `code-reviewer` | コードレビュー（read-only） | Read, Grep, Glob | review, PR, feedback |
| `implementer` | 実装（最小差分） | All | implement, fix, add, create |

### 並列実行例

```
User: "認証機能を追加して"

→ 並列起動:
  - repo-explorer: 既存コードを探索
  - security-auditor: 認証関連のセキュリティ確認
  - code-reviewer: 関連コードの品質確認

→ 結果を統合して implementer が実装
→ test-runner がテスト実行
```

---

## Skills

| Skill | Purpose |
|-------|---------|
| `security-baseline` | 入力検証、認証、XSS、依存関係セキュリティ |
| `ddd-clean-architecture` | レイヤー依存、境界、ドメイン純度 |
| `fsd-frontend` | Feature-Sliced Design、Next.js配置 |
| `quality-gates` | lint/test/typecheck の実行順序 |
| `repo-conventions` | リポジトリ固有のルール（DocDD, ブランチ命名） |

---

## Slash Commands

| Command | Description |
|---------|-------------|
| `/kickoff <task>` | 並列探索で開発開始 |
| `/pr-check` | レビュー/テスト/セキュリティチェック |
| `/deps-audit` | 依存関係監査 |

---

## Directory Structure

```
.claude/
├── rules/            # Always auto-applied rules
│   ├── 01-core.md        # Canonical source, non-negotiables
│   ├── 02-backend.md     # DDD + Clean Architecture
│   ├── 03-frontend.md    # Feature-Sliced Design
│   ├── 04-security.md    # Security baseline
│   └── 05-quality.md     # Quality gates
├── agents/           # Sub-agents (parallel execution)
│   ├── repo-explorer.md
│   ├── security-auditor.md
│   ├── test-runner.md
│   ├── code-reviewer.md
│   └── implementer.md
├── skills/           # Domain knowledge (injected on demand)
│   ├── security-baseline/
│   ├── ddd-clean-architecture/
│   ├── fsd-frontend/
│   ├── quality-gates/
│   └── repo-conventions/
├── commands/         # Slash commands
│   ├── kickoff.md
│   ├── pr-check.md
│   └── deps-audit.md
├── hooks/            # Pre/Post tool hooks
│   ├── pre-bash.sh
│   └── post-edit.sh
└── settings.json     # Permissions + hooks config
```

### Rules vs Skills vs prompts/skills/

| Type              | Location           | Application            | Content                       |
|-------------------|--------------------|------------------------|-------------------------------|
| **Rules**         | `.claude/rules/`   | Always auto-applied    | MUST/MUST NOT constraints     |
| **Skills**        | `.claude/skills/`  | Injected on demand     | HOW TO with code examples     |
| **Skill Prompts** | `prompts/skills/`  | Reference / manual use | Detailed procedural workflows |

**Design Principle**:

- **Rules**: Minimal constraints (what to enforce)
- **Skills**: Implementation guidance (how to do it)
- **prompts/skills/**: Detailed workflows for human reference or other AI tools

Rules reference Skills for details: `→ .claude/skills/<name>/SKILL.md`

---

## Security Configuration

### Deny Rules (DO NOT MODIFY)

Always blocked:

- **Secrets**: `.env*`, `secrets/`, `*.pem`, `*.key`
- **Destructive**: `rm -rf /`, `sudo *`, `curl | bash`
- **Exfiltration**: `echo $*_KEY*`, `printenv *SECRET*`
- **Git Dangerous**: `git push --force`, `git reset --hard`

### Allow Rules (Minimal for Background Agents)

Auto-approved:

- `./tools/contract lint/test/typecheck/build`
- `git status/diff/log`
- `pnpm audit/outdated`

### Hooks

- **PreToolUse**: Block main branch ops, force push, pipe-to-shell
- **PostToolUse**: Auto-format TypeScript files

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

# Worktree
./tools/worktree/spawn.sh <branch>
./tools/worktree/cleanup.sh

# Log Commands (for troubleshooting)
./tools/contract logs         # Show last 100 lines
./tools/contract logs:error   # Show error logs only
./tools/contract logs:tail    # Follow logs in real-time
./tools/contract logs:clear   # Clear all logs
```

---

## Error Log Troubleshooting

サーバーエラーのトラブルシュート用にログファイルが永続化されています。

### Log Locations

| Log File | Purpose | Command |
|----------|---------|---------|
| `logs/api/combined.log` | 全ログ（debug/info/warn/error） | `./tools/contract logs` |
| `logs/api/error.log` | エラーログのみ | `./tools/contract logs:error` |

### Quick Troubleshooting

```bash
# 1. 最新のエラーを確認
./tools/contract logs:error

# 2. リアルタイムでログを監視
./tools/contract logs:tail

# 3. 特定のエラーを検索
grep "INTERNAL_ERROR" logs/api/error.log

# 4. 相関IDでトレース
grep "correlationId.*abc123" logs/api/combined.log
```

### Log Format

ログは JSON 形式で出力されます：

```json
{
  "timestamp": "2026-01-20T12:34:56.789Z",
  "level": "error",
  "message": "Login failed",
  "context": {
    "error": "invalid_credentials",
    "email": "u***@e***.com"
  }
}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LOG_LEVEL` | `info` | 最小ログレベル（debug/info/warn/error） |
| `LOG_FILE_ENABLED` | `false` | ファイル出力を有効化（`true` で有効） |
| `LOG_DIR` | `./logs/api` | ログディレクトリのパス |

### Security Notes

- パスワード、トークン、API キーは自動的に `[REDACTED]` に置換
- メールアドレスは `u***@e***.com` 形式でマスク
- スタックトレースは開発環境のみ出力

---

## Workflow

1. **Read Contract First**: `AGENTS.md`
2. **DocDD**: No implementation without Spec/Plan/AC
3. **Golden Commands**: Always use `./tools/contract`
4. **Parallel Agents**: Let background agents explore/audit
5. **Minimize Diff**: Single root cause, smallest fix

---

## Context7 MCP

Use `context7` for latest library documentation:

```text
Create Prisma user table use context7
```
