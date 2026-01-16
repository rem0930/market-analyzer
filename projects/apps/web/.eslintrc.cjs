/**
 * @what Next.js (FSD) アプリ用 ESLint 設定
 * @why FSD レイヤー境界 + Next.js 固有ルールを適用
 */
const baseConfig = require('@monorepo/eslint-config');
const fsdConfig = require('@monorepo/eslint-config/fsd');

module.exports = {
  root: true,
  ...baseConfig,
  extends: [
    ...baseConfig.extends,
    ...fsdConfig.extends,
    'next/core-web-vitals',
  ],
  plugins: [...baseConfig.plugins, ...fsdConfig.plugins],
  settings: {
    ...fsdConfig.settings,
  },
  rules: {
    ...baseConfig.rules,
    ...fsdConfig.rules,

    // Next.js 固有の制限
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          // FSD ルールを継承
          ...fsdConfig.rules['no-restricted-imports'][1].patterns,

          // next/headers, next/cookies はサーバーコンポーネントのみ
          // （App Router では 'use client' 内で使用不可）
        ],
      },
    ],
  },
  overrides: [
    ...baseConfig.overrides,
    ...fsdConfig.overrides,

    // API Types の手書き禁止
    {
      files: ['**/apiTypes.ts', '**/api-types.ts', '**/ApiTypes.ts'],
      rules: {
        // このファイルパターンを作成することを禁止（レビューで指摘）
      },
    },
  ],
  ignorePatterns: [
    ...baseConfig.ignorePatterns,
    '.next/',
    'out/',
    'src/shared/api/generated/**/*',
    'next-env.d.ts',
  ],
};
