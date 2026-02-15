# Plan: 競合店舗 - ドメインモデル & CRUD API

## Metadata

- **Spec**: `.specify/specs/competitor-management/spec.md`
- **Status**: Completed
- **Created**: 2026-02-15
- **Updated**: 2026-02-15

---

## Overview

Issue #15 の要件を、既存 Store パターンを踏襲して 3 Phase で実装する。Store と同一の Clean Architecture + DDD パターンを適用し、2 段階アクセス制御（userId → storeId → competitorId）を実装する。

---

## Architecture Decision

### 採用するアプローチ

Store パターンと同一の Clean Architecture + DDD パターンを踏襲する。Competitor は Store の子エンティティではなく、独立した AggregateRoot として実装する。

### 検討した代替案

| 案 | 概要 | メリット | デメリット | 採用 |
|----|------|----------|------------|------|
| A: 独立 AggregateRoot | Store と同構造で別 Aggregate として構築 | ライフサイクル独立、パターン一貫性 | テーブル結合が必要な場合あり | Yes |
| B: Store の子エンティティ | Store Aggregate に Competitor を内包 | 結合不要 | ライフサイクルが異なる、Store Aggregate が肥大化 | No |

### 決定理由

Competitor は Store とライフサイクルが異なる（Store 削除時は Cascade で連動するが、Competitor の CRUD は独立）。独立 AggregateRoot として Store パターンとの一貫性を維持する。

---

## Technical Design

### System Components

```
[Client] → POST/GET /stores/:storeId/competitors
         → GET/PATCH/DELETE /competitors/:id
    |
[Auth Middleware] → JWT 検証 → userId 抽出
    |
[CSRF Middleware] → 状態変更リクエストの CSRF 検証
    |
[Competitor Routes] → パスルーティング
    |
[Competitor Controller] → Zod バリデーション → UseCase 呼び出し
    |
[Competitor UseCase] → Store 所有権確認 → ドメインオブジェクト操作 → Repository 呼び出し
    |
[Competitor Repository] → Prisma → PostgreSQL (competitors テーブル)
```

### Data Model

```prisma
model Competitor {
  id            String   @id @default(uuid())
  storeId       String   @map("store_id")
  name          String
  longitude     Float
  latitude      Float
  source        String   @default("manual")
  googlePlaceId String?  @map("google_place_id")
  category      String?
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  version       Int      @default(0)

  store Store @relation(fields: [storeId], references: [id], onDelete: Cascade)

  @@index([storeId])
  @@map("competitors")
}
```

---

## Implementation Strategy

### Phase 1: OpenAPI + Domain（基盤）

**目的**: API 仕様と純粋ドメインモデルを確立する

**成果物**:
- [x] OpenAPI spec に Competitor endpoints 定義
- [x] `domain/competitor/competitor-name.ts` + テスト
- [x] `domain/competitor/competitor-source.ts` + テスト
- [x] `domain/competitor/competitor.ts`（AggregateRoot + CompetitorId + CompetitorCreatedEvent）+ テスト
- [x] `domain/competitor/competitor-repository.ts`（interface）
- [x] `domain/competitor/index.ts`（公開 API）
- [x] `domain/index.ts` に Competitor エクスポート追加

### Phase 2: Infrastructure + UseCase

**目的**: データ永続化とビジネスロジックを実装する

**成果物**:
- [x] Prisma schema に Competitor model 追加
- [x] `in-memory-competitor-repository.ts`
- [x] `prisma-competitor-repository.ts`
- [x] `create-competitor.ts` + テスト
- [x] `get-competitor.ts` + テスト
- [x] `list-competitors-by-store.ts` + テスト
- [x] `update-competitor.ts` + テスト
- [x] `delete-competitor.ts` + テスト

### Phase 3: Presentation + Integration

**目的**: HTTP 層と DI 配線を完成させる

**成果物**:
- [x] `competitor-schemas.ts`（Zod バリデーション）
- [x] `competitor-controller.ts`
- [x] `competitors.ts`（ルート定義、auth 必須）
- [x] DI コンテナに Competitor 関連を登録
- [x] ルーターに Competitor routes 登録

---

## Test Strategy

### Unit Tests

| Component | Test Focus | Target | Actual |
|-----------|------------|--------|--------|
| CompetitorName | 境界値（空文字、1文字、100文字、101文字）、トリム | 4+ tests | 9 tests |
| CompetitorSource | enum バリデーション（manual, google_places, 不正値） | 3+ tests | 6 tests |
| Competitor (AggregateRoot) | create, restore, rename, updateLocation, updateCategory | 8+ tests | 15 tests |
| CreateCompetitorUseCase | 正常系、所有権エラー、各バリデーションエラー | 5+ tests | 7 tests |
| GetCompetitorUseCase | 正常系、not_found、他ユーザー | 4+ tests | 4 tests |
| ListCompetitorsByStoreUseCase | 正常系、空リスト、他ユーザー | 3+ tests | 4 tests |
| UpdateCompetitorUseCase | 正常系、部分更新、not_found、バリデーション | 6+ tests | 8 tests |
| DeleteCompetitorUseCase | 正常系、not_found、他ユーザー | 4+ tests | 4 tests |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Store 未実装 | None | N/A | Issue #13 完了済み |
| 2 段階アクセス制御のパフォーマンス | Low | Low | storeId インデックスで最適化 |
| Prisma migration 失敗 | Low | Medium | DevContainer 内で事前テスト |

---

## Dependencies

### External Dependencies

| Dependency | Version | Purpose | Risk |
|------------|---------|---------|------|
| Prisma | 既存 | ORM / Migration | Low |
| Zod | 既存 | Input validation | Low |
| vitest | 既存 | Testing | Low |

### Internal Dependencies

| Component | Owner | Status |
|-----------|-------|--------|
| `@monorepo/shared` (AggregateRoot, ValueObject, Result) | shared package | Ready |
| CenterPoint ValueObject | trade-area domain | Ready |
| Store domain + StoreRepository | store domain | Ready |
| Auth middleware | presentation | Ready |

---

## Rollback Plan

### Rollback Trigger

- Quality Gates 失敗が解消不可
- 既存テストに破壊的影響

### Rollback Steps

1. `git revert` で Competitor 関連コミットを取り消し
2. Prisma migration を rollback
3. OpenAPI spec から Competitor endpoints を削除

---

## Related Documents

- Spec: `.specify/specs/competitor-management/spec.md`
- Tasks: `.specify/specs/competitor-management/tasks.md`
- Store Spec（参照パターン）: `.specify/specs/store-management/spec.md`

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | @claude | Initial plan (retroactive documentation) |
