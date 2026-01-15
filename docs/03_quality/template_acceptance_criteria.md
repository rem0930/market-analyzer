# Template Acceptance Criteria

このテンプレートリポジトリ自体の受入基準です。

---

## Must (必須)

### Infrastructure

- [ ] DevContainer が起動できる
- [ ] CI が通る（policy + contract smoke）
- [ ] `tools/contract` スクリプトが実行可能

### Documentation

- [ ] `AGENTS.md` が存在し、Golden Commands/Outputs が定義されている
- [ ] `docs/00_process/process.md` が存在し、プロセスが定義されている
- [ ] `docs/01_product/identity.md` が存在する
- [ ] `docs/01_product/prd.md` が存在する
- [ ] `docs/02_architecture/adr/` に最低1つの ADR がある
- [ ] `docs/03_quality/template_acceptance_criteria.md` が存在する（このファイル）
- [ ] `docs/04_delivery/release_process.md` が存在する

### Tooling

- [ ] `./tools/contract format` が実行できる
- [ ] `./tools/contract lint` が実行できる
- [ ] `./tools/contract test` が実行できる
- [ ] `./tools/contract build` が実行できる

### Stack Packs

- [ ] 最低1つの Stack Pack が存在する
- [ ] `./tools/kickoff/apply_stack.sh <stack_id>` でスタックを適用できる
- [ ] 適用後、Contract コマンドが動作する

### GitHub

- [ ] PR テンプレートが存在する
- [ ] Issue テンプレートが存在する
- [ ] CI workflow が存在する

---

## Should (推奨)

- [ ] すべての6スタック（node-ts_pnpm, python_ruff_pytest, go_std, dotnet_8, java_21_gradle, rust_stable）が揃っている
- [ ] 各 Stack Pack の scaffold でテストが通る
- [ ] `./tools/contract e2e` が（no-op でも）提供されている
- [ ] デザインシステムのトークン定義がある

---

## Nice to Have

- [ ] Worktree 管理スクリプトがある
- [ ] 複数の PR テンプレートタイプ（Spec/Plan/Implement/Release）がある
- [ ] エージェント用プロンプトが同梱されている

---

## Verification Steps

1. **DevContainer 起動確認**
   ```bash
   # VSCode/Cursor で "Reopen in Container" を実行
   # エラーなく起動することを確認
   ```

2. **Stack 適用確認**
   ```bash
   ./tools/kickoff/apply_stack.sh node-ts_pnpm
   cat .repo/active-stack  # "node-ts_pnpm" と表示される
   ```

3. **Contract コマンド確認**
   ```bash
   ./tools/contract lint
   ./tools/contract test
   ./tools/contract build
   # すべて成功することを確認
   ```

4. **Policy 確認**
   ```bash
   ./tools/policy/check_required_artifacts.sh
   # "Policy OK" と表示される
   ```

---

## Links

- [docs/03_quality/verification_runbook.md](verification_runbook.md) - 詳細な検証手順
- [AGENTS.md](../../AGENTS.md) - Canonical Instructions
