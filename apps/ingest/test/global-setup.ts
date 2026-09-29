import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

/** Aplica as migrações no banco de teste antes dos testes de integração. */
export default function setup(): void {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL não definida. Os testes de integração exigem um PostgreSQL dedicado a testes.",
    );
  }
  execSync("pnpm exec prisma migrate deploy", {
    cwd: fileURLToPath(new URL("../../../packages/db", import.meta.url)),
    env: { ...process.env, DATABASE_URL: url },
    stdio: "inherit",
  });
}
