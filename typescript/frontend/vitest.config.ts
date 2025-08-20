import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/util/test-util/setup.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'cobertura'],
      reportsDirectory: './coverage',
      include: [
        'src/component/client-page/**/action.{ts,tsx}',
        'src/core/**/*.{ts,tsx}',
        'src/domain/logic/**/*.{ts,tsx}',
        'src/util/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/app/**/*',
        'src/component/functionless/**/*',
        'src/util/test-util/**/*',
        'src/util/type.ts',
        'src/domain/data/**/*',
        'src/core/service/api.service.ts',
        'src/util/hook/useToast.tsx',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      backend: path.resolve(__dirname, '../backend/src'),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
});
