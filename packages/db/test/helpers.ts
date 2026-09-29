import { resolveParents, type NcmRecord } from "@comex/core";
import { createPrismaClient, type PrismaClient } from "../src";
import { upsertNcmNodes } from "../src/repositories/ncm";
import { refreshNcmSearch } from "../src/repositories/search";

export function createTestDb(): PrismaClient {
  return createPrismaClient(process.env.TEST_DATABASE_URL);
}

export async function resetDb(db: PrismaClient): Promise<void> {
  await db.$executeRawUnsafe(
    'TRUNCATE TABLE "pesquisa", "favorito", "session", "account", "user", "ingestion_error", "ingestion_run", "ncm_node", "data_source" CASCADE',
  );
}

/** Grava uma nomenclatura de teste (textos fictícios) e prepara a busca. */
export async function seedNcm(
  db: PrismaClient,
  rows: [codigo: string, descricao: string][],
): Promise<void> {
  await db.dataSource.create({
    data: { id: "teste", nome: "Fonte de teste", descricao: "Testes", isMock: true },
  });
  const run = await db.ingestionRun.create({ data: { sourceId: "teste", kind: "ncm" } });
  const parents = resolveParents(rows.map(([c]) => c));
  const records: (NcmRecord & { parentCodigo: string | null })[] = rows.map(
    ([codigo, descricao]) => ({
      codigo,
      descricao,
      nivel:
        codigo.length === 2
          ? "capitulo"
          : codigo.length === 4
            ? "posicao"
            : codigo.length === 8
              ? "subitem"
              : "subposicao",
      dataInicio: null,
      dataFim: null,
      atoTipo: null,
      atoNumero: null,
      atoAno: null,
      parentCodigo: parents.get(codigo) ?? null,
    }),
  );
  await upsertNcmNodes(db, records, { sourceId: "teste", runId: run.id });
  await refreshNcmSearch(db);
}

export async function createUser(db: PrismaClient, id = "u1"): Promise<string> {
  await db.user.create({ data: { id, name: "Teste", email: `${id}@example.com` } });
  return id;
}
