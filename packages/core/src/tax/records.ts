import { isFullNcmCode, normalizeNcmCode, parseNcmCell } from "../ncm/code";
import { normalizeEndDate, parseSourceDate } from "../shared/dates";
import { err, ok, type Result } from "../shared/result";
import type { ValidationIssue } from "../data-provider/types";
import { parseRateValue } from "./parse-rate";
import {
  TRIBUTOS,
  type ExTarifarioRecord,
  type RateRecord,
  type RegimeAliquota,
  type Tributo,
} from "./types";

/** Registro produzido por uma carga de dados tributários. */
export type TaxDataRecord =
  | { kind: "aliquota"; rate: RateRecord }
  | { kind: "destaque"; destaque: ExTarifarioRecord }
  /** Linha lida que não contém dado (títulos, cabeçalhos repetidos, níveis sem alíquota). */
  | { kind: "ignorar" };

type Row = Record<string, unknown>;

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const t = String(value).trim();
  return t === "" ? null : t;
}

const REGIMES: RegimeAliquota[] = ["geral", "excecao", "regra_geral"];

/**
 * Modelo de arquivo próprio (CSV ou JSON) para dados que não têm planilha
 * oficial estruturada: listas de exceção, ex-tarifários e regras gerais da
 * legislação. Colunas documentadas em docs/IMPORTACAO_TRIBUTOS.md.
 */
export function parseTaxTemplateRow(row: Row): Result<TaxDataRecord, ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const kind = (text(row.tipo_registro) ?? "aliquota").toLowerCase();
  if (kind !== "aliquota" && kind !== "destaque") {
    return err([
      { campo: "tipo_registro", motivo: `Use "aliquota" ou "destaque" (recebido "${kind}").` },
    ]);
  }

  const rawNcm = text(row.ncm);
  const ncm = rawNcm ? normalizeNcmCode(rawNcm) : null;
  if (ncm !== null && !isFullNcmCode(ncm))
    issues.push({ campo: "ncm", motivo: `NCM deve ter 8 dígitos: "${rawNcm}".` });

  const tributo = text(row.tributo)?.toUpperCase() as Tributo | undefined;
  if (!tributo || !TRIBUTOS.includes(tributo)) {
    issues.push({ campo: "tributo", motivo: `Tributo inválido. Use: ${TRIBUTOS.join(", ")}.` });
  }

  const rate = parseRateValue(row.aliquota);
  if ("erro" in rate) issues.push({ campo: "aliquota", motivo: rate.erro });

  const inicio = parseSourceDate(row.vigencia_inicio);
  if (inicio === undefined) issues.push({ campo: "vigencia_inicio", motivo: "Data inválida." });
  const fim = parseSourceDate(row.vigencia_fim);
  if (fim === undefined) issues.push({ campo: "vigencia_fim", motivo: "Data inválida." });
  if (inicio && fim && fim < inicio)
    issues.push({ campo: "vigencia_fim", motivo: "Fim anterior ao início." });

  const atoLegal = text(row.ato_legal);

  if (kind === "destaque") {
    const numero = text(row.numero_ex);
    const descricao = text(row.descricao_ex);
    if (!ncm) issues.push({ campo: "ncm", motivo: "Destaque Ex exige NCM." });
    if (tributo && tributo !== "II" && tributo !== "IPI")
      issues.push({ campo: "tributo", motivo: "Destaque Ex só existe para II e IPI." });
    if (!numero) issues.push({ campo: "numero_ex", motivo: "Número do Ex ausente." });
    if (!descricao) issues.push({ campo: "descricao_ex", motivo: "Descrição do Ex ausente." });
    if (!("erro" in rate) && rate.tipo === "especifica")
      issues.push({ campo: "aliquota", motivo: "Destaque Ex não aceita alíquota específica." });
    if (!("erro" in rate) && rate.tipo === "nao_tributado" && tributo !== "IPI")
      issues.push({ campo: "aliquota", motivo: "NT só se aplica a destaques do IPI." });
    if (
      issues.length > 0 ||
      !ncm ||
      !numero ||
      !descricao ||
      "erro" in rate ||
      rate.tipo === "especifica"
    )
      return err(issues);
    return ok({
      kind: "destaque",
      destaque: {
        ncm,
        tributo: tributo as "II" | "IPI",
        numero,
        descricao,
        tipo: rate.tipo,
        aliquota: rate.aliquota,
        vigenciaInicio: inicio ?? null,
        vigenciaFim: normalizeEndDate(fim ?? null),
        atoLegal,
        lista: text(row.lista),
        quota: text(row.quota),
        observacao: text(row.observacao),
      },
    });
  }

  const regime = (text(row.regime)?.toLowerCase() ??
    (ncm ? "geral" : "regra_geral")) as RegimeAliquota;
  const lista = text(row.lista);
  if (!REGIMES.includes(regime))
    issues.push({ campo: "regime", motivo: `Use: ${REGIMES.join(", ")}.` });
  if (regime === "regra_geral" && ncm)
    issues.push({ campo: "ncm", motivo: "Regra geral não leva NCM." });
  if (regime !== "regra_geral" && !ncm)
    issues.push({ campo: "ncm", motivo: "NCM obrigatória para este regime." });
  if (regime === "excecao" && !lista)
    issues.push({ campo: "lista", motivo: "Informe a lista de exceção (ex.: LETEC)." });

  if (issues.length > 0 || !tributo || "erro" in rate) return err(issues);
  return ok({
    kind: "aliquota",
    rate: {
      ncm,
      tributo,
      regime,
      lista: regime === "excecao" ? lista : null,
      tipo: rate.tipo,
      aliquota: rate.aliquota,
      vigenciaInicio: inicio ?? null,
      vigenciaFim: normalizeEndDate(fim ?? null),
      atoLegal,
      observacao: text(row.observacao),
      quota: text(row.quota),
    },
  });
}

/**
 * Número de destaque Ex como aparece nas tabelas ("1", 1, "Ex 01", "Ex  04", "001").
 * Retorna `null` quando não há destaque ("", "-").
 */
export function normalizeExNumber(raw: unknown): string | null {
  const digits = text(raw)?.replace(/\D/g, "") ?? "";
  if (digits === "") return null;
  return digits.padStart(digits.length >= 3 ? digits.length : 2, "0");
}

/**
 * Linha de uma tabela oficial com colunas NCM / EX / descrição / alíquota
 * (TIPI para IPI; TEC, Anexo I, para II). Linhas de níveis acima do subitem
 * (capítulos, posições) não têm alíquota e são ignoradas.
 */
export function parseOfficialTableRow(
  row: { ncm: unknown; ex?: unknown; descricao?: unknown; aliquota: unknown },
  ctx: { tributo: "II" | "IPI"; atoLegal: string | null },
): Result<TaxDataRecord, ValidationIssue[]> {
  const rawNcm = text(row.ncm);
  const ncm = parseNcmCell(rawNcm) ?? "";
  const rawRate = text(row.aliquota);
  if (!isFullNcmCode(ncm) || rawRate === null) return ok({ kind: "ignorar" });

  const rate = parseRateValue(rawRate);
  if ("erro" in rate) return err([{ campo: "aliquota", motivo: `${rate.erro} (NCM ${rawNcm})` }]);

  const ex = normalizeExNumber(row.ex);
  if (ex) {
    const descricao = text(row.descricao);
    if (rate.tipo === "especifica" || !descricao) {
      return err([
        {
          campo: "ex",
          motivo: `Destaque Ex ${ex} da NCM ${rawNcm} sem alíquota válida ou descrição.`,
        },
      ]);
    }
    return ok({
      kind: "destaque",
      destaque: {
        ncm,
        tributo: ctx.tributo,
        numero: ex,
        descricao: descricao.replace(/^[\s\-–—]+/, ""),
        tipo: rate.tipo,
        aliquota: rate.aliquota,
        vigenciaInicio: null,
        vigenciaFim: null,
        atoLegal: ctx.atoLegal,
        lista: null,
        quota: null,
        observacao: null,
      },
    });
  }

  return ok({
    kind: "aliquota",
    rate: {
      ncm,
      tributo: ctx.tributo,
      regime: "geral",
      lista: null,
      tipo: rate.tipo,
      aliquota: rate.aliquota,
      vigenciaInicio: null,
      vigenciaFim: null,
      atoLegal: ctx.atoLegal,
      observacao: null,
      quota: null,
    },
  });
}
