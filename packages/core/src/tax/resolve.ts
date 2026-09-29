import { TRIBUTOS, type RateRecord, type Tributo } from "./types";

/** Indica se um registro está vigente na data informada. */
export function isInForce(
  record: { vigenciaInicio: Date | null; vigenciaFim: Date | null },
  date: Date,
): boolean {
  const t = date.getTime();
  if (record.vigenciaInicio && record.vigenciaInicio.getTime() > t) return false;
  if (record.vigenciaFim && record.vigenciaFim.getTime() < t) return false;
  return true;
}

export interface ResolvedRate<R extends RateRecord = RateRecord> {
  tributo: Tributo;
  /** Alíquota aplicável, já considerando exceções sem quota. `null` se não houver dado. */
  aplicavel: R | null;
  /** Alíquota geral do código (ou regra geral), mesmo quando substituída por exceção. */
  geral: R | null;
  /** Exceções vigentes sem quota (a primeira é a aplicada). */
  excecoes: R[];
  /** Exceções vigentes limitadas a uma quota: valem só para o volume da quota. */
  comQuota: R[];
}

function latestStart(a: RateRecord, b: RateRecord): number {
  return (b.vigenciaInicio?.getTime() ?? 0) - (a.vigenciaInicio?.getTime() ?? 0);
}

/**
 * Determina, para cada tributo, a alíquota aplicável a uma NCM em uma data.
 * Precedência: exceção vigente sem quota > alíquota geral do código > regra geral.
 * Havendo mais de um registro vigente do mesmo tipo, vale o de início mais recente.
 */
export function resolveRates<R extends RateRecord>(
  records: R[],
  ncm: string,
  date: Date = new Date(),
): ResolvedRate<R>[] {
  const inForce = records.filter((r) => isInForce(r, date) && (r.ncm === ncm || r.ncm === null));
  return TRIBUTOS.map((tributo) => {
    const own = inForce.filter((r) => r.tributo === tributo);
    const allExceptions = own
      .filter((r) => r.regime === "excecao" && r.ncm === ncm)
      .sort(latestStart);
    const excecoes = allExceptions.filter((r) => !r.quota);
    const comQuota = allExceptions.filter((r) => r.quota);
    const geral =
      own.filter((r) => r.regime === "geral" && r.ncm === ncm).sort(latestStart)[0] ??
      own.filter((r) => r.regime === "regra_geral").sort(latestStart)[0] ??
      null;
    return { tributo, aplicavel: excecoes[0] ?? geral, geral, excecoes, comQuota };
  });
}
