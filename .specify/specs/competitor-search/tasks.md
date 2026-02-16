# Tasks: Google Places API による競合自動検索

## Metadata

- **Spec**: `.specify/specs/competitor-search/spec.md`
- **Plan**: `.specify/specs/competitor-search/plan.md`
- **Status**: In Progress (Phase 1-5 Completed)
- **Created**: 2026-02-15
- **Updated**: 2026-02-16

---

## Task Breakdown

### Phase 1: OpenAPI + Domain

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 1.1 | OpenAPI spec に search + bulk endpoints 追加 | FR-006 | S | ✅ | #26 |
| 1.2 | CompetitorSearchResult ValueObject + テスト | FR-001, AC-013 | S | ✅ | #26 |
| 1.3 | CompetitorSearchProvider interface 定義 | FR-001 | S | ✅ | #26 |
| 1.4 | domain/competitor/index.ts + domain/index.ts エクスポート追加 | FR-001 | S | ✅ | #26 |

### Phase 2: Infrastructure（Mock Provider + Repository 拡張）

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 2.1 | CompetitorRepository に findByGooglePlaceIds 追加 | FR-007 | S | ✅ | #26 |
| 2.2 | InMemoryCompetitorRepository に findByGooglePlaceIds 実装 | FR-007 | S | ✅ | #26 |
| 2.3 | PrismaCompetitorRepository に findByGooglePlaceIds 実装 | FR-007 | S | ✅ | #26 |
| 2.4 | MockCompetitorSearchProvider 実装 | FR-002 | M | ✅ | #26 |

### Phase 3: UseCase

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 3.1 | SearchCompetitorsUseCase + テスト | FR-004, AC-001〜004, AC-011〜012 | M | ✅ | #26 |
| 3.2 | BulkCreateCompetitorsUseCase + テスト | FR-005, AC-005〜009 | M | ✅ | #26 |
| 3.3 | UseCase index にエクスポート追加 | FR-004, FR-005 | S | ✅ | #26 |

### Phase 4: Presentation + Integration

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 4.1 | competitor-search-schemas.ts（Zod バリデーション） | FR-006, AC-003, AC-007 | S | ✅ | #26 |
| 4.2 | CompetitorController に search + bulkCreate メソッド追加 | FR-006, AC-010 | M | ✅ | #26 |
| 4.3 | Competitor routes に 2 エンドポイント追加（rateLimit: true） | FR-006, AC-012 | S | ✅ | #26 |
| 4.4 | DI コンテナに CompetitorSearchProvider 配線追加 | FR-006 | S | ✅ | #26 |
| 4.5 | Quality Gates 全パス | NFR | S | ✅ | #26 |

### Phase 5: Frontend（FSD）

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 5.1 | competitor-search feature: API クライアント | FR-008 | S | ✅ | #26 |
| 5.2 | competitor-search feature: State + hooks | FR-008 | M | ✅ | #26 |
| 5.3 | competitor-search feature: SearchDialog UI | FR-008, AC-014 | M | ✅ | #26 |
| 5.4 | competitor-search feature: SearchResults + BulkSave UI | FR-008, AC-014 | M | ✅ | #26 |
| 5.5 | 既存 competitor 一覧に「検索」ボタン追加 | FR-008 | S | ✅ | #26 |
| 5.6 | Frontend Quality Gates 全パス | NFR | S | ✅ | #26 |

### Phase 6: Google Places API 実装（オプショナル）

| # | Task | FR/AC | Estimate | Status | PR |
|---|------|-------|----------|--------|-----|
| 6.1 | GooglePlacesCompetitorSearchProvider 実装 | FR-003, AC-011 | L | ⬜ | - |
| 6.2 | 環境変数 + DI コンテナ切り替え配線 | FR-003 | S | ⬜ | - |
| 6.3 | Quality Gates 全パス | NFR | S | ⬜ | - |

---

## Status Legend

| Icon | Status |
|------|--------|
| ⬜ | Not Started |
| 🔄 | In Progress |
| ✅ | Completed |

---

## Estimate Legend

| Size | Description | Guideline |
|------|-------------|-----------|
| S | Small | 単一ファイル変更、テスト含めて完了 |
| M | Medium | 複数ファイル変更、レビュー必要 |
| L | Large | アーキテクチャ影響あり、複数 PR に分割推奨 |

---

## Dependencies

### Task Dependencies

```
Phase 1:
1.2 (SearchResult VO) ──→ 1.3 (Provider IF) ──→ 1.4 (exports)
1.1 (OpenAPI) ─────────────────────────────────→ 4.5 (QA)

Phase 2:
1.3 ──→ 2.1 (Repo IF) ──→ 2.2 (InMemory) ──→ 3.1 (Search UC)
                         ──→ 2.3 (Prisma)  ──→ 3.2 (Bulk UC)
1.3 ──→ 2.4 (Mock Provider) ──→ 3.1 (Search UC)

Phase 3:
2.2 + 2.4 ──→ 3.1 (Search UC) ──→ 3.3 (exports)
2.2       ──→ 3.2 (Bulk UC)   ──→ 3.3 (exports)

Phase 4:
3.3 ──→ 4.1 (Schemas) ──→ 4.2 (Controller) ──→ 4.3 (Routes) ──→ 4.4 (DI) ──→ 4.5 (QA)

Phase 5:
4.5 ──→ 5.1 (API client) ──→ 5.2 (State) ──→ 5.3 (Dialog) ──→ 5.4 (Results)
                                                              ──→ 5.5 (Button)
                                                                  ──→ 5.6 (QA)

Phase 6 (optional):
4.5 ──→ 6.1 (Google Provider) ──→ 6.2 (DI switch) ──→ 6.3 (QA)
```

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-15 | @claude | Initial tasks |
