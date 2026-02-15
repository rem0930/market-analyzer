# Plan: Google Places API による競合自動検索

## Metadata

- **Spec**: `.specify/specs/competitor-search/spec.md`
- **Status**: Draft
- **Created**: 2026-02-15
- **Updated**: 2026-02-15

---

## Overview

Issue #17 の要件を、既存 DemographicDataProvider パターンを踏襲した Provider パターンで 5 Phase に分けて実装する。Backend（Phase 1-4）を先行し、Frontend（Phase 5）を後続で実装する。Mock Provider を先に用意し、Google Places API 実装は後から差し替える設計とする。

---

## Architecture Decision

### 採用するアプローチ

DemographicDataProvider と同じ Provider パターンを踏襲する。Domain 層にインターフェース、Infrastructure 層に Mock/Real 実装を配置する。

### 検討した代替案

| 案 | 概要 | メリット | デメリット | 採用 |
|----|------|----------|------------|------|
| A: Provider パターン | Domain にインターフェース、Infra に実装 | 一貫性、テスト容易、API 差し替え可能 | 若干の抽象化コスト | Yes |
| B: UseCase 直接実装 | UseCase 内で直接 Google Places API を呼ぶ | シンプル | テスト困難、API ロックイン | No |
| C: BFF パターン | 別サービスとして外部 API ラッパーを構築 | 関心分離 | オーバーエンジニアリング | No |

### 決定理由

既存の DemographicDataProvider パターンとの一貫性を維持し、Mock による開発効率と将来の API 差し替え（Yelp 等）に対応する。

---

## Technical Design

### System Components

```
[Client] → POST /stores/:storeId/competitors/search
         → POST /stores/:storeId/competitors/bulk
    |
[Auth Middleware] → JWT 検証 → userId 抽出
    |
[Rate Limit Middleware] → 5 req/min (search), 10 req/min (bulk)
    |
[Competitor Routes] → パスルーティング
    |
[Competitor Controller] → Zod バリデーション → UseCase 呼び出し
    |
[SearchCompetitorsUseCase]           [BulkCreateCompetitorsUseCase]
    |                                     |
[CompetitorSearchProvider]           [CompetitorRepository]
    |                                     |
[MockProvider / GooglePlacesProvider] [Prisma / InMemory]
    |
[Google Places API (Nearby Search)]
```

### Data Flow: Search

```
1. Client → POST /stores/:storeId/competitors/search { radiusMeters, keyword }
2. Controller → Zod validation → SearchCompetitorsUseCase.execute()
3. UseCase → StoreRepository.findById(storeId) → 所有権チェック
4. UseCase → CompetitorSearchProvider.searchNearby(store.location, radius, keyword)
5. UseCase → CompetitorRepository.findByGooglePlaceIds(storeId, placeIds) → 重複チェック
6. UseCase → alreadyRegistered フラグ付与 → 距離順ソート → Response
```

### Data Flow: Bulk Create

```
1. Client → POST /stores/:storeId/competitors/bulk { competitors: [...] }
2. Controller → Zod validation → BulkCreateCompetitorsUseCase.execute()
3. UseCase → StoreRepository.findById(storeId) → 所有権チェック
4. UseCase → CompetitorRepository.findByGooglePlaceIds(storeId, placeIds) → 重複チェック
5. UseCase → 重複をスキップ、新規を Competitor.create(source: "google_places") → Repository.save()
6. UseCase → { created: [...], skipped: [...], total: { created, skipped } }
```

### Domain Model (New)

```typescript
// domain/competitor/competitor-search-provider.ts
export interface CompetitorSearchProvider {
  searchNearby(
    center: CenterPoint,
    radiusMeters: number,
    keyword: string,
    maxResults?: number
  ): Promise<CompetitorSearchResult[]>;
}

// domain/competitor/competitor-search-result.ts
export class CompetitorSearchResult extends ValueObject<Props> {
  readonly name: string;
  readonly location: CenterPoint;
  readonly googlePlaceId: string;
  readonly category: string;
  readonly address: string;
  readonly distanceMeters: number;
}
```

### Repository Extension

```typescript
// 既存の CompetitorRepository に追加
export interface CompetitorRepository extends Repository<Competitor, CompetitorId> {
  findByStoreId(storeId: string): Promise<Result<Competitor[], RepositoryError>>;
  findByGooglePlaceIds(storeId: string, placeIds: string[]): Promise<Result<Competitor[], RepositoryError>>; // NEW
}
```

---

## Implementation Strategy

### Phase 1: OpenAPI + Domain（基盤）

**目的**: API 仕様と純粋ドメインモデルを確立する

**成果物**:
- [ ] OpenAPI spec に search + bulk endpoints 追加
- [ ] `domain/competitor/competitor-search-result.ts` + テスト
- [ ] `domain/competitor/competitor-search-provider.ts`（interface）
- [ ] `domain/competitor/index.ts` にエクスポート追加
- [ ] `domain/index.ts` に新エクスポート追加

### Phase 2: Infrastructure（Mock Provider + Repository 拡張）

**目的**: Mock 実装とリポジトリ拡張を完成させる

**成果物**:
- [ ] `CompetitorRepository.findByGooglePlaceIds()` をインターフェースに追加
- [ ] InMemoryCompetitorRepository に `findByGooglePlaceIds` 実装
- [ ] PrismaCompetitorRepository に `findByGooglePlaceIds` 実装
- [ ] `mock-competitor-search-provider.ts`（座標ベース決定論的データ生成）

### Phase 3: UseCase

**目的**: ビジネスロジックを実装する

**成果物**:
- [ ] `search-competitors.ts` + テスト
- [ ] `bulk-create-competitors.ts` + テスト
- [ ] UseCase index にエクスポート追加

### Phase 4: Presentation + Integration

**目的**: HTTP 層と DI 配線を完成させる

**成果物**:
- [ ] `competitor-search-schemas.ts`（Zod: searchCompetitorsSchema, bulkCreateCompetitorsSchema）
- [ ] CompetitorController に `search()`, `bulkCreate()` メソッド追加
- [ ] Competitor routes に 2 エンドポイント追加（rateLimit: true）
- [ ] DI コンテナに CompetitorSearchProvider 配線追加
- [ ] Quality Gates 全パス

### Phase 5: Frontend（FSD）

**目的**: 競合検索 UI を Feature-Sliced Design で実装する

**成果物**:
- [ ] `features/competitor-search/api/` - API クライアント
- [ ] `features/competitor-search/model/` - State, hooks
- [ ] `features/competitor-search/ui/` - SearchButton, SearchDialog, SearchResults, BulkSaveButton
- [ ] 既存の competitor 一覧画面に「周辺の競合を検索」ボタン追加

### Phase 6: Google Places API 実装（オプショナル）

**目的**: 本番用 Google Places API 実装

**成果物**:
- [ ] `google-places-competitor-search-provider.ts`
- [ ] 環境変数 `GOOGLE_PLACES_API_KEY` 設定
- [ ] DI コンテナで Mock/Real の切り替え配線

---

## Test Strategy

### Unit Tests

| Component | Test Focus | Target |
|-----------|------------|--------|
| CompetitorSearchResult | 座標バリデーション、必須フィールド | 5+ tests |
| SearchCompetitorsUseCase | 正常系、所有権エラー、バリデーション、登録済みフラグ、外部 API エラー | 6+ tests |
| BulkCreateCompetitorsUseCase | 正常系、重複スキップ、上限超過、所有権エラー、全スキップ | 6+ tests |
| MockCompetitorSearchProvider | 決定論性、結果件数、座標依存 | 3+ tests |

### Integration Tests (UseCase Level)

| Scenario | Components |
|----------|------------|
| Search → Bulk Create | SearchUseCase + BulkCreateUseCase + InMemoryRepo |
| 重複検出 | BulkCreateUseCase + 既存 Competitor + InMemoryRepo |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Google Places API 料金超過 | Medium | High | レート制限 + 日次クォータ + Mock フォールバック |
| API キー漏洩 | Low | Critical | 環境変数管理 + sanitizer + .gitignore |
| Google Places API 仕様変更 | Low | Medium | Provider パターンで影響を Infra 層に封じ込め |
| 大量の一括登録によるDB負荷 | Low | Medium | 50 件上限 + バッチインサート |

---

## Dependencies

### External Dependencies

| Dependency | Version | Purpose | Risk |
|------------|---------|---------|------|
| Prisma | 既存 | ORM | Low |
| Zod | 既存 | Input validation | Low |
| vitest | 既存 | Testing | Low |
| @googlemaps/google-maps-services-js | TBD | Google Places API client | Medium (Phase 6) |

### Internal Dependencies

| Component | Owner | Status |
|-----------|-------|--------|
| `@monorepo/shared` (ValueObject, Result) | shared package | Ready |
| CenterPoint ValueObject | trade-area domain | Ready |
| CompetitorRepository (findByStoreId) | competitor domain | Ready |
| Store domain + StoreRepository | store domain | Ready |
| Auth middleware | presentation | Ready |
| Rate limit middleware | presentation | Ready |

---

## Rollback Plan

### Rollback Trigger

- Quality Gates 失敗が解消不可
- 既存 Competitor テストに破壊的影響
- Google Places API キーの管理問題

### Rollback Steps

1. `git revert` で search 関連コミットを取り消し
2. OpenAPI spec から search/bulk endpoints を削除
3. CompetitorRepository の `findByGooglePlaceIds` を削除（後方互換なので影響なし）

---

## Related Documents

- Spec: `.specify/specs/competitor-search/spec.md`
- Tasks: `.specify/specs/competitor-search/tasks.md`
- Competitor CRUD Spec: `.specify/specs/competitor-management/spec.md`
- Trade Area Spec（Provider パターン参照）: `.specify/specs/trade-area-analysis/spec.md`

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | @claude | Initial plan |
