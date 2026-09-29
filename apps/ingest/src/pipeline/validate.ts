import type { DataProvider, NcmRecord, ProviderBatch, RejectedRecord } from "@comex/core";

export interface ValidatedBatch {
  valid: NcmRecord[];
  rejected: RejectedRecord[];
  processados: number;
}

/**
 * Valida todos os registros de um lote. Códigos repetidos são rejeitados
 * (mantém-se a primeira ocorrência), pois indicam inconsistência na fonte.
 */
export async function validateNcmBatch(
  provider: DataProvider<NcmRecord>,
  batch: ProviderBatch,
): Promise<ValidatedBatch> {
  const valid: NcmRecord[] = [];
  const rejected: RejectedRecord[] = [];
  const seen = new Set<string>();
  let linha = 0;

  for await (const raw of batch.records) {
    linha++;
    const result = provider.validate(raw);
    if (!result.ok) {
      rejected.push({ linha, issues: result.error });
    } else if (seen.has(result.value.codigo)) {
      rejected.push({
        linha,
        issues: [{ campo: "codigo", motivo: `Código duplicado no lote: ${result.value.codigo}.` }],
      });
    } else {
      seen.add(result.value.codigo);
      valid.push(result.value);
    }
  }
  return { valid, rejected, processados: linha };
}
