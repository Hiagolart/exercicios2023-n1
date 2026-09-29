import nextEnv from "@next/env";
import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

nextEnv.loadEnvConfig(path.resolve(process.cwd(), "../.."));

const port = Number(process.env.E2E_PORT ?? 3000);

/**
 * Testes ponta a ponta. Exigem o banco configurado (DATABASE_URL) com a carga
 * fictícia de desenvolvimento: `pnpm ingest ncm --source mock`.
 */
export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  workers: 1,
  fullyParallel: false,
  retries: 0,
  use: { baseURL: `http://localhost:${port}`, trace: "retain-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm next start -p ${port}`,
    url: `http://localhost:${port}/api/health`,
    reuseExistingServer: !process.env.CI,
  },
});
