# Skills Catalog

AI エージェントが適用すべき再利用可能なスキル。
各スキルは特定のトリガーで発動し、失敗パターンを先回りで防ぐ。

---

## Skill.Read_Contract_First

### Trigger
- 新タスク開始時
- リポジトリが未知の場合

### Purpose
AGENTS.md と process.md を読み、制約を把握する。

### Steps
1. `AGENTS.md` を読む
2. `docs/00_process/process.md` を読む
3. Golden Commands と Golden Outputs を把握
4. 不明点を質問するか、assumptions を docs に明記

### Output
理解した制約を短くまとめ、これからの作業の順序を提示

### Prompt Reference
`prompts/skills/read_contract_first.md`

---

## Skill.DocDD_Spec_First

### Trigger
- 機能実装のリクエスト
- アーキテクチャ変更のリクエスト

### Purpose
Spec/Plan/Tasks を先に作成してから実装に移る。

### Steps
1. `spec.md` を更新/作成（FR/NFR/AC）
2. 必要なら `plan.md` / ADR を作成
3. `tasks.md` に分解（順序・依存・リスク）

### Guardrails
- Spec/Plan/Tasks がない限り Implementer に移行しない
- AC は Given/When/Then 形式で書く

### Output
- `.specify/specs/<id>/spec.md`
- `.specify/specs/<id>/plan.md`
- `.specify/specs/<id>/tasks.md`

### Prompt Reference
`prompts/skills/docdd_spec_first.md`

---

## Skill.Minimize_Diff

### Trigger
- CI failing
- レビューフィードバック

### Purpose
原因を1つに絞り、最小差分に収束させる。

### Steps
1. 原因を1つに絞る（再現 → 影響範囲 → 最小修正）
2. 変更を分割（docs-only / code-only / refactor）
3. 不要変更を revert

### Output
最小差分 PR に収束させる

### Prompt Reference
`prompts/skills/minimize_diff.md`

---

## Skill.Fix_CI_Fast

### Trigger
- `./tools/contract <cmd>` failing

### Purpose
CI を素早く修復し、3ループで止める。

### Steps
1. 失敗ログを貼る（要点だけ）
2. 依存 → 設定 → 環境の順で切り分け
3. format → lint → typecheck → test → build の順で直す
4. 3ループで直らなければ root cause を `docs/03_quality/` に記録して止める

### Output
- 修正コミット
- 再発防止メモ

### Prompt Reference
`prompts/skills/fix_ci_fast.md`

---

## Skill.Policy_Docs_Drift

### Trigger
- コード変更時

### Purpose
必要な docs 更新を同 PR で実施する。

### Steps
1. 変更タイプを分類（arch/ui/api/db/behavior）
2. 必要な docs 更新をチェックリスト化
   - アーキ変更 → ADR 更新
   - API 変更 → API docs 更新
   - UI 変更 → UI requirements 更新
   - 振る舞い変更 → Spec/AC 更新
3. 更新が必要なら同じ PR で更新

### Output
Docs 更新漏れゼロを担保

### Prompt Reference
`prompts/skills/policy_docs_drift.md`

---

## Skill.Review_As_Staff

### Trigger
- Reviewer 起動時

### Purpose
Staff 相当の視点でレビューを行う。

### Steps
1. DocDD リンク（Spec/Plan/ADR/Impact/AC/Test/Release）を確認
2. NFR（性能/セキュリティ/運用）観点の穴を探す
3. rollback/feature flag/移行計画の妥当性を確認
4. 必要なら PR を分割提案

### Output
レビューコメント（優先度: P0/P1/P2）

### Priority Levels
| Priority | Description |
|----------|-------------|
| P0 | ブロッカー（マージ不可） |
| P1 | 重要（対応必須） |
| P2 | 推奨（対応推奨） |

### Prompt Reference
`prompts/skills/review_as_staff.md`

---

## Skill.DevContainer_Safe_Mode

### Trigger
- DevContainer/firewall の問題
- `dangerously-skip-permissions` のリクエスト

### Purpose
安全な範囲で復旧し、記録を残す。

### Steps
1. firewall allowlist を確認（`docs/devcontainer.md`）
2. doctor コマンドで原因切り分け
3. balanced へ切替が必要なら理由を docs に残す
4. 危険操作は safe プロファイルでは禁止。必要なら明示的手順に従う

### Output
- 安全な範囲での復旧手順
- 記録（なぜ問題が起きたか）

### Prompt Reference
`prompts/skills/devcontainer_safe_mode.md`

---

## Skill.OpenAPI_Contract_First

### Trigger
- HTTP API を設計するとき
- HTTP API を利用/実装するとき
- 外部 API と連携するとき

### Purpose
OpenAPI 仕様を先に定義し、ドキュメント・クライアント・サーバースタブを自動生成する。

### Steps
1. `docs/02_architecture/api/` に OpenAPI 仕様（YAML/JSON）を作成
2. 仕様をレビュー（エンドポイント/スキーマ/エラー形式）
3. コード生成ツールでクライアント/サーバースタブを生成
4. 生成されたコードをベースに実装
5. 仕様と実装の乖離をCIでチェック（lint/validation）

### Guardrails
- 手書きでHTTPクライアント/サーバーを実装しない（生成コードをベースにする）
- API変更時は必ず OpenAPI 仕様を先に更新
- 仕様と実装の乖離を許容しない

### Recommended Tools
| Language | Client Generator | Server Generator |
|----------|------------------|------------------|
| TypeScript | openapi-typescript, orval | express-openapi-validator |
| Python | openapi-python-client | FastAPI (native) |
| Go | oapi-codegen | oapi-codegen |
| Rust | openapi-generator | poem-openapi |

### Output
- `docs/02_architecture/api/*.yaml` - OpenAPI 仕様
- 生成されたクライアント/サーバーコード
- CI での仕様バリデーション設定

### Prompt Reference
`prompts/skills/openapi_contract_first.md`

---

## Quick Reference Table

| ID | Trigger | Purpose |
|----|---------|---------|
| `Skill.Read_Contract_First` | 新タスク開始時 | AGENTS.md と process.md を読み、制約を把握 |
| `Skill.DocDD_Spec_First` | 機能/アーキ変更時 | Spec/Plan/Tasks を先に作成してから実装 |
| `Skill.Minimize_Diff` | CI失敗/レビュー指摘時 | 原因を1つに絞り最小差分に収束 |
| `Skill.Fix_CI_Fast` | contract failing | 依存→設定→環境の順で切り分け、3ループで止める |
| `Skill.Policy_Docs_Drift` | コード変更時 | 必要なdocs更新を同PRで実施 |
| `Skill.Review_As_Staff` | Reviewer起動時 | DocDDリンク確認、NFR観点、rollback妥当性 |
| `Skill.DevContainer_Safe_Mode` | firewall/permission問題時 | allowlist確認、safeプロファイル維持 |
| `Skill.OpenAPI_Contract_First` | HTTP API設計/実装時 | OpenAPI仕様を先に定義、コード生成活用 |
