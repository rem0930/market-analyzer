# Glossary (用語集)

プロジェクト内で使用する用語の定義です。チーム間での認識齟齬を防ぐために、重要な用語はここに定義してください。

---

## Business Terms

| 用語                          | 定義                                                                                       | 備考                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------- |
| 自店舗 (Store)                | ユーザーが所有・管理する店舗。名前・住所・座標（経度/緯度）を持つ                          | userId による所有権管理                        |
| 競合店 (Competitor)           | 自店舗に紐づく競合の店舗。名前・座標・カテゴリ・登録ソースを持つ                           | Store に対して多対一の関係                     |
| 商圏 (Trade Area)             | 中心座標と半径（0.1〜50km）で定義される円形の分析対象エリア                                | 人口動態分析の単位                             |
| 人口動態 (Demographics)       | 商圏内の人口・世帯数・年齢分布・平均所得などの統計データ                                   | MVP ではモックデータ（位置ベースの決定的生成） |
| 登録ソース (Source)           | 競合店の登録方法を示す区分。`manual`（手動登録）または `google_places`（API 経由）          | 現時点では `manual` のみ運用                   |
| 所有権チェック (Ownership)    | リソースへのアクセス時に userId を検証し、他ユーザーのデータを参照不可にするセキュリティ機構 | 不正アクセス時は 404 を返し情報漏洩を防止      |
| 楽観ロック (Optimistic Lock)  | 更新時にバージョン番号を照合し、競合する同時更新を検出・防止する仕組み                     | Store, Competitor で使用                       |

---

## Technical Terms

| 用語                                    | 定義                                                                                        | 備考                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| Contract                                | リポジトリ内で統一されたコマンドインターフェース                                            | `tools/contract` 経由で実行       |
| Golden Commands                         | 必ず Contract 経由で実行するコマンド群                                                      | format, lint, test, build 等      |
| DocDD                                   | Document-Driven Development の略。ドキュメント先行の開発スタイル                            | Spec → Plan → Implement          |
| ADR                                     | Architecture Decision Record。アーキテクチャの決定とその理由を記録                          | `docs/02_architecture/adr/`       |
| AC                                      | Acceptance Criteria。受入基準                                                               | Spec に含める                     |
| Aggregate Root                          | DDD におけるドメインモデルの整合性境界の入り口となるエンティティ                            | Store, Competitor, TradeArea 等    |
| Value Object                            | 同一性を持たず、属性の組み合わせで等価性が決まるドメインオブジェクト                        | Email, CenterPoint, Radius 等     |
| Result Pattern                          | 成功/失敗を型安全に表現する Railway-Oriented Programming パターン                           | `Result<T, E>` で例外を使わない   |
| Domain Event                            | ドメイン内で発生した重要な出来事を表すオブジェクト                                          | correlationId, causationId 付き   |
| Clean Architecture                      | 依存方向を内側（ドメイン層）に向ける設計原則。presentation → usecase → domain ← infrastructure | ADR-0003 参照                     |
| Feature-Sliced Design (FSD)             | フロントエンドのアーキテクチャ手法。app → widgets → features → entities → shared             | ADR-0003 参照                     |
| Same-Origin Architecture                | フロントエンドと API を同一オリジンで提供し、CORS を排除する構成                            | ADR-0006 参照                     |
| Worktree                                | Git の worktree 機能を使い、main ブランチを直接編集せず隔離環境で開発する手法               | `tools/worktree/spawn.sh` で作成  |

---

## Abbreviations

| 略語 | 正式名称                    | 説明                     |
| ---- | --------------------------- | ------------------------ |
| PR   | Pull Request                |                          |
| CI   | Continuous Integration      |                          |
| FR   | Functional Requirements     | 機能要件                 |
| NFR  | Non-Functional Requirements | 非機能要件               |
| UX   | User Experience             |                          |
| UI   | User Interface              |                          |
| DDD  | Domain-Driven Design        | ドメイン駆動設計         |
| JWT  | JSON Web Token              | 認証トークン形式         |
| ORM  | Object-Relational Mapping   | DB とオブジェクトの変換  |
| API  | Application Programming Interface |                    |
| CRUD | Create, Read, Update, Delete | 基本的なデータ操作      |
| PII  | Personally Identifiable Information | 個人識別情報      |

---

## Notes

新しい用語を追加する際は、以下を心がけてください：

1. **曖昧さを避ける**: 複数の解釈ができる表現は避ける
2. **例を含める**: 可能であれば具体例を備考に記載
3. **既存定義と整合性を取る**: 矛盾する定義がないか確認
