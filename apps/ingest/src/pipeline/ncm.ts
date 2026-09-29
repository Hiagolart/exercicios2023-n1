import {
  resolveParents,
  type DataProvider,
  type IngestionReport,
  type NcmRecord,
} from "@comex/core";
import {
  failIngestionRun,
  finishIngestionRun,
  refreshNcmSearch,
  startIngestionRun,
  upsertDataSource,
  upsertNcmNodes,
  type PrismaClient,
} from "@comex/db";
import { validateNcmBatch } from "./validate";

export interface NcmIngestionOptions {
  /** Hash do arquivo de origem, para rastreabilidade. */
  fileHash?: string | null;
}

/** Executa a carga completa da nomenclatura: leitura → validação → gravação → relatório. */
export async function runNcmIngestion(
  db: PrismaClient,
  provider: DataProvider<NcmRecord>,
  options: NcmIngestionOptions = {},
): Promise<IngestionReport> {
  await upsertDataSource(db, provider.source);
  const runId = await startIngestionRun(db, {
    sourceId: provider.source.id,
    kind: provider.kind,
    fileHash: options.fileHash ?? null,
  });

  try {
    const batch = await provider.read();
    const { valid, rejected, processados } = await validateNcmBatch(provider, batch);
    const parents = resolveParents(valid.map((r) => r.codigo));
    const written = await upsertNcmNodes(
      db,
      valid.map((r) => ({ ...r, parentCodigo: parents.get(r.codigo) ?? null })),
      { sourceId: provider.source.id, runId },
    );
    await refreshNcmSearch(db);

    const report: IngestionReport = {
      sourceId: provider.source.id,
      processados,
      ...written,
      rejeitados: rejected.length,
      erros: rejected,
    };
    await finishIngestionRun(db, runId, report, batch.referenceDate);
    return report;
  } catch (error) {
    await failIngestionRun(db, runId, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
