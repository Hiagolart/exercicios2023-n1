import "server-only";
import { resolveRates, type ResolvedRate, type Tributo } from "@comex/core";
import {
  getPrisma,
  listDestaquesForNcm,
  listRatesForNcm,
  type StoredDestaque,
  type StoredRate,
} from "@comex/db";

export interface ResolvedStoredRate extends Omit<ResolvedRate, "aplicavel" | "geral" | "excecoes"> {
  aplicavel: StoredRate | null;
  geral: StoredRate | null;
  excecoes: StoredRate[];
}

export interface TaxView {
  vigentes: ResolvedStoredRate[];
  historico: StoredRate[];
  destaques: StoredDestaque[];
  hasMock: boolean;
}

/** Tributos da NCM: alíquotas vigentes na data, histórico e destaques Ex. */
export async function getTaxView(ncm: string, date: Date = new Date()): Promise<TaxView> {
  const db = getPrisma();
  const [historico, destaques] = await Promise.all([
    listRatesForNcm(db, ncm),
    listDestaquesForNcm(db, ncm),
  ]);
  // resolveRates devolve os mesmos objetos recebidos, então os metadados são preservados.
  const vigentes = resolveRates(historico, ncm, date) as ResolvedStoredRate[];
  const hasMock = historico.some((r) => r.source.isMock) || destaques.some((d) => d.source.isMock);
  return { vigentes, historico, destaques, hasMock };
}

/** Alíquotas usadas para pré-preencher o simulador. */
export function simulatorDefaults(view: TaxView): Partial<Record<Tributo, StoredRate | null>> {
  return Object.fromEntries(view.vigentes.map((v) => [v.tributo, v.aplicavel]));
}
