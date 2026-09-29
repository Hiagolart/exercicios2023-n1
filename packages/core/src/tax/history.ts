import type { RateRecord } from "./types";

/** Chave que identifica a "linha" de uma alíquota ao longo do tempo. */
export function rateSeriesKey(r: Pick<RateRecord, "ncm" | "tributo" | "regime" | "lista">): string {
  return [r.ncm ?? "*", r.tributo, r.regime, r.lista ?? ""].join("|");
}

export function sameRate(
  a: Pick<RateRecord, "tipo" | "aliquota">,
  b: Pick<RateRecord, "tipo" | "aliquota">,
): boolean {
  return a.tipo === b.tipo && a.aliquota === b.aliquota;
}

export interface RatePlan<T extends RateRecord> {
  /** Registros novos a inserir. */
  inserir: RateRecord[];
  /** Registros vigentes a encerrar, com a data de término. */
  encerrar: { atual: T; vigenciaFim: Date }[];
  /** Registros vigentes sem alteração. */
  inalterados: T[];
}

const DAY_MS = 86_400_000;

/**
 * Compara a carga nova com os registros abertos (sem data de término) e planeja
 * o histórico. Quando a fonte não informa a vigência, a data de referência da
 * carga passa a ser o início da nova alíquota e a véspera, o fim da anterior.
 * Registros nessa situação ficam marcados como vigência inferida.
 */
export function planRateChanges<T extends RateRecord>(
  abertos: T[],
  novos: RateRecord[],
  referencia: Date,
): RatePlan<T> & { inferidos: Set<RateRecord> } {
  const byKey = new Map(abertos.map((r) => [rateSeriesKey(r), r]));
  const plan: RatePlan<T> & { inferidos: Set<RateRecord> } = {
    inserir: [],
    encerrar: [],
    inalterados: [],
    inferidos: new Set(),
  };
  for (const novo of novos) {
    const atual = byKey.get(rateSeriesKey(novo));
    if (atual && sameRate(atual, novo)) {
      plan.inalterados.push(atual);
      continue;
    }
    let registro = novo;
    if (!novo.vigenciaInicio && atual) {
      registro = { ...novo, vigenciaInicio: referencia };
      plan.inferidos.add(registro);
    }
    if (atual) {
      const inicio = registro.vigenciaInicio ?? referencia;
      plan.encerrar.push({ atual, vigenciaFim: new Date(inicio.getTime() - DAY_MS) });
    }
    plan.inserir.push(registro);
  }
  return plan;
}
