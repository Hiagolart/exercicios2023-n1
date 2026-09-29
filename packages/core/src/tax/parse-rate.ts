import type { TipoAliquota } from "./types";

export type ParsedRateValue = { tipo: TipoAliquota; aliquota: number | null } | { erro: string };

/**
 * Interpreta o valor de alíquota como aparece nas tabelas oficiais:
 * "14", "14%", "12,5", "0" → ad valorem; "NT" → não tributado.
 */
export function parseRateValue(raw: unknown): ParsedRateValue {
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw >= 0 && raw <= 1000
      ? { tipo: "ad_valorem", aliquota: raw }
      : { erro: `Alíquota fora do intervalo: ${raw}.` };
  }
  if (typeof raw !== "string") return { erro: "Alíquota ausente." };
  const text = raw.trim().toUpperCase();
  if (text === "") return { erro: "Alíquota ausente." };
  if (text === "NT") return { tipo: "nao_tributado", aliquota: null };
  const normalized = text.replace("%", "").replace(/\s/g, "").replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return { erro: `Alíquota inválida: "${raw}".` };
  return parseRateValue(Number(normalized));
}
