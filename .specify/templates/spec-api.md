# Spec: [API 機能名]

## Metadata

- **ID**: [kebab-case-id]
- **Status**: Draft | Approved | In Progress | Completed
- **Created**: YYYY-MM-DD
- **Updated**: YYYY-MM-DD

---

## Parent Documents

| Document | Path | Reference |
|----------|------|-----------|
| PRD | `docs/01_product/prd.md` | FR-XXX / US-XXX |
| Identity | `docs/01_product/identity.md` | [関連する原則] |
| Related ADR | `docs/02_architecture/adr/XXXX.md` | [ADR タイトル] |
| Parent Spec | `.specify/specs/xxx/spec.md` | [親 Spec がある場合] |

---

## Overview

[この API 機能の概要を 2-3 文で説明]

---

## API Contract

### Endpoints

| Method | Path | Summary | Auth |
|--------|------|---------|------|
| `POST` | `/api/v1/resource` | リソースを作成 | BearerAuth |
| `GET` | `/api/v1/resource/{id}` | リソースを取得 | BearerAuth |

### OpenAPI Snippet

```yaml
paths:
  /api/v1/resource:
    post:
      operationId: createResource
      tags:
        - Resource
      summary: リソースを作成
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateResourceRequest'
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ResourceResponse'
        '400':
          $ref: './common.yaml#/components/responses/BadRequest'
        '401':
          $ref: './common.yaml#/components/responses/Unauthorized'

components:
  schemas:
    CreateResourceRequest:
      type: object
      required:
        - name
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
    ResourceResponse:
      type: object
      required:
        - id
        - name
        - createdAt
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        createdAt:
          type: string
          format: date-time
```

> **NOTE**: この YAML スニペットは仕様のドラフトです。
> 承認後に `docs/02_architecture/api/` に正式ファイルとして配置し、
> `projects/packages/api-contract/openapi.yaml` に統合してください。

---

## Impact Analysis

### Affected Systems

- [ ] Frontend: [影響箇所を具体的に記載]
- [ ] Backend: [影響箇所を具体的に記載]
- [ ] Database: [スキーマ変更の有無と内容]
- [ ] API: [エンドポイント変更の有無と内容]

### Breaking Changes

- [ ] なし
- [ ] あり: [詳細を記載]

### Downstream Dependencies

| System | Impact | Migration Required |
|--------|--------|-------------------|
| [依存システム名] | [影響内容] | Yes / No |

---

## Functional Requirements (FR)

### FR-001: [要件タイトル]

[要件の詳細な説明]

- [詳細項目 1]
- [詳細項目 2]

### FR-002: [要件タイトル]

[要件の詳細な説明]

---

## Non-Functional Requirements (NFR)

### NFR-001: Performance

- レスポンスタイム: p95 < [X]ms
- スループット: [X] req/s

### NFR-002: Security

- [セキュリティ要件]

### NFR-003: Availability

- [可用性要件]

---

## Acceptance Criteria (AC)

### AC-001: [正常系テストケース]

**Given** [前提条件]
**When** [API エンドポイントへのリクエスト]
**Then** [期待するレスポンス（ステータスコード + ボディ）]

### AC-002: [異常系テストケース]

**Given** [前提条件]
**When** [不正なリクエスト]
**Then** [期待するエラーレスポンス（ステータスコード + エラースキーマ）]

---

## Out of Scope

- [スコープ外項目 1]
- [スコープ外項目 2]

---

## Assumptions

- [前提条件 1]
- [前提条件 2]

---

## Implementation Checklist

- [ ] **OAS**: OpenAPI spec を `docs/02_architecture/api/` に定義
- [ ] **OAS**: `projects/packages/api-contract/openapi.yaml` に統合
- [ ] **Generate**: `./tools/contract openapi-generate` で型生成
- [ ] **Backend Domain**: Entity / Value Object 作成（Pure, no I/O）
- [ ] **Backend UseCase**: UseCase 作成（Repository interface 経由）
- [ ] **Backend Infra**: Repository 実装（Prisma）
- [ ] **Backend Presentation**: Router / Controller 追加
- [ ] **Frontend**: API クライアント呼び出し（generated types 使用）
- [ ] **Quality Gates**: `./tools/contract guardrail` 通過

---

## Code Map

| Requirement | Module | File(s) | Test |
|-------------|--------|---------|------|
| FR-001 | [モジュール名] | `src/path/to/file.ts` | `src/path/to/file.test.ts` |
| FR-002 | [モジュール名] | `src/path/to/file.ts` | `src/path/to/file.test.ts` |

---

## Change History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | YYYY-MM-DD | @author | Initial spec |
