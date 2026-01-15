# Design System Overview

## Purpose

このデザインシステムは、UIの一貫性と開発効率を確保するための契約（Contract）です。
特定のUIフレームワークに依存せず、命名規則・粒度・トークン形式を定義します。

---

## Principles

1. **Consistency**: 同じ要素は同じ見た目・動作
2. **Scalability**: 拡張しても破綻しない構造
3. **Accessibility**: すべてのユーザーが使える
4. **Performance**: 軽量で高速

---

## Token Categories

| Category | Description | Example |
|----------|-------------|---------|
| Color | 色定義 | `color.primary.500` |
| Typography | フォント関連 | `font.size.base` |
| Spacing | 余白・間隔 | `space.4` |
| Border | ボーダー | `border.radius.md` |
| Shadow | シャドウ | `shadow.md` |
| Animation | アニメーション | `duration.normal` |

---

## Token Naming Convention

```
{category}.{variant}.{scale}
```

Examples:
- `color.primary.500`
- `font.size.lg`
- `space.8`
- `border.radius.md`

---

## File Structure

```
design/
└── tokens/
    ├── README.md           # トークン使用ガイド
    └── tokens.json         # トークン定義
```

---

## Integration

トークンは以下の形式で出力可能です：
- CSS Custom Properties
- SCSS Variables
- JavaScript/TypeScript Constants
- Tailwind CSS Config

---

## Links

- [design/tokens/tokens.json](../../../design/tokens/tokens.json) - トークン定義
- [docs/01_product/design_system/tokens.schema.md](tokens.schema.md) - トークンスキーマ
