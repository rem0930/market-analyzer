# Skill: Impact Analysis

## Trigger

- Spec 作成/更新の前
- アーキテクチャ変更の前
- 破壊的変更の可能性がある場合
- 複数システムに影響する変更

## Purpose

変更の影響範囲を体系的に分析し、漏れなく記録する。
**影響分析なしで実装を開始しない**。

---

## Steps

### Step 1: 変更種別の分類

まず変更の種別を特定:

| Type | Indicator | 例 |
|------|-----------|-----|
| `feature` | 新機能追加 | 新しいAPIエンドポイント |
| `enhancement` | 既存機能の拡張 | パラメータ追加 |
| `fix` | バグ修正 | 既存動作の修正 |
| `refactor` | 内部改善 | 外部動作変更なし |
| `breaking` | 破壊的変更 | API互換性なし |

```markdown
## 変更種別
- [x] feature / enhancement / fix / refactor / breaking
- 理由: [選択した理由]
```

### Step 2: 直接影響の特定

変更が直接影響するシステムを列挙:

```markdown
## 直接影響

### Frontend
- [ ] 影響なし
- [ ] あり: [具体的なコンポーネント/ページ]

### Backend
- [ ] 影響なし
- [ ] あり: [具体的なモジュール/エンドポイント]

### Database
- [ ] 影響なし
- [ ] スキーマ変更あり: [テーブル/カラム]
- [ ] データマイグレーションあり: [内容]

### API Contract
- [ ] 影響なし
- [ ] エンドポイント追加: [パス]
- [ ] エンドポイント変更: [パス]
- [ ] レスポンス形式変更: [詳細]
```

### Step 3: 間接影響の特定

依存関係を追跡:

```markdown
## 間接影響

### 依存する Spec
- [ ] なし
- [ ] あり: `.specify/specs/<id>/spec.md`

### 共有コンポーネント
- [ ] なし
- [ ] あり: [パッケージ/モジュール名]

### 外部システム
- [ ] なし
- [ ] あり: [システム名と影響]
```

### Step 4: 破壊的変更の判定

以下のいずれかに該当する場合は破壊的変更:

```markdown
## Breaking Changes チェックリスト

- [ ] API レスポンス形式の変更（フィールド削除/型変更）
- [ ] API リクエスト形式の変更（必須パラメータ追加）
- [ ] DB スキーマ変更（カラム削除/型変更）
- [ ] 環境変数の追加（新規必須）
- [ ] 認証/認可の変更
- [ ] 依存ライブラリのメジャーバージョン更新

### 判定結果
- [ ] 破壊的変更なし
- [ ] 破壊的変更あり → Migration Plan 必須
```

### Step 5: 下流依存の特定

この変更に依存する他のシステム/チームを特定:

```markdown
## Downstream Dependencies

| System | Owner | Impact | Migration Required |
|--------|-------|--------|-------------------|
| [システム名] | [担当チーム] | [影響内容] | Yes / No |
```

### Step 6: ドキュメント更新計画

影響分析の結果に基づき、更新が必要なドキュメントを特定:

```markdown
## 必要なドキュメント更新

### 必須
- [ ] Spec (`.specify/specs/<id>/spec.md`)
- [ ] Plan (`.specify/specs/<id>/plan.md`)
- [ ] Tasks (`.specify/specs/<id>/tasks.md`)

### 条件付き
- [ ] ADR (`docs/02_architecture/adr/`) - アーキ決定がある場合
- [ ] PRD (`docs/01_product/prd.md`) - 新規 FR/US の場合
- [ ] OpenAPI (`docs/02_architecture/api/`) - API 変更の場合

### リリース関連
- [ ] Release Notes - ユーザー向け変更の場合
- [ ] Migration Guide - 破壊的変更の場合
```

---

## Output Template

Spec の Impact Analysis セクションに記入するテンプレート:

```markdown
## Impact Analysis

### 変更種別
- Type: feature / enhancement / fix / refactor / breaking

### Affected Systems
- [ ] Frontend: [影響箇所]
- [ ] Backend: [影響箇所]
- [ ] Database: [スキーマ変更]
- [ ] API: [エンドポイント変更]

### Breaking Changes
- [ ] なし
- [ ] あり: [詳細と Migration Plan へのリンク]

### Downstream Dependencies
| System | Impact | Migration Required |
|--------|--------|-------------------|
| [システム] | [影響] | Yes / No |

### Required Document Updates
- [x] Spec
- [ ] Plan
- [ ] ADR
- [ ] OpenAPI
```

---

## Guardrails

| ルール | 理由 |
|--------|------|
| 影響分析なしで実装しない | 予期せぬ影響の防止 |
| 破壊的変更は明示的に宣言 | 下流チームへの周知 |
| Migration Plan は破壊的変更と同時に作成 | ロールバック可能性の確保 |

---

## Example

### シナリオ: ユーザーAPIにプロフィール画像を追加

### Step 1: 変更種別

```markdown
## 変更種別
- [x] enhancement
- 理由: 既存のユーザーAPIにフィールドを追加
```

### Step 2-3: 影響特定

```markdown
## 直接影響

### Frontend
- [x] あり: UserProfile コンポーネント、Settings ページ

### Backend
- [x] あり: UserController, UserService

### Database
- [x] スキーマ変更あり: users テーブルに avatar_url カラム追加

### API Contract
- [x] レスポンス形式変更: GET /users/:id に avatar_url 追加

## 間接影響

### 共有コンポーネント
- [x] あり: @repo/shared の User 型定義
```

### Step 4: 破壊的変更判定

```markdown
## Breaking Changes チェックリスト
- [ ] API レスポンス形式の変更 → フィールド追加のみ（後方互換）
- [x] DB スキーマ変更 → カラム追加（nullable）

### 判定結果
- [x] 破壊的変更なし（後方互換性あり）
```

### Step 5-6: 下流依存とドキュメント

```markdown
## Downstream Dependencies
| System | Owner | Impact | Migration Required |
|--------|-------|--------|-------------------|
| Mobile App | Mobile Team | User 型更新 | No (optional field) |

## 必要なドキュメント更新
- [x] Spec
- [x] Plan
- [x] OpenAPI (User スキーマ更新)
- [ ] ADR (不要)
```

---

## Related Skills

- `Skill.Read_Master_Spec`: 既存仕様の確認
- `Skill.DocDD_Spec_First`: Spec 作成
- `Skill.OpenAPI_Contract_First`: API 仕様定義

## Prompt Reference

`prompts/skills/impact_analysis.md`
