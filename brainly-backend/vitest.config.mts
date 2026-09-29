import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: "test",
      LOG_LEVEL: "silent",
      RATE_LIMIT_DISABLED: "true",
      MONGO_URL: "mongodb://127.0.0.1:27017/brainly_test",
      JWT_PASSWORD: "test-secret-0123456789-0123456789-0123",
      JWT_EXPIRES_IN: "1h",
    },
  },
});
