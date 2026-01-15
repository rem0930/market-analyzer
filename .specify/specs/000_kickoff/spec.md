# Kickoff Spec

## Overview

| Item | Value |
|------|-------|
| Spec ID | 000_kickoff |
| Title | Repository Template Bootstrap |
| Status | In Progress |
| Author | Template Generator |
| Created | 2026-01-15 |

---

## Purpose

ドキュメント駆動開発（DocDD）をサポートする、マルチスタック対応のテンプレートリポジトリを構築する。

---

## Scope

### In Scope

- Contract パターンによる統一コマンドインターフェース
- 6つの Stack Pack（node-ts_pnpm, python_ruff_pytest, go_std, dotnet_8, java_21_gradle, rust_stable）
- DevContainer 設定
- CI/CD ワークフロー
- PR/Issue テンプレート
- DocDD 用ドキュメント構造

### Out of Scope

- 実際のプロダクト機能
- 本番デプロイ設定
- データベース設定
- 認証・認可

---

## Functional Requirements (FR)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | `./tools/contract <cmd>` で統一コマンドを実行できる | Must |
| FR-002 | `./tools/kickoff/apply_stack.sh <stack_id>` でスタックを切り替えられる | Must |
| FR-003 | DevContainer で開発環境が起動できる | Must |
| FR-004 | CI で policy check と contract smoke が実行される | Must |
| FR-005 | PR/Issue テンプレートが提供される | Should |
| FR-006 | デザインシステムのトークン定義が提供される | Should |

---

## Non-Functional Requirements (NFR)

| Category | Requirement |
|----------|-------------|
| Extensibility | 新しい Stack Pack を追加するのに15分以内 |
| Maintainability | AGENTS.md が canonical、他は差分のみ |
| Portability | VSCode, Cursor, CLI で動作 |
| Documentation | 自己文書化（ドキュメントがコードと同居） |

---

## Acceptance Criteria (AC)

- [ ] **AC-001**: `./tools/policy/check_required_artifacts.sh` が "Policy OK" を返す
- [ ] **AC-002**: 任意の Stack Pack を適用後、`./tools/contract lint/test/build` がすべて成功する
- [ ] **AC-003**: DevContainer が起動し、Contract コマンドが動作する
- [ ] **AC-004**: GitHub に push 後、CI が実行される
- [ ] **AC-005**: AGENTS.md に Golden Commands と Golden Outputs が定義されている
- [ ] **AC-006**: 初期セットアップの Runbook が存在し、手順が実行可能

---

## Architecture Notes

- ADR-0001 参照: [docs/02_architecture/adr/0001_contract_and_stack_pack.md](../../02_architecture/adr/0001_contract_and_stack_pack.md)

---

## Links

- [AGENTS.md](../../../AGENTS.md) - Canonical Instructions
- [docs/00_process/runbook_initial_setup.md](../../00_process/runbook_initial_setup.md) - 初期セットアップ Runbook
