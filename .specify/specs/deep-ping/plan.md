# Plan: Deep Ping Page

## Architecture Overview

```
┌─────────────────┐     HTTP GET      ┌─────────────────┐
│   Web Frontend  │ ───────────────▶  │   Backend API   │
│   /ping page    │                   │  /ping/deep     │
└─────────────────┘                   └────────┬────────┘
                                               │
                                               ▼
                                      ┌─────────────────┐
                                      │   Health Check  │
                                      │   - Server      │
                                      │   - Database    │
                                      └─────────────────┘
```

## Components

### Backend (projects/apps/api)

| Component | Location | Description |
|-----------|----------|-------------|
| DeepPingController | `src/presentation/controllers/deep-ping-controller.ts` | HTTP リクエスト処理 |
| DeepPingUseCase | `src/usecase/health/deep-ping.ts` | ビジネスロジック（各サービスのチェック） |
| Router update | `src/presentation/router.ts` | `/ping/deep` ルート追加 |

### Frontend (projects/apps/web)

| Component | Location | Description |
|-----------|----------|-------------|
| PingPage | `src/app/ping/page.tsx` | ページコンポーネント |
| usePing hook | `src/features/health/model/usePing.ts` | ping 実行・状態管理 |
| PingResult UI | `src/features/health/ui/PingResult.tsx` | 結果表示コンポーネント |

## Data Flow

### Request Flow

1. ユーザーが `/ping` ページで「Ping」ボタンをクリック
2. `usePing` フックが `GET /ping/deep` を呼び出す
3. バックエンドの `DeepPingController` がリクエストを受信
4. `DeepPingUseCase` が各サービスの疎通を確認
   - Server: 自身の状態（常に OK）
   - Database: Prisma 経由で `SELECT 1` を実行
5. レスポンスを JSON で返却
6. フロントエンドが結果を表示

### Response Schema

```json
{
  "status": "ok" | "degraded" | "error",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "totalLatencyMs": 45,
  "checks": [
    {
      "name": "server",
      "status": "ok",
      "latencyMs": 1
    },
    {
      "name": "database",
      "status": "ok",
      "latencyMs": 44,
      "message": "Connected to PostgreSQL"
    }
  ]
}
```

## Dependencies

### Backend

- 既存の Prisma クライアント（`src/infrastructure/database/client.ts`）
- 既存のルーター（`src/presentation/router.ts`）

### Frontend

- 既存の HTTP クライアント（`src/shared/api/http.ts`）
- 既存の UI コンポーネント（Button 等）

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| DB 接続失敗時にサーバー全体がクラッシュ | High | try-catch で適切にエラーハンドリング |
| 頻繁な ping によるリソース消費 | Medium | レートリミット（オプション）、フロントエンドで連打防止 |
| 機密情報の漏洩 | High | エラーメッセージに接続文字列等を含めない |

## Rollback Strategy

- 新規エンドポイント・ページの追加のみで既存機能に影響なし
- ロールバック時は PR を revert するだけで対応可能
- 既存の `/health` エンドポイントは変更しないため、既存の監視に影響なし
