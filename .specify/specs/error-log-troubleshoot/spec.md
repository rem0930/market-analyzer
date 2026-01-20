# Spec: Error Log Troubleshoot for Coding Agent

## Metadata

- **ID**: error-log-troubleshoot
- **Status**: Draft
- **Created**: 2026-01-20
- **Updated**: 2026-01-20

---

## Parent Documents

| Document | Path | Reference |
|----------|------|-----------|
| PRD | `docs/01_product/prd.md` | Developer Experience |
| Identity | `docs/01_product/identity.md` | 開発効率化 |
| Related ADR | TBD: `docs/02_architecture/adr/0006_structured_logging.md` | Structured Logging Strategy |

---

## Overview

Coding Agent（Claude Code など）がバックエンド・フロントエンドサーバーのエラーログを効率的にトラブルシュートできるようにする機能。エラーログをファイルに永続化し、ログの場所を明確化し、Agent がすぐにアクセスできる仕組みを提供する。

---

## Impact Analysis

### Affected Systems

- [x] Frontend: Next.js の error boundary でのログ出力先変更
- [x] Backend: Express/Node.js サーバーのログ出力先・フォーマット変更
- [ ] Database: スキーマ変更なし
- [ ] API: エンドポイント変更なし

### Breaking Changes

- [x] なし（追加機能のみ）

### Downstream Dependencies

| System | Impact | Migration Required |
|--------|--------|-------------------|
| DevContainer | ログ用 volume マウント追加 | No |
| Docker Compose | ログディレクトリ設定追加 | No |
| CLAUDE.md | ログ場所のドキュメント追加 | No |

---

## Functional Requirements (FR)

### FR-001: ログファイルへの永続化

サーバーのエラーログをファイルに永続的に保存する。

- バックエンド（API）のログを `logs/api/` に出力
- フロントエンド（Web）のログを `logs/web/` に出力
- ログレベル別にファイルを分離（error.log, combined.log）
- JSON 形式で構造化されたログを出力

### FR-002: ログローテーション

ディスク容量を保護するため、ログローテーションを実装する。

- 日次または 10MB でローテーション
- 最大 7 日分（または 100MB）を保持
- 古いログは自動削除

### FR-003: ログの場所の明確化

Coding Agent がログを見つけやすいようにドキュメント化する。

- CLAUDE.md にログファイルの場所を記載
- ログ確認用の Golden Command を追加（`./tools/contract logs`）
- DevContainer 内からのアクセスパスを明示

### FR-004: エラーコンテキストの充実

Agent がトラブルシュートしやすいよう、エラーログにコンテキスト情報を追加する。

- リクエスト ID（相関 ID）
- タイムスタンプ（ISO 8601）
- エラーコード
- スタックトレース（開発環境のみ）
- 影響を受けたコンポーネント/レイヤー

### FR-005: Agent 用ログアクセスコマンド

Coding Agent が簡単にログを確認できるコマンドを提供する。

- `./tools/contract logs` - 最新のログを表示
- `./tools/contract logs:error` - エラーログのみ表示
- `./tools/contract logs:tail` - リアルタイムでログを追跡

---

## Non-Functional Requirements (NFR)

### NFR-001: Performance

- ログ出力によるリクエストレイテンシ増加は 1ms 以下
- 非同期書き込みを使用してブロッキングを防止

### NFR-002: Security

- パスワード、トークン、API キー、PII をログに出力しない
- ログファイルの権限は 600（所有者のみ読み書き）
- ログディレクトリの権限は 700（所有者のみアクセス）
- シークレットフィールドは自動的にサニタイズ

### NFR-003: Availability

- ログ出力の失敗がアプリケーションをクラッシュさせない
- ディスクフルの場合は graceful に警告を出力し、古いログを削除

### NFR-004: Maintainability

- 既存の構造化ロガー（`infrastructure/logger`）を拡張
- Clean Architecture のレイヤー境界を維持

---

## Acceptance Criteria (AC)

### AC-001: バックエンドエラーログのファイル出力

**Given** API サーバーが起動している
**When** API エンドポイントでエラーが発生する
**Then** `logs/api/error.log` に JSON 形式でエラーが記録される

### AC-002: ログローテーション動作

**Given** ログファイルが 10MB に達した
**When** 新しいログエントリが追加される
**Then** 新しいログファイルが作成され、古いファイルは `.1` サフィックスでアーカイブされる

### AC-003: シークレットのサニタイズ

**Given** エラーコンテキストに `password` フィールドが含まれる
**When** ログが出力される
**Then** `password` の値は `[REDACTED]` に置換される

### AC-004: ログ確認コマンド

**Given** DevContainer 内で作業している
**When** `./tools/contract logs:error` を実行する
**Then** 最新のエラーログが表示される

### AC-005: ログ場所のドキュメント

**Given** Coding Agent が CLAUDE.md を読む
**When** ログファイルの場所を探す
**Then** `logs/api/` と `logs/web/` のパスが明記されている

### AC-006: 相関 ID によるトレース

**Given** フロントエンドからバックエンドへのリクエストが発生
**When** エラーが発生する
**Then** 同じ相関 ID でフロントエンド・バックエンド両方のログを追跡できる

---

## Out of Scope

- 外部ログ集約サービス（Datadog, CloudWatch）への連携
- 分散トレーシング（OpenTelemetry）の完全実装
- ログベースのアラート機能
- Web UI でのログビューワー

---

## Assumptions

- DevContainer 環境で開発を行う
- Docker volume でログを永続化できる
- Coding Agent は Bash コマンドでファイルを読める
- 開発環境のみを対象とする（本番環境は別途検討）

---

## Code Map

| Requirement | Module | File(s) | Test |
|-------------|--------|---------|------|
| FR-001 | logger | `projects/apps/api/src/infrastructure/logger/file-transport.ts` | `__tests__/file-transport.test.ts` |
| FR-002 | logger | `projects/apps/api/src/infrastructure/logger/rotation.ts` | `__tests__/rotation.test.ts` |
| FR-003 | docs | `CLAUDE.md`, `tools/_contract/stack/logs.sh` | Manual verification |
| FR-004 | logger | `projects/apps/api/src/infrastructure/logger/sanitizer.ts` | `__tests__/sanitizer.test.ts` |
| FR-005 | tools | `tools/_contract/stack/logs.sh` | Manual verification |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-20 | Claude | Initial spec |
