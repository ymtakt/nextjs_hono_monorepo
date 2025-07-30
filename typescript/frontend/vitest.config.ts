import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__test__/setup.ts'],
    globals: true,
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/use-case': path.resolve(__dirname, './src/use-case'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      // monorepo用 - package.jsonと一致させる
      backend: path.resolve(__dirname, '../backend/src'),
      'backend/*': path.resolve(__dirname, '../backend/src/*'),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
})
