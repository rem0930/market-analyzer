# Claude Code Notes

**Canonical instructions are in `AGENTS.md`.**

If anything conflicts, follow `AGENTS.md`.

---

## Sub-Agents 🤖

Claude Code には、タスクに応じて自動起動する専用サブエージェントが設定されています。

### 利用可能なサブエージェント

| エージェント | 用途 | 起動例 |
|-------------|------|-------|
| 🛠️ Implementer | 機能実装、バグ修正 | "ユーザー認証を実装して" |
| 🏗️ Architect | ADR作成、設計 | "キャッシュ戦略のADRを作成" |
| 🧪 QA Tester | テスト計画、品質保証 | "AC-001のテスト計画を作成" |
| 👀 Code Reviewer | PRレビュー | "このPRをレビューして" |
| 🎨 Product Designer | UX/UI設計 | "ログイン画面のUXフローを設計" |
| 📋 Product Manager | 要件定義、Spec作成 | "ユーザー登録機能のSpecを作成" |

### 自動ルーティング

Claude は自動的に適切なサブエージェントを選択します：

```
👤 User: "PRをレビューしてください"
🤖 Claude: Code Reviewer サブエージェントを起動...
```

### 手動起動

特定のサブエージェントを明示的に呼び出すこともできます：

```
/agent Implementer ログイン機能を実装
```

### サブエージェントの利点

1. **コンテキスト分離**: 各タスクが独立したコンテキストで実行
2. **専門性**: 役割に特化したプロンプトとツールセット
3. **効率化**: 並列実行により複数タスクを同時進行可能

詳細は `.claude/agents/README.md` を参照してください。

---

## Autonomy Configuration

| Setting | Value |
|---------|-------|
| `risk_profile` | `safe` |
| `allow_auto_commit` | `true` |
| `allow_auto_pr` | `true` |
| `dangerously_skip_permissions` | `false` |

**safe モード**: 自動実行はするが、以下は明示承認が必要:
- force push
- main/master への直接 push
- 既存ファイルの削除
- セキュリティ設定の変更

---

## Security Configuration (Permission Rules)

### 設定ファイル

| ファイル | スコープ | 用途 |
|---------|---------|------|
| `.claude/settings.json` | リポジトリ共有 | deny ルール（secrets 保護、危険コマンド禁止） |
| `.claude/settings.local.json` | 個人（.gitignore 対象） | allow/ask ルール（日常作業用） |

### deny ルール（settings.json で定義）

以下の操作は **常にブロック** されます：

**ファイルアクセス禁止:**
- `.env`, `.env.*`, `.env.local` の Read/Edit/Write
- `secrets/` ディレクトリ配下
- `*.pem`, `*.key`, `*.p12`, `*.pfx`（秘密鍵）
- `credentials*`, `*secret*`, `*credential*`

**危険な Bash コマンド禁止:**
- `rm -rf /`, `rm -rf ~/`（破壊的削除）
- `sudo *`（特権昇格）
- `curl | bash`, `wget | sh`（リモートスクリプト実行）
- `cat */.env*`, `cat */secrets/*`（secrets 表示）
- `echo $*_KEY*`, `echo $*_SECRET*` 等（環境変数出力）
- `printenv *KEY*`, `env > *`（環境変数ダンプ）

### allow ルール（settings.local.json で定義）

以下は **確認なしで実行可能**：

- `./tools/contract *`（Golden Commands）
- `./tools/worktree/*`, `./tools/policy/*`
- git 読み取り系（status, diff, log, branch, fetch, rev-parse, worktree list）
- docker 読み取り系（ps, logs, inspect, network ls/inspect, volume ls, compose ps/logs）
- ファイル確認系（ls, tree, wc, xxd）

### ask ルール（settings.local.json で定義）

以下は **毎回確認** されます：

- git 書き込み系（add, commit, push, checkout, switch, stash, pull, clean, worktree add/remove）
- GitHub CLI（gh pr create/list）
- docker 操作系（exec, stop, rm, restart, cp, volume rm, compose up/down/restart）
- パッケージ管理（pnpm install, pnpm --filter, npx）
- 権限変更（chmod）

### 運用ガイドライン

1. **deny は変更しない**: settings.json の deny は全員に適用される安全弁
2. **allow は最小限に**: 必要になったら ask → allow に昇格を検討
3. **新しいツール追加時**: まず ask で運用し、安全が確認できたら allow に

---

## DevContainer Notes

- firewall allowlist 確認: `docs/devcontainer.md` を参照
- 問題時は `Skill.DevContainer_Safe_Mode` に従う
- `dangerously-skip-permissions` は devcontainer の firewall 前提でのみ許容

---

## 並列開発環境 (Git Worktree + Traefik)

### 自動起動
このプロジェクトを開くと `scripts/init-environment.sh` が実行され、環境が自動起動します。

### 手動起動
```bash
./scripts/init-environment.sh
```

### Worktree 作成
```bash
git worktree add ../feature-x feature-x
cd ../feature-x
# VS Code または Claude Code で開くと自動的に環境が起動
```

### アクセスURL
- Frontend: `http://fe.<worktree名>.localhost`
- Backend: `http://be.<worktree名>.localhost`
- Traefik Dashboard: `http://localhost:8080`

### 停止
```bash
./scripts/down.sh
```

### 仕組み
- **ルートリポジトリ**: Traefik のみ起動
- **Worktree**: Traefik確認 + 開発サービス（frontend/backend）起動
- 各 worktree は独立した Docker Compose プロジェクトとして管理
- Traefik により動的なルーティングを実現

---

## Quick Reference

```bash
# Golden Commands (always use these)
./tools/contract format
./tools/contract lint
./tools/contract typecheck
./tools/contract test
./tools/contract build
./tools/contract guardrail
./tools/contract e2e
./tools/contract migrate
./tools/contract deploy-dryrun

# Development server
./tools/contract dev
./tools/contract dev:stop
./tools/contract dev:logs

# Policy check
./tools/policy/check_required_artifacts.sh
./tools/policy/check_docdd_minimum.sh
./tools/policy/check_instruction_consistency.sh
```

## Key Paths

- Process docs: `docs/00_process/`
- Product docs: `docs/01_product/`
- Architecture: `docs/02_architecture/`
- Quality: `docs/03_quality/`
- Delivery: `docs/04_delivery/`
- Application code: `projects/`
- Agent Prompts: `prompts/agents/`
- Skill Prompts: `prompts/skills/`

## Workflow

1. **Read Contract First**: `AGENTS.md` と `docs/00_process/process.md` を読む
2. **DocDD**: Spec/Plan/Tasks なしで実装を開始しない
3. **Golden Commands**: 必ず `./tools/contract` 経由で実行
4. **Docs Drift**: コード変更時は関連 Docs も更新
5. **Minimize Diff**: CI 失敗時は原因を1つに絞り最小差分で修正

---

## Context7 MCP (最新ドキュメント参照)

ライブラリやフレームワークの実装時は **必ず context7 を使用** して最新のドキュメントを参照すること。
これにより、古いAPIや非推奨パターンの混入を防ぐ。

### 使い方

プロンプトに `use context7` を含めるか、以下のように明示的に指定:

```text
Prismaでユーザーテーブルを作成して use context7
```

### 自動適用ルール

以下のケースでは context7 の使用を強く推奨:

- 新しいライブラリの導入時
- 既存ライブラリのアップデート後
- API実装・クライアント生成時
- 設定ファイルの作成時

### 設定

MCP設定は `.mcp.json` に定義済み。追加設定不要。

