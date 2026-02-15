# Spec: 自店舗管理 - フロントエンド（地図 + 一覧）

## Metadata

- **ID**: store-frontend
- **Status**: In Review
- **Created**: 2026-02-15
- **Updated**: 2026-02-15

---

## Parent Documents

| Document | Path | Reference |
|----------|------|-----------|
| PRD | `docs/01_product/prd.md` | 自店舗管理機能 |
| Identity | `docs/01_product/identity.md` | MarketAnalyzer プロダクトビジョン |
| Issue | GitHub #14 | [Feature] 自店舗管理 - フロントエンド（地図 + 一覧） |
| Parent Spec | `.specify/specs/store-management/spec.md` | 自店舗管理 - ドメインモデル & CRUD API |
| Related Spec | `.specify/specs/trade-area-analysis/spec.md` | 商圏分析（FSD パターン参照） |

---

## Overview

自店舗（Store）を地図上で登録・管理するフロントエンド UI を提供する。ユーザーは地図上のクリックで店舗の位置を設定し、名前・住所を入力して保存できる。保存済み店舗は地図上に青ピンで表示され、サイドパネルの一覧から選択・編集・削除が可能。既存の TradeArea フロントエンドパターン（FSD + React Query + Zustand）を踏襲する。

---

## Impact Analysis

### Affected Systems

- [x] Frontend: `entities/store/`, `features/store-management/`, `features/store-creation/`, `widgets/map-workspace/` の新規作成・拡張
- [ ] Backend: なし（Issue #13 / PR #20 で完了済み）
- [ ] Database: なし
- [ ] API: なし（既存 Store CRUD API を使用）

### Breaking Changes

- [x] なし（全て新規追加 + MapWorkspace への追加統合）

### Downstream Dependencies

| System | Impact | Migration Required |
|--------|--------|-------------------|
| MapWorkspace widget | Store ピン + サイドパネルセクション追加 | No（後方互換な追加） |
| Issue #3 (Trade Area Frontend) | 並列開発可能、MapWorkspace 統合時にマージ調整の可能性 | No |
| Issue #15 (Competitor Backend) | Store を基点とした競合分析の将来拡張 | No |

---

## Functional Requirements (FR)

### FR-001: Store エンティティ定義

FSD entities レイヤーに Store のフロントエンド型とビジュアル表現を定義する。

- `Store` 型: id, userId, name, address, longitude, latitude, createdAt, updatedAt
- `StoresResponse` 型: stores 配列
- `CreateStoreRequest` 型: name, address, longitude, latitude
- `UpdateStoreRequest` 型: name?, address?, longitude?, latitude?
- `StoreMarker` コンポーネント: 地図上の青ピン（Mapbox Marker）
- public API は `index.ts` 経由でエクスポート

### FR-002: 店舗一覧表示・選択

features/store-management レイヤーで店舗の一覧表示と選択状態を管理する。

- React Query を使用して `GET /stores` から店舗一覧を取得
- Zustand で selectedStoreId を管理
- `StoreList` コンポーネント: 店舗一覧の表示
- `StoreListItem` コンポーネント: 個別店舗の表示（名前、住所、選択状態）
- 店舗選択時に地図がその位置にフォーカス
- 店舗削除: 確認なしで即時削除（onSuccess でキャッシュ無効化）

### FR-003: 店舗作成フロー

features/store-creation レイヤーで店舗の新規作成フローを提供する。

- 「+ New Store」ボタンで作成モードに遷移
- 作成モード中に地図クリックで位置（lng/lat）を設定
- 名前・住所入力フィールド
- 「Save」ボタンで `POST /stores` にリクエスト
- 「Cancel」ボタンで作成モードを解除
- 作成成功時に店舗一覧を自動更新（React Query invalidation）
- 作成モード中はプレビューマーカーを表示

### FR-004: MapWorkspace 統合

既存の MapWorkspace ウィジェットを拡張して Store 機能を統合する。

- 地図上に保存済み店舗の StoreMarker を表示
- サイドパネルに「Stores」セクションを追加（TradeArea セクションの上部）
- 店舗作成コントロール（作成ボタン、フォーム）
- 店舗一覧表示
- 地図クリックイベントを店舗作成モードと商圏作成モードで切り替え

### FR-005: 店舗更新

features/store-management レイヤーで店舗の部分更新を提供する。

- 選択中の店舗の名前・住所を編集可能
- `PATCH /stores/{storeId}` で部分更新
- 更新成功時にキャッシュ無効化

---

## Non-Functional Requirements (NFR)

### NFR-001: Performance

- 店舗一覧の初回表示: 200ms 以内（キャッシュヒット時）
- 地図マーカー描画: 100 店舗まで 60fps を維持

### NFR-002: Accessibility

- キーボードナビゲーション: Tab で店舗リスト移動
- フォームフィールドに適切な label と aria 属性

### NFR-003: Architecture (FSD)

- レイヤー依存: `widgets → features → entities → shared` を厳守
- public API: 各モジュールは `index.ts` 経由のみでエクスポート
- cross-feature 禁止: features 間の直接 import なし（widgets レイヤーで統合）
- JSDoc: 各ファイルに `@layer`, `@segment`, `@what` コメント

### NFR-004: Security

- 認証ヘッダー: `useAuthStore.getState().accessToken` から Bearer トークン取得
- CSRF: `apiClient` ラッパーが自動付与（既存パターン）
- 入力サニタイズ: React の自動エスケープに依存（dangerouslySetInnerHTML 不使用）
- URL パラメータ: `encodeURIComponent` でエスケープ

---

## Acceptance Criteria (AC)

### AC-001: 店舗一覧の表示

**Given** 認証済みユーザーがダッシュボードのマップ画面を開く
**When** ページが読み込まれる
**Then** サイドパネルに自分の店舗一覧が表示され、地図上に青ピンが表示される

### AC-002: 店舗の選択

**Given** 店舗一覧に複数の店舗が表示されている
**When** 一覧から店舗をクリックする
**Then** 選択された店舗がハイライトされ、地図がその位置にフォーカスする

### AC-003: 店舗作成（正常系）

**Given** 認証済みユーザーが作成モードに入り、地図上をクリックして位置を設定し、名前と住所を入力
**When** 「Save」ボタンをクリック
**Then** 店舗が作成され、一覧に追加され、地図上に青ピンが表示される

### AC-004: 店舗作成（キャンセル）

**Given** 作成モード中
**When** 「Cancel」ボタンをクリック
**Then** 作成モードが解除され、プレビューマーカーが消える

### AC-005: 店舗作成（バリデーション）

**Given** 名前が未入力、または位置未設定
**When** 「Save」ボタンの状態を確認
**Then** ボタンが無効化（disabled）されている

### AC-006: 店舗削除

**Given** 店舗一覧に店舗が表示されている
**When** 店舗の削除ボタンをクリック
**Then** 店舗が削除され、一覧と地図から消える

### AC-007: 店舗更新

**Given** 店舗が選択されている状態
**When** 名前または住所を編集して保存
**Then** 変更が反映され、一覧が更新される

### AC-008: 未認証時の表示

**Given** 未認証ユーザー
**When** マップ画面にアクセス
**Then** 店舗一覧は空（React Query の enabled: false）

### AC-009: 空状態の表示

**Given** 認証済みユーザーで店舗が 0 件
**When** マップ画面を開く
**Then** 「No stores yet. Create your first store!」などの空状態メッセージが表示される

### AC-010: FSD レイヤー制約

**Given** 新規作成されたファイル群
**When** `./tools/contract guardrail` を実行
**Then** `fsd-public-api` と `fsd-layer-dependency` が pass する

---

## Out of Scope

- 店舗の検索・フィルタリング機能
- 店舗画像のアップロード
- 店舗の公開・共有機能
- Google Places API 連携による住所オートコンプリート（Issue #17）
- 競合店舗の表示（Issue #15, #16）
- CSV インポート（Issue #18）
- ドラッグ＆ドロップによる店舗位置変更
- 店舗の並べ替え

---

## Assumptions

- Store CRUD API が動作済み（PR #20 merged）
- Orval 生成済み API 型が利用可能（`@monorepo/api-contract`）
- Mapbox GL JS がセットアップ済み（react-map-gl）
- React Query + Zustand がセットアップ済み
- 認証基盤（JWT + useAuthStore）が動作済み
- TradeArea フロントエンドパターンが参照可能

---

## Code Map

| Requirement | Module | File(s) | Test |
|-------------|--------|---------|------|
| FR-001 | Entity: Store types | `web/src/entities/store/model/types.ts` | - |
| FR-001 | Entity: StoreMarker | `web/src/entities/store/ui/StoreMarker.tsx` | - |
| FR-001 | Entity: Public API | `web/src/entities/store/index.ts` | - |
| FR-002 | Feature: Queries | `web/src/features/store-management/api/queries.ts` | - |
| FR-002 | Feature: Mutations | `web/src/features/store-management/api/mutations.ts` | - |
| FR-002 | Feature: State | `web/src/features/store-management/model/useStores.ts` | - |
| FR-002 | Feature: StoreList | `web/src/features/store-management/ui/StoreList.tsx` | - |
| FR-002 | Feature: StoreListItem | `web/src/features/store-management/ui/StoreListItem.tsx` | - |
| FR-005 | Feature: Public API | `web/src/features/store-management/index.ts` | - |
| FR-003 | Feature: Creation state | `web/src/features/store-creation/model/useStoreCreation.ts` | - |
| FR-003 | Feature: CreationMode | `web/src/features/store-creation/ui/StoreCreationMode.tsx` | - |
| FR-003 | Feature: Public API | `web/src/features/store-creation/index.ts` | - |
| FR-004 | Widget: MapWorkspace | `web/src/widgets/map-workspace/ui/MapWorkspace.tsx` | - |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | @claude | Initial spec |
