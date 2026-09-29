import type { RateRecord } from "./types";

/** Chave que identifica a "linha" de uma alíquota ao longo do tempo. */
export function rateSeriesKey(
  r: Pick<RateRecord, "ncm" | "tributo" | "regime" | "lista" | "quota">,
): string {
  return [r.ncm ?? "*", r.tributo, r.regime, r.lista ?? "", r.quota ? "quota" : ""].join("|");
}

function explicitKey(r: RateRecord): string {
  return `${rateSeriesKey(r)}|${r.vigenciaInicio?.toISOString().slice(0, 10) ?? ""}`;
}

export function sameRate(
  a: Pick<RateRecord, "tipo" | "aliquota">,
  b: Pick<RateRecord, "tipo" | "aliquota">,
): boolean {
  return a.tipo === b.tipo && a.aliquota === b.aliquota;
}

const time = (d: Date | null) => d?.getTime() ?? null;

/** Mesmo conteúdo, ignorando a data de início (que identifica o registro). */
function sameContent(a: RateRecord, b: RateRecord): boolean {
  return (
    sameRate(a, b) &&
    time(a.vigenciaFim) === time(b.vigenciaFim) &&
    a.atoLegal === b.atoLegal &&
    a.observacao === b.observacao &&
    a.quota === b.quota
  );
}

export interface ExistingRate extends RateRecord {
  id: string;
  vigenciaInferida: boolean;
}

export interface RateSyncPlan<T extends ExistingRate> {
  inserir: RateRecord[];
  /** Registros novos cuja data de início foi deduzida da data da carga. */
  inferidos: Set<RateRecord>;
  /** Mesmo registro com dados alterados (ato legal, observação, fim da vigência). */
  atualizar: { atual: T; novo: RateRecord }[];
  encerrar: { atual: T; vigenciaFim: Date }[];
  /** Registros com vigência futura que saíram da fonte (nunca entraram em vigor). */
  remover: T[];
  inalterados: T[];
}

const DAY_MS = 86_400_000;

/**
 * Sincroniza uma carga completa de uma fonte com os registros existentes dessa fonte.
 *
 * - Registros com início informado pela fonte são identificados por série + início.
 * - Registros sem início (tabelas como TEC e TIPI) formam a série "aberta": se a
 *   alíquota muda, a anterior é encerrada na véspera da data de referência e a
 *   nova começa na data de referência (vigência deduzida).
 * - Registros vigentes que não aparecem mais na fonte são encerrados na véspera
 *   da data de referência; os de vigência futura são removidos.
 */
export function planRateSync<T extends ExistingRate>(
  existentes: T[],
  novos: RateRecord[],
  referencia: Date,
): RateSyncPlan<T> {
  const plan: RateSyncPlan<T> = {
    inserir: [],
    inferidos: new Set(),
    atualizar: [],
    encerrar: [],
    remover: [],
    inalterados: [],
  };
  const isExplicit = (r: T) => r.vigenciaInicio !== null && !r.vigenciaInferida;
  const explicit = new Map(existentes.filter(isExplicit).map((r) => [explicitKey(r), r]));
  const implicitBySeries = new Map<string, T[]>();
  for (const r of existentes.filter((e) => !isExplicit(e))) {
    const key = rateSeriesKey(r);
    implicitBySeries.set(key, [...(implicitBySeries.get(key) ?? []), r]);
  }
  const matched = new Set<T>();
  const vespera = new Date(referencia.getTime() - DAY_MS);

  for (const novo of novos) {
    if (novo.vigenciaInicio) {
      const atual = explicit.get(explicitKey(novo));
      if (!atual) plan.inserir.push(novo);
      else {
        matched.add(atual);
        if (sameContent(atual, novo)) plan.inalterados.push(atual);
        else plan.atualizar.push({ atual, novo });
      }
      continue;
    }

    const serie = implicitBySeries.get(rateSeriesKey(novo)) ?? [];
    const aberto = serie.find((r) => r.vigenciaFim === null);
    if (aberto && sameRate(aberto, novo)) {
      matched.add(aberto);
      const semMudanca = aberto.atoLegal === novo.atoLegal && aberto.observacao === novo.observacao;
      if (semMudanca) plan.inalterados.push(aberto);
      else
        plan.atualizar.push({
          atual: aberto,
          novo: { ...novo, vigenciaInicio: aberto.vigenciaInicio },
        });
      continue;
    }
    if (aberto) {
      matched.add(aberto);
      plan.encerrar.push({ atual: aberto, vigenciaFim: vespera });
    }
    if (serie.length > 0) {
      const registro = { ...novo, vigenciaInicio: referencia };
      plan.inferidos.add(registro);
      plan.inserir.push(registro);
    } else {
      plan.inserir.push(novo);
    }
  }

  for (const r of existentes) {
    if (matched.has(r)) continue;
    const vigenteOuFutura =
      r.vigenciaFim === null || r.vigenciaFim.getTime() >= referencia.getTime();
    if (!vigenteOuFutura) continue;
    if (r.vigenciaInicio && r.vigenciaInicio.getTime() >= referencia.getTime())
      plan.remover.push(r);
    else plan.encerrar.push({ atual: r, vigenciaFim: vespera });
  }
  return plan;
}
