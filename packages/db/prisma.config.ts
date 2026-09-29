import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Carrega o .env da raiz do monorepo; variáveis já definidas no ambiente têm prioridade.
config({ path: "../../.env", quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
