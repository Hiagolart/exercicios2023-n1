import type { RateRecord } from "@comex/core";

const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });

export function formatRate(rate: Pick<RateRecord, "tipo" | "aliquota"> | null): string {
  if (!rate) return "Não disponível na base";
  if (rate.tipo === "nao_tributado") return "NT (não tributado)";
  if (rate.tipo === "especifica" || rate.aliquota === null) return "Alíquota específica";
  return `${percent.format(rate.aliquota)}%`;
}

export function formatPercent(value: number): string {
  return `${percent.format(value)}%`;
}

export function rateOrigin(rate: Pick<RateRecord, "regime" | "lista">): string {
  if (rate.regime === "excecao") return `Exceção: ${rate.lista ?? "lista não informada"}`;
  if (rate.regime === "regra_geral") return "Regra geral";
  return "Alíquota da NCM";
}

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(value: number): string {
  return money.format(value);
}

/**
 * Converte números digitados no padrão brasileiro ("10.000,50") ou com ponto
 * decimal ("10000.50"). Retorna NaN para textos inválidos e 0 para vazio.
 */
export function parseBrNumber(input: string): number {
  const text = input.trim().replace(/\s/g, "");
  if (text === "") return 0;
  if (!/^-?[\d.,]+$/.test(text)) return Number.NaN;
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  let normalized: string;
  if (lastComma > lastDot) normalized = text.replace(/\./g, "").replace(",", ".");
  else if (lastDot > lastComma && text.indexOf(".") !== lastDot)
    normalized = text.replace(/\./g, "");
  else if (lastDot > lastComma && lastComma >= 0) normalized = text.replace(/,/g, "");
  else normalized = text;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : Number.NaN;
}
