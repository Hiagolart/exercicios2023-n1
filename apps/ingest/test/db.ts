import { createPrismaClient, type PrismaClient } from "@comex/db";

export function createTestDb(): PrismaClient {
  return createPrismaClient(process.env.TEST_DATABASE_URL);
}

/** Limpa as tabelas de dados entre os testes. */
export async function resetDb(db: PrismaClient): Promise<void> {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "destaque_ex", "aliquota", "ingestion_error", "ingestion_run", "ncm_node", "data_source" CASCADE',
  );
}
