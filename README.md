# {{project.name}}

{{project.short_description}}

> **Note**: このテンプレートを使用する際は、上記のプレースホルダを実際の値に置き換えてください。

---

## 🚀 Quickstart

### 1. テンプレートから新規リポジトリを作成

```bash
# GitHub で "Use this template" をクリック
# または
gh repo create my-project --template matsuokah/vibecoding-repository-template
```

### 2. 初期セットアップ (Kickoff)

```bash
# Stack を選択して適用
./tools/kickoff/apply_stack.sh node-ts_pnpm  # または他の stack_id

# DevContainer を起動（VSCode / Cursor）
# Command Palette > "Dev Containers: Reopen in Container"
```

### 3. 開発開始

```bash
# Golden Commands で開発
./tools/contract lint
./tools/contract test
./tools/contract build
```

---

## 📚 Documentation

| Category | Path | Description |
|----------|------|-------------|
| Process | [docs/00_process/](docs/00_process/) | 開発プロセス・Runbook |
| Product | [docs/01_product/](docs/01_product/) | PRD・要件・デザイン |
| Architecture | [docs/02_architecture/](docs/02_architecture/) | ADR・構造・影響分析 |
| Quality | [docs/03_quality/](docs/03_quality/) | テスト計画・品質基準 |
| Delivery | [docs/04_delivery/](docs/04_delivery/) | リリースプロセス |

---

## 🛠 Available Stack Packs

| Stack ID | Language | Description |
|----------|----------|-------------|
| `node-ts_pnpm` | TypeScript | Node.js + pnpm workspace |
| `python_ruff_pytest` | Python | pyproject + ruff + pytest |
| `go_std` | Go | go mod + go test |
| `dotnet_8` | C# | .NET 8 + xUnit |
| `java_21_gradle` | Java | Java 21 + Gradle + JUnit |
| `rust_stable` | Rust | cargo + clippy |

---

## 📋 Repository Contract

- **Canonical Instructions**: [AGENTS.md](AGENTS.md)
- **Active Stack**: `.repo/active-stack`
- **Golden Commands**: `./tools/contract <cmd>`

### Golden Commands

```bash
./tools/contract format      # フォーマット
./tools/contract lint        # 静的解析
./tools/contract typecheck   # 型チェック
./tools/contract test        # ユニットテスト
./tools/contract build       # ビルド
./tools/contract e2e         # E2E テスト
./tools/contract migrate     # DB マイグレーション
./tools/contract deploy-dryrun  # デプロイドライラン
```

---

## 🔧 For Template Maintainers

### Adding a New Stack Pack

1. `stacks/<new_stack_id>/` ディレクトリを作成
2. `manifest.yaml` を定義
3. `devcontainer/devcontainer.json` を作成
4. `contract/` に必要なスクリプトを配置
5. `scaffold/` に初期ファイルを配置

詳細は [docs/02_architecture/repo_structure.md](docs/02_architecture/repo_structure.md) を参照。

---

## 📄 License

{{license}}
