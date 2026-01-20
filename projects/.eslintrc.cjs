/**
 * @what ESLint 設定（モノレポ共通）
 * @why レイヤー間の依存方向を静的に検査し、アーキテクチャの崩壊を防ぐ
 * @failure 禁止されたレイヤー間importがあると lint エラー
 *
 * アーキテクチャ:
 * - apps/api: Clean Architecture
 * - apps/web: Feature-Sliced Design (FSD)
 *
 * 各アプリは独自の .eslintrc.cjs を持ち、適切なルールを適用する
 */
const baseConfig = require('@monorepo/eslint-config');

module.exports = {
  root: true,
  ...baseConfig,
  env: {
    node: true,
    browser: true,
    es2022: true,
  },
  settings: {
    // Clean Architecture 用（apps/api 向け）
    'boundaries/include': ['apps/api/src/**/*', 'packages/*/src/**/*'],
    'boundaries/elements': [
      // Domain層: ビジネスロジック（他レイヤーに依存しない）
      { type: 'domain', pattern: 'apps/api/src/domain/**/*' },
      // UseCase層: アプリケーションロジック（domainのみ依存可）
      { type: 'usecase', pattern: 'apps/api/src/usecase/**/*' },
      // Presentation層: HTTP/UI（usecaseのみ依存可）
      { type: 'presentation', pattern: 'apps/api/src/presentation/**/*' },
      // Infrastructure層: 外部サービス・DB（domainのみ依存可）
      { type: 'infrastructure', pattern: 'apps/api/src/infrastructure/**/*' },
      // Composition層: DI構成（全レイヤー依存可）
      { type: 'composition', pattern: 'apps/api/src/composition/**/*' },
      // Shared Package: 共有ユーティリティ（どこからでも依存可）
      { type: 'shared', pattern: 'packages/shared/src/**/*' },
      // ESLint Config Package
      { type: 'eslint-config', pattern: 'packages/eslint-config/**/*' },
      // API Contract Package
      { type: 'api-contract', pattern: 'packages/api-contract/src/**/*' },
    ],
  },
  plugins: [...baseConfig.plugins, 'boundaries'],
  extends: [...baseConfig.extends, 'plugin:boundaries/recommended'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    /**
     * @what レイヤー間の依存制約
     * @why Clean Architectureの依存方向を強制
     * @failure 禁止されたimportがあるとエラー
     */
    'boundaries/element-types': [
      'error',
      {
        default: 'disallow',
        rules: [
          // domain: 外部レイヤーに依存しない（sharedのみ許可）
          {
            from: ['domain'],
            allow: ['domain', 'shared'],
          },
          // usecase: domain, shared のみ
          {
            from: ['usecase'],
            allow: ['usecase', 'domain', 'shared'],
          },
          // presentation: usecase, shared のみ（domainを直接importしない）
          {
            from: ['presentation'],
            allow: ['presentation', 'usecase', 'shared'],
          },
          // infrastructure: domain, shared のみ（usecaseを直接importしない）
          {
            from: ['infrastructure'],
            allow: ['infrastructure', 'domain', 'shared'],
          },
          // composition: 全レイヤーをimport可能
          {
            from: ['composition'],
            allow: ['composition', 'domain', 'usecase', 'presentation', 'infrastructure', 'shared'],
          },
          // shared: 自身のみ
          {
            from: ['shared'],
            allow: ['shared'],
          },
          // eslint-config: 制約なし（設定ファイル）
          {
            from: ['eslint-config'],
            allow: ['eslint-config'],
          },
          // api-contract: shared のみ
          {
            from: ['api-contract'],
            allow: ['api-contract', 'shared'],
          },
        ],
      },
    ],

    /**
     * @what 禁止するimportパターン
     * @why 意図しない外部ライブラリの使用を防ぐ
     */
    'no-restricted-imports': [
      'warn',
      {
        patterns: [
          // domain層でインフラ固有のモジュールを禁止
          {
            group: ['pg', 'mysql*', 'mongodb', 'redis', 'axios', 'node-fetch'],
            message: 'Infrastructure dependencies should not be imported in domain/usecase layers',
          },
        ],
      },
    ],

    /**
     * @what console.log の禁止（本番コード）
     * @why 構造化ログを使用すること
     */
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  overrides: [
    {
      // テストファイルでは console を許可
      files: ['**/*.test.ts', '**/*.spec.ts', '**/tests/**/*'],
      rules: {
        'no-console': 'off',
      },
    },
    {
      // apps/web は独自の .eslintrc.cjs を使用
      files: ['apps/web/**/*'],
      rules: {
        // FSD ルールは apps/web/.eslintrc.cjs で定義
      },
    },
  ],
  ignorePatterns: ['dist/', 'node_modules/', '.next/', '**/generated/**'],
};
