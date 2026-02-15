# Market Analyzer

小売業者向けの地理空間マーケット分析プラットフォーム。地図ベースで自店舗・競合店・商圏・人口動態を一元管理し、データドリブンな出店判断を支援します。

---

## 🛠 Technology Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Runtime    | Node.js 24+                                             |
| Language   | TypeScript (strict mode)                                |
| Package    | pnpm (workspace)                                        |
| Backend    | Express.js + Prisma + PostgreSQL                        |
| Frontend   | Next.js 16 (App Router) + React 19 + Tailwind CSS      |
| Map        | Mapbox GL JS + react-map-gl                             |
| Auth       | JWT (RS256) + bcrypt                                    |
| Validation | Zod                                                     |
| Testing    | Vitest + Testing Library                                |
| Infra      | Docker Compose + Traefik (Same-Origin)                  |

---

## 🚀 Quickstart

### 1. リポジトリをクローン

```bash
git clone https://github.com/rem0930/market-analyzer.git
cd market-analyzer
```

### 2. DevContainer を起動

```bash
# VSCode / Cursor で開く
# Command Palette > "Dev Containers: Reopen in Container"
```

### 3. 依存関係をインストール

```bash
cd projects
pnpm install
```

### 4. 開発開始

```bash
# Golden Commands で開発
./tools/contract lint
./tools/contract test
./tools/contract build
```

---

## 📚 Documentation

| Category     | Path                                         | Description                  |
| ------------ | -------------------------------------------- | ---------------------------- |
| Process      | [docs/00_process/](docs/00_process/)         | 開発プロセス・Runbook        |
| Product      | [docs/01_product/](docs/01_product/)         | PRD・要件・デザイン          |
| Architecture | [docs/02_architecture/](docs/02_architecture/) | ADR・構造・影響分析          |
| Quality      | [docs/03_quality/](docs/03_quality/)         | テスト計画・品質基準         |
| Delivery     | [docs/04_delivery/](docs/04_delivery/)       | リリースプロセス             |

---

## 📋 Repository Contract

- **Canonical Instructions**: [AGENTS.md](AGENTS.md)
- **Golden Commands**: `./tools/contract <cmd>`

### Golden Commands

```bash
./tools/contract format      # フォーマット
./tools/contract lint        # 静的解析
./tools/contract typecheck   # 型チェック
./tools/contract test        # ユニットテスト
./tools/contract build       # ビルド
./tools/contract guardrail   # アーキテクチャガードレール
./tools/contract e2e         # E2E テスト
./tools/contract dev         # 開発サーバー起動
./tools/contract dev:stop    # 開発サーバー停止
./tools/contract dev:logs    # 開発サーバーログ
```

---

## 🌐 Same-Origin Architecture

このプロジェクトはフロントエンドとバックエンドで統一ドメインを使用します：

- **Application**: `http://${branch}.market-analyzer.localhost`
- **API**: `http://${branch}.market-analyzer.localhost/api/*`

フロントエンドとバックエンドが同じオリジンを共有することで、CORS の複雑さを排除します。

### Why Same-Origin?

- CORS 設定不要
- シンプルなセキュリティ（SameSite=Strict cookies）
- 開発・テスト用の単一 URL
- マルチリポジトリ対応（フロントエンド/バックエンド分離可能）

詳細は [ADR-0006](docs/02_architecture/adr/0006_same_origin_api_routing.md) を参照してください。

---

## 📁 Project Structure

```
.
├── projects/                 # アプリケーションコード
│   ├── apps/                 # アプリケーション
│   │   ├── api/              # Backend API (Express + Prisma)
│   │   └── web/              # Frontend (Next.js + React)
│   └── packages/             # 共有パッケージ
│       ├── shared/           # 共通ドメイン・ユーティリティ
│       └── guardrails/       # アーキテクチャガードレール
├── docs/                     # ドキュメント
├── tools/                    # 開発ツール
│   ├── contract/             # Golden Commands
│   ├── policy/               # ポリシーチェック
│   └── worktree/             # Worktree 管理
├── prompts/                  # AI エージェント用プロンプト
│   ├── agents/               # エージェント別プロンプト
│   └── skills/               # 再利用可能スキル
└── .claude/                  # Claude Code 設定
    ├── agents/               # Sub-Agent 定義
    └── commands/             # カスタムコマンド
```

---

## 🤖 AI Agent Support

このリポジトリは AI エージェント（GitHub Copilot, Claude Code）による自動化をサポートしています。

### Claude Code Sub-Agents（並列実行）

Claude Code を使用している場合、以下のサブエージェントが **並列実行** で自動的に利用可能です：

| Agent              | Purpose            | Mode             |
| ------------------ | ------------------ | ---------------- |
| `repo-explorer`    | コードベース探索   | read-only, 並列  |
| `security-auditor` | セキュリティ監査   | read-only, 並列  |
| `test-runner`      | テスト/lint 実行   | 自動実行         |
| `code-reviewer`    | コードレビュー     | read-only, 並列  |
| `implementer`      | 最小差分実装       | メイン作業       |

詳細は [AGENTS.md](AGENTS.md) および [ADR-0005](docs/02_architecture/adr/0005_claude_code_subagents.md) を参照してください。

---

## 📄 License

MIT
