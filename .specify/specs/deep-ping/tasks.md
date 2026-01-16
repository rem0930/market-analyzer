# Tasks: Deep Ping Page

## Prerequisites

- [x] Task 0: Spec/Plan 作成完了

## Phase 1: Contract Definition (実装前に必須)

### API 仕様

- [ ] Task 1: OpenAPI 仕様を定義 (`docs/02_architecture/api/deep-ping.yaml`)
  - `GET /ping/deep` エンドポイントのスキーマ定義
  - レスポンス型の定義

### テスト設計

- [ ] Task 2: Backend ユニットテストを作成
  - `DeepPingUseCase` のテスト
  - DB 接続成功/失敗のケース

- [ ] Task 3: Frontend コンポーネントテストを作成（オプション）
  - `PingResult` コンポーネントのレンダリングテスト

## Phase 2: Implementation (テストを通すための実装)

### Backend

- [ ] Task 4: `DeepPingUseCase` を実装 (`src/usecase/health/deep-ping.ts`)
  - 対応テスト: Task 2
  - Server チェック、DB チェックのロジック

- [ ] Task 5: `DeepPingController` を実装 (`src/presentation/controllers/deep-ping-controller.ts`)
  - HTTP レイヤーの処理

- [ ] Task 6: Router に `/ping/deep` ルートを追加 (`src/presentation/router.ts`)

- [ ] Task 7: DI Container に DeepPing 関連を登録 (`src/composition/container.ts`)

### Frontend

- [ ] Task 8: `usePing` フックを実装 (`src/features/health/model/usePing.ts`)
  - API 呼び出し、状態管理

- [ ] Task 9: `PingResult` コンポーネントを実装 (`src/features/health/ui/PingResult.tsx`)
  - 結果表示 UI

- [ ] Task 10: `/ping` ページを実装 (`src/app/ping/page.tsx`)
  - ページレイアウト、Ping ボタン

## Phase 3: Verification

- [ ] Task 11: 全テスト通過を確認 (`./tools/contract test`)

- [ ] Task 12: 型チェック通過を確認 (`./tools/contract typecheck`)

- [ ] Task 13: Lint 通過を確認 (`./tools/contract lint`)

- [ ] Task 14: E2E 動作確認
  - Frontend から Backend への疎通確認
  - エラーケースの確認

## Documentation Tasks

- [ ] Task 15: API ドキュメント更新（必要に応じて）
