---
name: Implement PR
about: 実装を行うPR
title: "[Impl] "
labels: implementation
---

## Implement

### 実装内容
<!-- 何を実装したか -->

### 関連 Spec / Plan
- Spec: `.specify/specs/xxx/spec.md`
- Plan PR: #

---

## Changes

### Files Changed
<!-- 主な変更ファイル -->

- `path/to/file.ts` - 説明

### Tests Added
<!-- 追加したテスト -->

- `path/to/file.test.ts` - 何をテストしているか

### Docs Updated
<!-- 更新したドキュメント -->

- `docs/xxx.md` - 何を更新したか

---

## Verification

```bash
# 実行結果を貼り付け
./tools/contract lint
./tools/contract test
./tools/contract build
```

### Contract Results
- [ ] `./tools/contract lint` ✅
- [ ] `./tools/contract test` ✅
- [ ] `./tools/contract build` ✅

---

## AC Verification

<!-- Specで定義したACを満たしているか -->

- [ ] **AC1**: 
- [ ] **AC2**: 

---

## Screenshots / Demo
<!-- UI変更がある場合 -->

---

## Checklist

- [ ] Spec に沿った実装になっている
- [ ] テストが追加されている
- [ ] ドキュメントが更新されている
- [ ] Contract commands がすべて通る
