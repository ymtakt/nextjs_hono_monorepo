import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./src/util/test-util/setup.ts"],
    globals: true,
  },
});
