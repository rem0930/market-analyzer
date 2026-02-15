# Spec: 競合店舗管理 - フロントエンド（地図 + 手動登録）

## Metadata

- **ID**: competitor-frontend
- **Status**: Draft
- **Created**: 2026-02-15
- **Updated**: 2026-02-15

---

## Parent Documents

| Document | Path | Reference |
|----------|------|-----------|
| PRD | `docs/01_product/prd.md` | 競合店舗管理機能 |
| Issue | GitHub #16 | [Feature] 競合店舗 - フロントエンド（地図表示 + 手動登録） |
| Parent Spec | `.specify/specs/competitor-management/spec.md` | 競合店舗管理 - ドメインモデル & CRUD API |
| Related Spec | `.specify/specs/store-frontend/spec.md` | 自店舗フロントエンド（FSD パターン参照） |

---

## Overview

競合店舗（Competitor）を地図上で可視化し、手動登録する UI を提供する。ユーザーは自店舗を選択後、地図上のクリックで競合店舗の位置を設定し、名前・カテゴリを入力して保存できる。保存済み競合店舗は地図上に赤ピンで表示され、サイドパネルの一覧から選択・削除が可能。既存の Store フロントエンドパターン（FSD + React Query + Zustand）を踏襲する。

---

## Impact Analysis

### Affected Systems

- [x] Frontend: `entities/competitor/`, `features/competitor-management/`, `features/competitor-creation/`, `widgets/map-workspace/` の新規作成・拡張
- [ ] Backend: なし（Issue #15 / PR #22-24 で完了済み）
- [ ] Database: なし
- [ ] API: なし（既存 Competitor CRUD API を使用）

### Breaking Changes

- [x] なし（全て新規追加 + MapWorkspace への追加統合）

### Downstream Dependencies

| System | Impact | Migration Required |
|--------|--------|-------------------|
| MapWorkspace widget | Competitor ピン + サイドパネルセクション追加 | No（後方互換な追加） |
| Issue #14 (Store Frontend) | Store 選択が競合一覧の前提条件 | No |
| Issue #4 (Google Places) | 将来の google_places source 対応 | No |

---

## Functional Requirements (FR)

### FR-001: Competitor エンティティ定義

FSD entities レイヤーに Competitor のフロントエンド型とビジュアル表現を定義する。

- `Competitor` 型: id, storeId, name, longitude, latitude, source, googlePlaceId, category, createdAt, updatedAt
- `CompetitorsResponse` 型: competitors 配列 + total
- `CreateCompetitorRequest` 型: name, longitude, latitude, source, googlePlaceId?, category?
- `UpdateCompetitorRequest` 型: name?, longitude?, latitude?, category?
- `CompetitorMarker` コンポーネント: 地図上の赤ピン（#ef4444）
- public API は `index.ts` 経由でエクスポート

### FR-002: 選択店舗の競合一覧表示

features/competitor-management レイヤーで競合店舗の一覧表示と選択状態を管理する。

- React Query を使用して `GET /stores/{storeId}/competitors` から競合一覧を取得
- Zustand で selectedCompetitorId を管理
- `CompetitorList` コンポーネント: 競合一覧の表示
- `CompetitorListItem` コンポーネント: 個別競合の表示（名前、カテゴリ、source バッジ）
- 店舗未選択時: 「Select a store to view competitors」メッセージ

### FR-003: 競合手動登録フロー

features/competitor-creation レイヤーで競合の新規作成フローを提供する。

- 「+ New Competitor」ボタンで作成モードに遷移（selectedStoreId 必須）
- 作成モード中に地図クリックで位置（lng/lat）を設定
- 名前・カテゴリ入力フィールド
- 「Save」ボタンで `POST /stores/{storeId}/competitors` にリクエスト（source="manual" 自動設定）
- 「Cancel」ボタンで作成モードを解除
- 作成成功時に競合一覧を自動更新（React Query invalidation）
- 作成モード中は赤プレビューマーカーを表示

### FR-004: MapWorkspace 統合

既存の MapWorkspace ウィジェットを拡張して Competitor 機能を統合する。

- 地図上に保存済み競合の CompetitorMarker を表示（赤ピン）
- サイドパネルに「Competitors」セクションを追加（Store セクションの下、TradeArea セクションの上）
- 競合作成コントロール（作成ボタン、フォーム）
- 競合一覧表示
- 地図クリックイベントに競合作成モード分岐を追加

---

## Non-Functional Requirements (NFR)

### NFR-001: Architecture (FSD)

- レイヤー依存: `widgets → features → entities → shared` を厳守
- public API: 各モジュールは `index.ts` 経由のみでエクスポート
- cross-feature 禁止: features 間の直接 import なし（widgets レイヤーで統合）
- JSDoc: 各ファイルに `@layer`, `@segment`, `@what` コメント

### NFR-002: Security

- 認証ヘッダー: `useAuthStore.getState().accessToken` から Bearer トークン取得
- URL パラメータ: `encodeURIComponent` でエスケープ

---

## Acceptance Criteria (AC)

### AC-001: 競合一覧の表示

**Given** 認証済みユーザーが店舗を選択している
**When** サイドパネルを確認する
**Then** 選択店舗に紐づく競合一覧が表示され、地図上に赤ピンが表示される

### AC-002: 店舗未選択時の表示

**Given** 店舗が未選択の状態
**When** Competitors セクションを確認する
**Then** 「Select a store to view competitors」メッセージが表示される

### AC-003: 競合作成（正常系）

**Given** 店舗を選択し、作成モードに入り、地図クリックで位置設定、名前を入力
**When** 「Save」ボタンをクリック
**Then** 競合が作成され、一覧に追加され、地図上に赤ピンが表示される

### AC-004: 競合作成（キャンセル）

**Given** 作成モード中
**When** 「Cancel」ボタンをクリック
**Then** 作成モードが解除され、プレビューマーカーが消える

### AC-005: 競合作成（バリデーション）

**Given** 名前が未入力、または位置未設定
**When** 「Save」ボタンの状態を確認
**Then** ボタンが無効化（disabled）されている

### AC-006: 競合作成ボタン（店舗未選択時）

**Given** 店舗が未選択の状態
**When** 「+ New Competitor」ボタンの状態を確認
**Then** ボタンが無効化（disabled）されている

### AC-007: 競合削除

**Given** 競合一覧に競合が表示されている
**When** 競合の削除ボタンをクリック
**Then** 競合が削除され、一覧と地図から消える

### AC-008: source バッジの表示

**Given** 競合一覧に手動登録の競合がある
**When** リストアイテムを確認する
**Then** 「manual」バッジが表示される

### AC-009: 空状態の表示

**Given** 店舗を選択しているが競合が 0 件
**When** Competitors セクションを確認する
**Then** 「No competitors yet」メッセージが表示される

### AC-010: FSD レイヤー制約

**Given** 新規作成されたファイル群
**When** `./tools/contract guardrail` を実行
**Then** `fsd-public-api` と `fsd-layer-dependency` が pass する

---

## Out of Scope

- Google Places API による自動検索・登録（Issue #4）
- 競合店舗の編集 UI（API は対応済み、UIは将来）
- 競合店舗の検索・フィルタリング
- CSV インポート

---

## Assumptions

- Competitor CRUD API が動作済み（PR #22-24 merged）
- Store フロントエンドが動作済み（PR #21 merged）
- react-map-gl, React Query, Zustand がセットアップ済み
- 認証基盤（JWT + useAuthStore）が動作済み

---

## Code Map

| Requirement | Module | File(s) |
|-------------|--------|---------|
| FR-001 | Entity: types | `web/src/entities/competitor/model/types.ts` |
| FR-001 | Entity: CompetitorMarker | `web/src/entities/competitor/ui/CompetitorMarker.tsx` |
| FR-001 | Entity: Public API | `web/src/entities/competitor/index.ts` |
| FR-002 | Feature: Queries | `web/src/features/competitor-management/api/queries.ts` |
| FR-002 | Feature: Mutations | `web/src/features/competitor-management/api/mutations.ts` |
| FR-002 | Feature: State | `web/src/features/competitor-management/model/useCompetitors.ts` |
| FR-002 | Feature: CompetitorList | `web/src/features/competitor-management/ui/CompetitorList.tsx` |
| FR-002 | Feature: CompetitorListItem | `web/src/features/competitor-management/ui/CompetitorListItem.tsx` |
| FR-002 | Feature: Public API | `web/src/features/competitor-management/index.ts` |
| FR-003 | Feature: Creation state | `web/src/features/competitor-creation/model/useCompetitorCreation.ts` |
| FR-003 | Feature: CreationMode | `web/src/features/competitor-creation/ui/CompetitorCreationMode.tsx` |
| FR-003 | Feature: Public API | `web/src/features/competitor-creation/index.ts` |
| FR-004 | Widget: MapWorkspace | `web/src/widgets/map-workspace/ui/MapWorkspace.tsx` |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | @claude | Initial spec |
