/**
 * @what ESLint 設定（Clean Architecture レイヤー境界チェック含む）
 * @why レイヤー間の依存方向を静的に検査し、アーキテクチャの崩壊を防ぐ
 * @failure 禁止されたレイヤー間importがあると lint エラー
 *
 * Clean Architecture の依存方向:
 *   presentation → usecase → domain ← infrastructure
 *   composition は全レイヤーをimport可能
 */
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'boundaries'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:boundaries/recommended',
  ],
  env: {
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  settings: {
    'boundaries/include': ['apps/*/src/**/*', 'packages/*/src/**/*'],
    'boundaries/elements': [
      // Domain層: ビジネスロジック（他レイヤーに依存しない）
      { type: 'domain', pattern: 'apps/*/src/domain/**/*' },
      // UseCase層: アプリケーションロジック（domainのみ依存可）
      { type: 'usecase', pattern: 'apps/*/src/usecase/**/*' },
      // Presentation層: HTTP/UI（usecaseのみ依存可）
      { type: 'presentation', pattern: 'apps/*/src/presentation/**/*' },
      // Infrastructure層: 外部サービス・DB（domainのみ依存可）
      { type: 'infrastructure', pattern: 'apps/*/src/infrastructure/**/*' },
      // Composition層: DI構成（全レイヤー依存可）
      { type: 'composition', pattern: 'apps/*/src/composition/**/*' },
      // Shared Package: 共有ユーティリティ（どこからでも依存可）
      { type: 'shared', pattern: 'packages/shared/src/**/*' },
    ],
  },
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
            allow: [
              'composition',
              'domain',
              'usecase',
              'presentation',
              'infrastructure',
              'shared',
            ],
          },
          // shared: 自身のみ
          {
            from: ['shared'],
            allow: ['shared'],
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
            message:
              'Infrastructure dependencies should not be imported in domain/usecase layers',
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
  ],
  ignorePatterns: ['dist/', 'node_modules/'],
};

