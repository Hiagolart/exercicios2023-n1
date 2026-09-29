import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

export function createPrismaClient(connectionString = process.env.DATABASE_URL): PrismaClient {
  if (!connectionString) {
    throw new Error("DATABASE_URL não definida. Configure o arquivo .env (veja .env.example).");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalForPrisma = globalThis as unknown as { comexPrisma?: PrismaClient };

/** Instância única por processo (evita múltiplas conexões no hot reload do Next.js). */
export function getPrisma(): PrismaClient {
  globalForPrisma.comexPrisma ??= createPrismaClient();
  return globalForPrisma.comexPrisma;
}
