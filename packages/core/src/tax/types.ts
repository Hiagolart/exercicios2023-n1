/** Tributos incidentes na importação cobertos pelo sistema. */
export const TRIBUTOS = ["II", "IPI", "PIS", "COFINS", "CBS", "IBS"] as const;
export type Tributo = (typeof TRIBUTOS)[number];

export const TRIBUTO_LABELS: Record<Tributo, string> = {
  II: "Imposto de Importação (II)",
  IPI: "IPI",
  PIS: "PIS/Pasep-Importação",
  COFINS: "Cofins-Importação",
  CBS: "CBS",
  IBS: "IBS",
};

/**
 * - `ad_valorem`: percentual sobre a base de cálculo.
 * - `especifica`: valor por unidade (não suportada no simulador).
 * - `nao_tributado`: "NT" na TIPI (fora do campo de incidência do IPI).
 */
export type TipoAliquota = "ad_valorem" | "especifica" | "nao_tributado";

/**
 * Origem de uma alíquota:
 * - `geral`: alíquota do código na tabela (ex.: TEC, TIPI);
 * - `excecao`: lista de exceção que substitui a geral (ex.: LETEC, LEBIT-BK);
 * - `regra_geral`: vale para todos os códigos sem alíquota própria (ex.: PIS/Cofins).
 */
export type RegimeAliquota = "geral" | "excecao" | "regra_geral";

export interface RateRecord {
  /** 8 dígitos; `null` para regra geral. */
  ncm: string | null;
  tributo: Tributo;
  regime: RegimeAliquota;
  /** Nome da lista de exceção (ex.: "LETEC"), quando `regime = excecao`. */
  lista: string | null;
  tipo: TipoAliquota;
  /** Percentual (ex.: 14 = 14%). `null` quando não tributado ou específica. */
  aliquota: number | null;
  vigenciaInicio: Date | null;
  vigenciaFim: Date | null;
  atoLegal: string | null;
  observacao: string | null;
}

export interface ExTarifarioRecord {
  ncm: string;
  tributo: "II" | "IPI";
  numero: string;
  descricao: string;
  aliquota: number;
  vigenciaInicio: Date | null;
  vigenciaFim: Date | null;
  atoLegal: string | null;
}
