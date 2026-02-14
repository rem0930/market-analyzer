# Plan: 自店舗管理 - ドメインモデル & CRUD API

## Metadata

- **Spec**: `.specify/specs/store-management/spec.md`
- **Status**: Draft
- **Created**: 2026-02-14
- **Updated**: 2026-02-14

---

## Overview

Issue #13 の要件を、既存 TradeArea パターンを踏襲して 3 Phase で実装する。OpenAPI 仕様定義 → ドメインモデル → インフラ/UseCase → プレゼンテーション層の順で進め、各フェーズで TDD を適用する。

---

## Architecture Decision

### 採用するアプローチ

TradeArea と同一の Clean Architecture + DDD パターンを踏襲する。

### 検討した代替案

| 案 | 概要 | メリット | デメリット | 採用 |
|----|------|----------|------------|------|
| A: TradeArea パターン踏襲 | 同一構造でドメイン/UseCase/Presentation を構築 | パターン一貫性、学習コスト低 | 柔軟性に欠ける場合あり | ✅ |
| B: TradeArea に Store 統合 | TradeArea に店舗情報を追加 | 変更量が少ない | 概念が異なる（Store=物理店舗, TradeArea=分析範囲）、SRP 違反 | ❌ |
| C: CRUD ジェネレーター使用 | コード生成で自動化 | 実装速度 | パターン逸脱リスク、既存コードとの不整合 | ❌ |

### 決定理由

Store と TradeArea は別概念（物理店舗 vs 分析範囲）であり分離が適切。既存パターンの踏襲によりコードベースの一貫性を維持し、レビューコストを最小化できる。

---

## Technical Design

### System Components

```
[Client] → POST/GET/PATCH/DELETE /stores
    ↓
[Auth Middleware] → JWT 検証 → userId 抽出
    ↓
[CSRF Middleware] → 状態変更リクエストのCSRF検証
    ↓
[Rate Limit] → POST /stores のレート制限
    ↓
[Store Routes] → パスルーティング
    ↓
[Store Controller] → Zod バリデーション → UseCase 呼び出し
    ↓
[Store UseCase] → ドメインオブジェクト操作 → Repository 呼び出し
    ↓
[Store Repository] → Prisma → PostgreSQL (stores テーブル)
```

### Data Model

```prisma
model Store {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  name      String
  address   String
  longitude Float
  latitude  Float
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user AuthUser @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("stores")
}
```

### API Design

- OpenAPI: `projects/packages/api-contract/openapi.yaml` に追記
- 型生成: `./tools/contract openapi-generate`

---

## Implementation Strategy

### Phase 1: OpenAPI + Domain（基盤）

**目的**: API 仕様と純粋ドメインモデルを確立する

**成果物**:
- [ ] OpenAPI spec に Store endpoints 追加
- [ ] `./tools/contract openapi-check` パス
- [ ] `domain/store/store-name.ts` + テスト
- [ ] `domain/store/store-address.ts` + テスト
- [ ] `domain/store/store.ts`（AggregateRoot + StoreId + StoreCreatedEvent）+ テスト
- [ ] `domain/store/store-repository.ts`（interface）
- [ ] `domain/store/index.ts`（公開 API）
- [ ] `domain/index.ts` に Store エクスポート追加

### Phase 2: Infrastructure + UseCase

**目的**: データ永続化とビジネスロジックを実装する

**成果物**:
- [ ] Prisma schema に Store model 追加
- [ ] マイグレーション実行
- [ ] `in-memory-store-repository.ts`
- [ ] `prisma-store-repository.ts`（userId defense-in-depth）
- [ ] `create-store.ts` + テスト
- [ ] `get-store.ts` + テスト
- [ ] `list-stores.ts` + テスト
- [ ] `update-store.ts` + テスト
- [ ] `delete-store.ts` + テスト

### Phase 3: Presentation + 結合

**目的**: HTTP 層と DI 配線を完成させる

**成果物**:
- [ ] `store-schemas.ts`（Zod バリデーション）
- [ ] `store-controller.ts`
- [ ] `stores.ts`（ルート定義、auth + rateLimit）
- [ ] DI コンテナに Store 関連を登録
- [ ] ルーターに Store routes 登録
- [ ] 全 Quality Gates パス（format, lint, typecheck, test, build, guardrail）

---

## Test Strategy

### Unit Tests

| Component | Test Focus | Target |
|-----------|------------|--------|
| StoreName | 境界値（空文字、1文字、100文字、101文字）、トリム | 4+ tests |
| StoreAddress | 境界値（空文字、1文字、500文字、501文字）、トリム | 4+ tests |
| Store (AggregateRoot) | create, restore, rename, updateAddress, updateLocation | 8+ tests |
| CreateStoreUseCase | 正常系、各バリデーションエラー | 5+ tests |
| GetStoreUseCase | 正常系、not_found、他ユーザー | 4+ tests |
| ListStoresUseCase | 正常系、空リスト | 3+ tests |
| UpdateStoreUseCase | 正常系、部分更新、not_found、バリデーション | 6+ tests |
| DeleteStoreUseCase | 正常系、not_found、他ユーザー | 4+ tests |

### TDD Workflow

各コンポーネントで Red-Green-Refactor:
1. テストを先に書く（Red）
2. 最小限の実装でパス（Green）
3. リファクタリング

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CenterPoint を再利用不可 | Low | Low | Store 専用 ValueObject を作成 |
| AuthUser relation 追加で既存テスト破損 | Low | Medium | optional relation にし後方互換を維持 |
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
| Auth middleware | presentation | Ready |
| CSRF middleware | presentation | Ready |
| Rate limit middleware | presentation | Ready |

---

## Rollback Plan

### Rollback Trigger

- Quality Gates 失敗が Phase 完了時点で解消不可
- 既存テスト（194 tests）に破壊的影響

### Rollback Steps

1. `git revert` で Store 関連コミットを取り消し
2. Prisma migration を `down` で巻き戻し
3. OpenAPI spec から Store endpoints を削除

### Data Migration Rollback

```bash
# Prisma migration rollback
npx prisma migrate resolve --rolled-back <migration_name>
```

---

## Related Documents

- Spec: `.specify/specs/store-management/spec.md`
- Tasks: `.specify/specs/store-management/tasks.md`
- TradeArea Spec（参照パターン）: `.specify/specs/trade-area-analysis/spec.md`

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-14 | @claude | Initial plan |
