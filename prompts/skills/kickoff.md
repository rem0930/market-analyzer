# Skill: Kickoff Development Workflow

## Trigger
- 新しい開発タスクを開始するとき
- `/kickoff` コマンド実行時

## Purpose
開発を開始する前に必須のワークフローを実行し、正しい環境・手順で作業を開始する。

## Prerequisites Check

### Step 1: Worktree 環境の確認

```bash
# 現在のディレクトリが worktree かどうか確認
git worktree list
pwd
```

**判定:**
- メインリポジトリにいる場合 → Worktree を作成する必要あり
- すでに worktree にいる場合 → Step 2 へ

**Worktree が必要な場合:**
```bash
# ブランチ名を決めて worktree を作成
./tools/worktree/spawn.sh <branch-name>
# 例: ./tools/worktree/spawn.sh feat/GH-123-add-login
```

### Step 2: DevContainer 環境の確認

**判定基準:**
- `/.dockerenv` ファイルが存在する → DevContainer 内
- 環境変数 `REMOTE_CONTAINERS` が設定されている → DevContainer 内

```bash
# DevContainer 内かどうか確認
if [[ -f "/.dockerenv" ]] || [[ -n "$REMOTE_CONTAINERS" ]]; then
    echo "OK: DevContainer 内で作業中"
else
    echo "WARNING: DevContainer 外です"
    echo "Action: VS Code で 'Reopen in Container' を実行してください"
fi
```

**DevContainer 外の場合:**
1. VS Code でワークスペースを開く
2. コマンドパレット → `Dev Containers: Reopen in Container`
3. DevContainer が起動したら再度 `/kickoff` を実行

### Step 3: Contract の読み込み

```bash
# AGENTS.md を読んで制約を把握
cat AGENTS.md
```

確認すべき内容:
- Non-negotiables（絶対ルール）
- Golden Commands
- Technology Stack

### Step 4: タスク種別の判定

タスクの内容に応じて必要な DocDD 成果物を判定:

| タスク種別 | 必要な成果物 |
|-----------|-------------|
| 新機能 | Spec + Plan + Tasks + Tests |
| アーキ変更 | ADR + Impact Analysis + Migration Plan |
| UI 変更 | UI Requirements + AC update |
| バグ修正 | Issue link + Tests |

### Step 5: 開発準備完了の確認

チェックリスト:
- [ ] Worktree で作業している（main 直接編集禁止）
- [ ] DevContainer 内で作業している
- [ ] AGENTS.md の制約を把握した
- [ ] タスクに応じた DocDD 成果物を特定した

## Output

```markdown
## 開発準備状況

### 環境
- Worktree: [branch-name] ✅ / ❌ 要作成
- DevContainer: ✅ 起動中 / ❌ 要起動

### 制約の確認
- DocDD: Spec/Plan/AC なしで実装しない
- Golden Commands: `./tools/contract` 経由で実行

### このタスクで必要な成果物
- [ ] [成果物1]
- [ ] [成果物2]

### 次のステップ
1. [次にやるべきこと]
```

## Error Recovery

### Worktree 外で作業しようとした場合
```
ERROR: メインリポジトリで直接作業しようとしています。

以下のコマンドで worktree を作成してください:
    ./tools/worktree/spawn.sh <branch-name>

ブランチ命名規則:
    feat/<issue>-<slug>  例: feat/GH-123-auth-token
    fix/<issue>-<slug>   例: fix/login-null-pointer
    docs/<slug>          例: docs/api-reference
```

### DevContainer 外で作業しようとした場合
```
WARNING: DevContainer 外で作業しています。

環境差異による CI 失敗を防ぐため、DevContainer 内で作業してください:
1. VS Code でこのディレクトリを開く
2. コマンドパレット → 'Dev Containers: Reopen in Container'
```

## Related Skills
- `Skill.Read_Contract_First`: 制約の詳細把握
- `Skill.Ensure_Worktree_Context`: Worktree コンテキスト確認
- `Skill.DocDD_Spec_First`: Spec/Plan 作成

## Prompt Reference
`prompts/skills/kickoff.md`
