import * as path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ['./src/util/test-util/setup.ts'],
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://testuser:testpass@localhost:54321/myapp_test',
    },
    testTimeout: 30000, // PostgreSQL接続のため長めに設定
    hookTimeout: 30000,
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // DBテストのため単一スレッド
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'cobertura'],
      reportsDirectory: './coverage',
      include: ['src/endpoint/handler/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/index.ts',
        'src/env.ts',
        'src/endpoint/middleware/**/*',
        'src/endpoint/errorCode.ts',
        'src/endpoint/errorResponse.ts',
        'src/schemas/**/*',
        'src/util/test-util/**/*',
        'src/util/factory.ts',
        'src/util/logger.ts',
        'src/util/prisma.ts',
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
