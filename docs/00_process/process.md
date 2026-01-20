# Development Process (DocDD)

このリポジトリは **Document-Driven Development (DocDD)** を採用しています。
すべての変更は、ドキュメント（Spec / Plan / AC）から始まります。

---

## Stages

```
1. Product Identity / PRD
       ↓
2. Spec (FR / NFR / AC)
       ↓
3. Plan (Architecture / ADR / Impact)
       ↓
4. Contract Definition (OpenAPI / Test Design)
       ↓
5. Tasks (Implementation Plan)
       ↓
6. Implement (テストを通す実装)
       ↓
7. QA Evidence
       ↓
8. Release Plan / Delivery
```

**テストファースト原則**: ユニットテストなき実装は正解がわからない

---

## Stage Details

### 1. Product Identity / PRD

**目的**: プロダクトの方向性を定義する

**成果物**:
- [docs/01_product/identity.md](../01_product/identity.md) - Vision / Mission / Principles
- [docs/01_product/prd.md](../01_product/prd.md) - Product Requirements Document

### 2. Spec (FR / NFR / AC)

**目的**: 機能要件・非機能要件・受入基準を明確にする

**成果物**:
- `.specify/specs/<feature_id>/spec.md`

**必須項目**:
- Functional Requirements (FR)
- Non-Functional Requirements (NFR)
- Acceptance Criteria (AC)

### 3. Plan (Architecture / ADR / Impact)

**目的**: 技術的な設計と影響範囲を明確にする

**成果物**:

- [docs/02_architecture/adr/](../02_architecture/adr/) - Architecture Decision Records
- Impact Analysis（必要に応じて）

### 4. Contract Definition (OpenAPI / Test Design)

**目的**: 実装の「正解」を先に定義する（テストファースト原則）

**なぜ重要か**:

- ユニットテストなき実装は正解がわからない
- API 仕様なき実装はフロントエンド/バックエンドの認識がずれる

**成果物**:

- `docs/02_architecture/api/*.yaml` - OpenAPI 仕様（API がある場合）
- `projects/**/tests/` - ユニットテスト（テストケースを先に定義）
- 型定義の生成（`./tools/contract generate-api`）

**手順**:

1. OpenAPI 仕様を定義（→ `Skill.OpenAPI_Contract_First`）
2. ユニットテストを作成（期待する振る舞いを定義）
3. 統合テストを作成（E2E シナリオを定義）

### 5. Tasks (Implementation Plan)

**目的**: 実装タスクを分解し、見積もりを行う

**成果物**:

- GitHub Issues / Project Board
- タスク分解（1 タスク = 1 PR が理想）
- 各タスクと対応するテストの紐付け

### 6. Implement (テストを通す実装)

**目的**: 定義済みテストを通すコードを実装する

**手順**:

1. 赤（テスト失敗）を確認
2. 最小限の実装でテストを通す
3. リファクタリング

**必須**:

```bash
./tools/contract format
./tools/contract lint
./tools/contract test
./tools/contract build
```

### 7. QA Evidence

**目的**: 受入基準を満たしていることを証明する

**成果物**:

- テスト結果のスクリーンショット / ログ
- AC チェックリストの完了

### 8. Release Plan / Delivery

**目的**: 安全にリリースする

**成果物**:
- [docs/04_delivery/release_process.md](../04_delivery/release_process.md)
- リリースノート

---

## Required Artifacts per Change Type

| Change Type | Required Artifacts |
| ----------- | ------------------ |
| **新機能** | Spec + Plan + OpenAPI/Tests (先) + Tasks + Impl |
| **アーキ変更** | ADR + Impact Analysis + Migration Plan |
| **UI 変更** | UI Requirements + AC update + Design system update |
| **バグ修正** | Issue link + Tests + (Spec update if behavior change) |
| **リファクタリング** | ADR (why) + Tests (no behavior change) |
| **依存更新** | Changelog review + Tests |

---

## PR Checklist

- [ ] Spec が存在し、AC が定義されている
- [ ] 関連する Docs が更新されている
- [ ] `./tools/contract lint` が通る
- [ ] `./tools/contract test` が通る
- [ ] `./tools/contract build` が通る
- [ ] PR テンプレが埋められている

---

## DocDD ワークフロー（詳細手順）

再現性を高めるための詳細なワークフロー手順。

### Step 0: マスタードキュメント確認

新規タスク・変更要求を受けたら、**まず以下を読む**:

1. `docs/01_product/prd.md` - 関連する FR/US を特定
2. `docs/01_product/identity.md` - プロダクト原則との整合性確認
3. 既存 Spec（変更の場合）- `.specify/specs/<id>/spec.md`

**変更タスクの場合は `Skill.Read_Master_Spec` を実行**

### Step 1: 影響分析

`Skill.Impact_Analysis` を参考に:

1. 影響を受けるシステムを列挙（Frontend / Backend / Database / API）
2. 破壊的変更の有無を判定
3. 下流の依存関係を特定

### Step 2: Spec 作成/更新

`.specify/templates/spec.md` テンプレートに従って:

1. **Metadata** を記入（ID, Status, 日付）
2. **Parent Documents** をリンク（PRD, Identity, ADR）
3. **Impact Analysis** を記入（影響範囲、破壊的変更）
4. **FR/NFR/AC** を定義（BDD形式: Given/When/Then）
5. **Code Map** を予測記入（実装予定ファイルとテスト）

### Step 3: Plan & Tasks 作成

`.specify/templates/` のテンプレートに従って:

1. `plan.md` - アーキテクチャと実装方針
2. `tasks.md` - タスク分解（テストファースト、1タスク=1PR）

### Step 4: マスタードキュメント更新

変更が PRD レベルの場合:

1. `docs/01_product/prd.md` の FR/US を更新
2. ADR が必要なら `docs/02_architecture/adr/` に追加

**コードを変更する前にドキュメントを更新する**

### Step 5: 実装

テストファースト原則に従い:

1. **テストを先に書く**（AC と対応）
2. 最小限の実装でテストを通す
3. リファクタリング
4. `./tools/contract` で品質チェック

---

## Templates

Spec / Plan / Tasks のテンプレートは以下を参照:

- `.specify/templates/spec.md` - Spec テンプレート
- `.specify/templates/plan.md` - Plan テンプレート
- `.specify/templates/tasks.md` - Tasks テンプレート

---

## Links

- [AGENTS.md](../../AGENTS.md) - Canonical Instructions
- [docs/03_quality/template_acceptance_criteria.md](../03_quality/template_acceptance_criteria.md) - Template AC
- [docs/04_delivery/release_process.md](../04_delivery/release_process.md) - Release Process
