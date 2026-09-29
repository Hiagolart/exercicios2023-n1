import {
  rateSeriesKey,
  type DataProvider,
  type ExTarifarioRecord,
  type IngestionReport,
  type RateRecord,
  type RejectedRecord,
  type TaxDataRecord,
} from "@comex/core";
import {
  applyRates,
  failIngestionRun,
  finishIngestionRun,
  replaceDestaques,
  startIngestionRun,
  upsertDataSource,
  type PrismaClient,
} from "@comex/db";

export interface ValidatedTaxBatch {
  rates: RateRecord[];
  destaques: ExTarifarioRecord[];
  rejected: RejectedRecord[];
  ignorados: number;
  processados: number;
}

/** Valida o lote e rejeita alíquotas repetidas para a mesma NCM, tributo e lista. */
export async function validateTaxBatch(
  provider: DataProvider<TaxDataRecord>,
  records: Iterable<unknown> | AsyncIterable<unknown>,
): Promise<ValidatedTaxBatch> {
  const out: ValidatedTaxBatch = {
    rates: [],
    destaques: [],
    rejected: [],
    ignorados: 0,
    processados: 0,
  };
  const seen = new Set<string>();
  for await (const raw of records) {
    out.processados++;
    const linha = out.processados;
    const result = provider.validate(raw);
    if (!result.ok) {
      out.rejected.push({ linha, issues: result.error });
      continue;
    }
    const record = result.value;
    if (record.kind === "ignorar") {
      out.ignorados++;
    } else if (record.kind === "destaque") {
      out.destaques.push(record.destaque);
    } else {
      const key = `${rateSeriesKey(record.rate)}|${record.rate.vigenciaInicio?.toISOString() ?? ""}`;
      if (seen.has(key)) {
        out.rejected.push({
          linha,
          issues: [{ campo: "ncm", motivo: `Alíquota repetida no lote (${key}).` }],
        });
        continue;
      }
      seen.add(key);
      out.rates.push(record.rate);
    }
  }
  return out;
}

export interface TaxIngestionOptions {
  /** Data de referência da tabela (usada para inferir vigências). Padrão: hoje. */
  referencia?: Date;
  fileHash?: string | null;
}

/** Carga de dados tributários: leitura → validação → histórico de alíquotas → relatório. */
export async function runTaxIngestion(
  db: PrismaClient,
  provider: DataProvider<TaxDataRecord>,
  options: TaxIngestionOptions = {},
): Promise<IngestionReport> {
  await upsertDataSource(db, provider.source);
  const runId = await startIngestionRun(db, {
    sourceId: provider.source.id,
    kind: provider.kind,
    fileHash: options.fileHash ?? null,
  });

  try {
    const batch = await provider.read();
    const referencia = batch.referenceDate ?? options.referencia ?? new Date();
    const valid = await validateTaxBatch(provider, batch.records);
    const ctx = { sourceId: provider.source.id, runId, referencia };
    const rates = await applyRates(db, valid.rates, ctx);
    const destaques = await replaceDestaques(db, valid.destaques, ctx);

    const report: IngestionReport = {
      sourceId: provider.source.id,
      processados: valid.processados,
      inseridos: rates.inseridos + destaques,
      atualizados: rates.atualizados,
      inalterados: rates.inalterados,
      rejeitados: valid.rejected.length,
      ignorados: valid.ignorados,
      erros: valid.rejected,
    };
    await finishIngestionRun(db, runId, report, referencia);
    return report;
  } catch (error) {
    await failIngestionRun(db, runId, error instanceof Error ? error.message : String(error));
    throw error;
  }
}
