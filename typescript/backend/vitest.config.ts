import { defineConfig } from "vitest/config";
import * as path from "path";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./src/util/test-util/setup.ts"],
    environment: "node",
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://testuser:testpass@localhost:54321/myapp_test",
    },
    testTimeout: 30000, // PostgreSQL接続のため長めに設定
    hookTimeout: 30000,
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true, // DBテストのため単一スレッド
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
