# OpenAPI-First Workflow

## Overview

本リポジトリでは **OAS-first (OpenAPI Specification first)** を採用しています。
API の仕様を先に定義し、コード生成で型安全なクライアント/スキーマを得てから実装します。

---

## ワークフロー

```text
1. Spec 定義    → docs/02_architecture/api/*.yaml に API 仕様を記述
2. 統合         → projects/packages/api-contract/openapi.yaml に統合
3. 生成         → ./tools/contract openapi-generate で TypeScript 型を生成
4. 実装         → 生成された型を使って Backend / Frontend を実装
5. 検証         → ./tools/contract openapi-check で仕様と実装の整合性を確認
```

---

## ディレクトリ構成

| Path | Purpose |
|------|---------|
| `docs/02_architecture/api/common.yaml` | 共通スキーマ（ErrorCode, ErrorReason, 共通レスポンス） |
| `docs/02_architecture/api/<feature>.yaml` | 機能別 API 仕様 |
| `projects/packages/api-contract/openapi.yaml` | 統合された OpenAPI 仕様（Orval の入力） |
| `projects/packages/api-contract/orval.config.ts` | Orval 生成設定 |
| `projects/packages/api-contract/src/generated/` | 生成された TypeScript 型 |

---

## 新規エンドポイント追加手順

### Step 1: Spec を書く

`.specify/templates/spec-api.md` テンプレートを使用し、API Contract セクションに OpenAPI YAML スニペットを含める。

### Step 2: OpenAPI ファイルを配置

```bash
# 機能別ファイルを作成
vi docs/02_architecture/api/<feature>.yaml

# 統合ファイルに paths / schemas を追加
vi projects/packages/api-contract/openapi.yaml
```

### Step 3: 型を生成

```bash
./tools/contract openapi-generate
```

これにより `projects/packages/api-contract/src/generated/` に TypeScript 型が生成されます。

### Step 4: 生成物をフォーマット + コミット

```bash
./tools/contract format
git add projects/packages/api-contract/src/generated/
git add projects/packages/api-contract/openapi.yaml
git add docs/02_architecture/api/<feature>.yaml
git commit -m "feat(api): add <feature> OpenAPI spec and generated types"
```

---

## 既存エンドポイント変更手順

1. `docs/02_architecture/api/*.yaml` の仕様を更新
2. `projects/packages/api-contract/openapi.yaml` を更新
3. `./tools/contract openapi-generate` で再生成
4. **生成された差分を確認** — 破壊的変更がないか注意
5. Backend / Frontend のコードを生成された型に合わせて更新
6. `./tools/contract format` → コミット（generated files 含む）

---

## Orval 設定

```typescript
// projects/packages/api-contract/orval.config.ts
export default defineConfig({
  api: {
    input: './openapi.yaml',
    output: {
      mode: 'tags-split',         // タグ別にファイル分割
      target: './src/generated/api.ts',
      schemas: './src/generated/schemas',
      client: 'fetch',            // ブラウザネイティブ fetch
      baseUrl: false,             // 実行時に設定
      override: {
        mutator: {
          path: './src/http-client.ts',
          name: 'customFetch',    // カスタム HTTP クライアント
        },
      },
    },
  },
});
```

---

## チェックリスト

### 新規エンドポイント

- [ ] `docs/02_architecture/api/<feature>.yaml` に仕様を定義
- [ ] `projects/packages/api-contract/openapi.yaml` に統合
- [ ] `./tools/contract openapi-generate` で生成成功
- [ ] 生成された型を使って Backend 実装
- [ ] 生成された型を使って Frontend 実装（該当する場合）
- [ ] `./tools/contract format && ./tools/contract lint` 通過
- [ ] 生成物を含めてコミット

### 既存エンドポイント変更

- [ ] 仕様ファイルを先に更新
- [ ] 破壊的変更の有無を確認
- [ ] `./tools/contract openapi-generate` で再生成
- [ ] Backend / Frontend を更新された型に合わせて修正
- [ ] `./tools/contract typecheck` 通過（型整合性の確認）

---

## MUST NOT

| 禁止事項 | 理由 |
|----------|------|
| 手書きで HTTP クライアント型を定義 | OAS 生成物と乖離する |
| OpenAPI 仕様なしで API を実装 | DocDD / Non-negotiable #6 違反 |
| 生成物を手動編集 | 次回生成時に上書きされる |
| `openapi.yaml` 変更後に generate を忘れる | 型と仕様が不整合になる |

---

## See Also

- API 命名規約: `docs/05_development/api_standards.md`
- TDD ワークフロー: `docs/05_development/tdd_workflow.md`
- 共通エラースキーマ: `docs/02_architecture/api/common.yaml`
- Orval ドキュメント: https://orval.dev/
