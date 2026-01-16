# Glossary (用語集)

プロジェクト内で使用する用語の定義です。チーム間での認識齟齬を防ぐために、重要な用語はここに定義してください。

---

## Business Terms

| 用語 | 定義 | 備考 |
|------|------|------|
| TODO | TODO | TODO |

---

## Technical Terms

| 用語 | 定義 | 備考 |
|------|------|------|
| Contract | リポジトリ内で統一されたコマンドインターフェース | tools/contract 経由で実行 |
| Golden Commands | 必ず Contract 経由で実行するコマンド群 | format, lint, test, build 等 |
| DocDD | Document-Driven Development の略。ドキュメント先行の開発スタイル | Spec → Plan → Implement |
| ADR | Architecture Decision Record。アーキテクチャの決定とその理由を記録 | docs/02_architecture/adr/ |
| AC | Acceptance Criteria。受入基準 | Spec に含める |

---

## Abbreviations

| 略語 | 正式名称 | 説明 |
|------|----------|------|
| PR | Pull Request | |
| CI | Continuous Integration | |
| FR | Functional Requirements | 機能要件 |
| NFR | Non-Functional Requirements | 非機能要件 |
| UX | User Experience | |
| UI | User Interface | |

---

## Template Note

新しい用語を追加する際は、以下を心がけてください：

1. **曖昧さを避ける**: 複数の解釈ができる表現は避ける
2. **例を含める**: 可能であれば具体例を備考に記載
3. **既存定義と整合性を取る**: 矛盾する定義がないか確認
