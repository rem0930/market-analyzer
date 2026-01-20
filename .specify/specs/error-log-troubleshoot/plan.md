# Plan: Error Log Troubleshoot for Coding Agent

## Metadata

- **Spec**: `.specify/specs/error-log-troubleshoot/spec.md`
- **Status**: Draft
- **Created**: 2026-01-20

---

## Implementation Approach

### Strategy: 既存ロガーの拡張 + ファイルトランスポート追加

既存の構造化ロガー（`infrastructure/logger/index.ts`）を拡張し、ファイル出力機能を追加する。Clean Architecture を維持し、Infrastructure 層のみを変更する。

### Why This Approach

1. **既存コードの活用**: 構造化 JSON ロガーが既に存在
2. **最小差分**: 新規パッケージ導入なしで実現可能
3. **Clean Architecture 準拠**: Infrastructure 層のみの変更
4. **テスト容易性**: ファイルトランスポートを DI 可能に設計

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  (Controllers, Middleware - エラー発生時に logger 呼出)  │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   Logger    │──│  Sanitizer  │──│ File Transport  │ │
│  │  (既存拡張)  │  │   (新規)    │  │    (新規)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     File System                          │
│  logs/api/error.log, logs/api/combined.log              │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: ログ基盤の構築（優先度: 高）

#### Task 1.1: ログサニタイザーの実装

**File**: `projects/apps/api/src/infrastructure/logger/sanitizer.ts`

```typescript
// 機密フィールドを [REDACTED] に置換
const SENSITIVE_FIELDS = [
  'password', 'secret', 'token', 'apiKey', 'api_key',
  'accessToken', 'refreshToken', 'jwt', 'authorization',
  'privateKey', 'private_key', 'credential'
];

export function sanitize(context: Record<string, unknown>): Record<string, unknown>;
```

#### Task 1.2: ファイルトランスポートの実装

**File**: `projects/apps/api/src/infrastructure/logger/file-transport.ts`

```typescript
// ファイルへの非同期書き込み
export interface FileTransportOptions {
  directory: string;
  filename: string;
  maxSize: number;      // bytes
  maxFiles: number;
}

export class FileTransport {
  write(entry: LogEntry): Promise<void>;
  rotate(): Promise<void>;
}
```

#### Task 1.3: 既存ロガーの拡張

**File**: `projects/apps/api/src/infrastructure/logger/index.ts`

- `FileTransport` をオプショナルに追加
- `sanitize()` を log() 内で呼び出し
- 環境変数 `LOG_FILE_ENABLED=true` で有効化

### Phase 2: ログディレクトリ設定（優先度: 高）

#### Task 2.1: ログディレクトリの作成

**Files**:
- `logs/.gitkeep` (空ディレクトリ保持用)
- `.gitignore` に `logs/*.log` を追加

#### Task 2.2: Docker Compose 設定

**File**: `docker-compose.worktree.yml`

```yaml
services:
  api:
    volumes:
      - ./logs/api:/workspace/logs/api
    environment:
      - LOG_FILE_ENABLED=true
      - LOG_DIR=/workspace/logs/api
```

#### Task 2.3: DevContainer 設定

**File**: `.devcontainer/devcontainer.json`

- ログディレクトリのマウント確認
- 権限設定（postCreateCommand で chmod）

### Phase 3: ログコマンドの実装（優先度: 中）

#### Task 3.1: Golden Command の追加

**File**: `tools/_contract/stack/logs.sh`

```bash
#!/usr/bin/env bash
# ./tools/contract logs [options]

case "${1:-}" in
  "")       tail -n 100 logs/api/combined.log ;;
  "error")  tail -n 100 logs/api/error.log ;;
  "tail")   tail -f logs/api/combined.log ;;
  "clear")  truncate -s 0 logs/api/*.log ;;
esac
```

#### Task 3.2: Contract スクリプト更新

**File**: `tools/_contract/contract`

- `logs` コマンドを追加

### Phase 4: ドキュメント更新（優先度: 中）

#### Task 4.1: CLAUDE.md 更新

```markdown
## Error Logs for Troubleshooting

| Log File | Purpose | Command |
|----------|---------|---------|
| `logs/api/error.log` | API エラーログ | `./tools/contract logs:error` |
| `logs/api/combined.log` | API 全ログ | `./tools/contract logs` |

### Quick Troubleshooting

1. 最新エラーを確認: `./tools/contract logs:error`
2. リアルタイム監視: `./tools/contract logs:tail`
3. ログクリア: `./tools/contract logs:clear`
```

#### Task 4.2: ADR 作成

**File**: `docs/02_architecture/adr/0006_structured_logging.md`

- 構造化ログの設計決定を記録

### Phase 5: 相関 ID の実装（優先度: 低）

#### Task 5.1: 相関 ID ミドルウェア

**File**: `projects/apps/api/src/presentation/middleware/correlation-middleware.ts`

```typescript
// X-Correlation-Id ヘッダーを生成/伝播
export function correlationMiddleware(req, res, next): void;
```

#### Task 5.2: フロントエンド対応

**File**: `projects/apps/web/src/shared/lib/api-client.ts`

- API クライアントに相関 ID ヘッダー追加

---

## File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `projects/apps/api/src/infrastructure/logger/sanitizer.ts` | シークレットサニタイズ |
| `projects/apps/api/src/infrastructure/logger/file-transport.ts` | ファイル出力 |
| `tools/_contract/stack/logs.sh` | ログ確認コマンド |
| `logs/.gitkeep` | ログディレクトリ |
| `docs/02_architecture/adr/0006_structured_logging.md` | ADR |

### Modified Files

| File | Changes |
|------|---------|
| `projects/apps/api/src/infrastructure/logger/index.ts` | ファイルトランスポート統合 |
| `docker-compose.worktree.yml` | ログ volume 追加 |
| `.gitignore` | `logs/*.log` 追加 |
| `CLAUDE.md` | ログ場所ドキュメント |
| `tools/_contract/contract` | logs コマンド追加 |

---

## Testing Strategy

### Unit Tests

- `sanitizer.test.ts`: 機密フィールドのサニタイズ
- `file-transport.test.ts`: ファイル書き込み、ローテーション

### Integration Tests

- ログファイルへの実際の出力確認
- ローテーション動作確認

### Manual Verification

- `./tools/contract logs` コマンドの動作確認
- DevContainer 内でのログアクセス確認

---

## Rollback Plan

1. `LOG_FILE_ENABLED=false` で機能を無効化
2. ファイルトランスポートは DI で差し替え可能
3. 既存の stdout/stderr 出力は維持

---

## Dependencies

- 外部パッケージ追加: なし（Node.js 標準 fs/path を使用）
- 既存機能への影響: なし（追加機能のみ）

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: ログ基盤 | 3-4 hours |
| Phase 2: ディレクトリ設定 | 1-2 hours |
| Phase 3: コマンド実装 | 1-2 hours |
| Phase 4: ドキュメント | 1 hour |
| Phase 5: 相関 ID | 2-3 hours |
| **Total** | **8-12 hours** |

---

## Checklist

- [ ] Spec 承認済み
- [ ] セキュリティレビュー完了（PII/シークレット保護）
- [ ] テスト計画作成
- [ ] 実装完了
- [ ] Golden Commands で品質確認
- [ ] ドキュメント更新
- [ ] PR 作成
