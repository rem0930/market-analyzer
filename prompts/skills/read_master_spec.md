# Skill: Read Master Spec

## Trigger

- 既存機能の変更・拡張リクエスト
- 「〜を修正して」「〜を追加して」などの変更要求
- バグ修正（仕様確認が必要な場合）

## Purpose

変更を加える前に、既存の Spec を読み、現在の仕様を正確に把握する。
**仕様を知らずにコードを変更することは禁止**。

---

## Steps

### Step 1: 関連 Spec を特定

```bash
# 既存の Spec 一覧を確認
ls -la .specify/specs/

# 関連する Spec を特定（キーワード検索）
grep -r "キーワード" .specify/specs/
```

**確認ポイント**:
- 変更対象の機能に対応する Spec があるか
- 親子関係のある Spec があるか

### Step 2: 現在の仕様を読む

```bash
cat .specify/specs/<id>/spec.md
```

**読み取る項目**:

| セクション | 確認内容 |
|------------|----------|
| Parent Documents | この Spec の出処（PRD, ADR） |
| Impact Analysis | 現在の影響範囲 |
| FR | 現在の機能要件 |
| NFR | 現在の非機能要件 |
| AC | 現在の受入基準 |
| Code Map | 実装箇所とテスト |

### Step 3: 関連ドキュメントを確認

Spec が参照している親ドキュメントも確認:

```bash
# PRD を確認
cat docs/01_product/prd.md | grep -A 10 "FR-XXX"

# 関連 ADR を確認
cat docs/02_architecture/adr/XXXX.md
```

### Step 4: 変更の影響を評価

既存の仕様に対する変更の影響を整理:

```markdown
## 変更影響評価

### 既存 FR への影響
- FR-001: [なし / 変更 / 削除]
- FR-002: [なし / 変更 / 削除]

### 新規 FR
- [追加する FR があれば記載]

### 既存 AC への影響
- AC-001: [なし / 変更 / 削除]
- AC-002: [なし / 変更 / 削除]

### 新規 AC
- [追加する AC があれば記載]

### 既存 Code Map への影響
- [影響を受けるファイル]
- [追加が必要なテスト]
```

### Step 5: 差分をまとめる

Spec 更新のための差分を整理:

```markdown
## Spec 更新計画

### 変更種別
- [ ] 新機能追加（新規 FR）
- [ ] 既存機能の拡張（FR 更新）
- [ ] バグ修正（AC の明確化）
- [ ] 非機能要件の追加/変更（NFR 更新）

### 変更内容
| セクション | Before | After |
|------------|--------|-------|
| FR-001 | [現状] | [変更後] |
| AC-001 | [現状] | [変更後] |

### 破壊的変更
- [ ] なし
- [ ] あり: [詳細]
```

---

## Output

このスキル実行後に得られるもの:

1. **既存仕様の理解** - 現在の FR/NFR/AC を把握
2. **変更影響の可視化** - 何が変わるかを明確化
3. **Spec 更新準備** - 更新計画の策定

---

## Guardrails

| ルール | 理由 |
|--------|------|
| Spec を読まずにコード変更しない | 仕様不整合のリスク |
| 変更は必ず Spec に反映 | ドキュメントとコードの乖離防止 |
| 破壊的変更は明示 | 下流への影響を周知 |

---

## Example

### ユーザーリクエスト

> 「ログイン機能にリメンバーミー機能を追加して」

### Step 1: Spec 特定

```bash
ls .specify/specs/
# → login/ がある
```

### Step 2: 現在の仕様を読む

```bash
cat .specify/specs/login/spec.md
# FR-002: ログイン
# - 認証成功時に JWT トークンを発行
# - リフレッシュトークン有効期限: 7日
```

### Step 3: 変更影響評価

```markdown
## 変更影響評価

### 既存 FR への影響
- FR-002: 変更（リメンバーミーオプションを追加）

### 新規 AC
- AC-011: リメンバーミー有効時は有効期限を30日に延長

### Code Map への影響
- src/auth/login.ts に rememberMe パラメータ追加
- tests/auth/login.test.ts にテストケース追加
```

### Step 4: Spec 更新計画

```markdown
## Spec 更新計画

### 変更種別
- [x] 既存機能の拡張（FR 更新）

### 変更内容
| セクション | Before | After |
|------------|--------|-------|
| FR-002 | JWT発行のみ | rememberMe オプション追加 |
| NFR-002 | リフレッシュ7日 | rememberMe時は30日 |
| AC | 9項目 | 10項目（AC-011追加） |
```

---

## Related Skills

- `Skill.Impact_Analysis`: 影響分析の詳細手順
- `Skill.DocDD_Spec_First`: Spec 作成の詳細手順
- `Skill.Policy_Docs_Drift`: ドキュメント更新漏れ検出

## Prompt Reference

`prompts/skills/read_master_spec.md`
