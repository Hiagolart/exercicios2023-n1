import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      { test: { name: "unit", include: ["src/**/*.test.ts"] } },
      {
        test: {
          name: "integration",
          include: ["test/**/*.int.test.ts"],
          globalSetup: ["../../packages/db/test/global-setup.ts"],
          fileParallelism: false,
        },
      },
    ],
  },
});
