module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'no-console': 'off', // GASではLogger.logを使うが、デバッグ用にconsoleも許可
  },
  globals: {
    // Google Apps Script globals
    SpreadsheetApp: 'readonly',
    DocumentApp: 'readonly',
    FormApp: 'readonly',
    DriveApp: 'readonly',
    GmailApp: 'readonly',
    CalendarApp: 'readonly',
    SlidesApp: 'readonly',
    ScriptApp: 'readonly',
    UrlFetchApp: 'readonly',
    Utilities: 'readonly',
    Logger: 'readonly',
    PropertiesService: 'readonly',
    CacheService: 'readonly',
    ContentService: 'readonly',
    HtmlService: 'readonly',
    Session: 'readonly',
    Browser: 'readonly',
    Charts: 'readonly',
    console: 'readonly',
  },
};
