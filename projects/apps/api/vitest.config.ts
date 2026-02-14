import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      exclude: [
        'prisma/**',
        'dist/**',
        'node_modules/**',
        'src/generated/**',
        '**/*.config.*',
        'vitest.setup.ts',
      ],
    },
    exclude: [
      'prisma/**',
      'dist/**',
      'node_modules/**',
      'src/generated/**',
    ],
  },
});
