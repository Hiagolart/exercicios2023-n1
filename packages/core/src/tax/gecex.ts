import { isFullNcmCode, parseNcmCell } from "../ncm/code";
import { normalizeEndDate, parseSourceDate } from "../shared/dates";
import { err, ok, type Result } from "../shared/result";
import type { ValidationIssue } from "../data-provider/types";
import { parseRateValue, roundRate } from "./parse-rate";
import type { TaxDataRecord } from "./records";
import { normalizeExNumber } from "./records";

/**
 * Planilha oficial "Anexos I a X da Resolução Gecex nº 272/2021" (Camex).
 *
 * - Anexo I: TEC do Mercosul. Alíquotas podem vir com marca "BK" ou "BIT".
 * - Anexo II: alíquota aplicada pelo Brasil quando difere da TEC.
 * - Anexos IV, V, VI, VIII, IX e X: alterações temporárias que, segundo a
 *   própria planilha, prevalecem sobre os Anexos I e II enquanto vigentes.
 * - Anexo III (setor aeronáutico): lista de subposições sem alíquota; ignorado.
 */

export const GECEX_EXCEPTION_LISTS: Record<string, string> = {
  IV: "Desabastecimento (Anexo IV)",
  V: "LETEC (Anexo V)",
  VI: "LEBIT/BK (Anexo VI)",
  VIII: "Concessões OMC (Anexo VIII)",
  IX: "DCC (Anexo IX)",
  X: "ACE-14 automotivos (Anexo X)",
};

const MARKERS: Record<string, string> = {
  BK: "Bem de capital (BK) na TEC",
  BIT: "Bem de informática e telecomunicações (BIT) na TEC",
};

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const t = String(value).trim();
  return t === "" || t === "-" ? null : t;
}

const percent = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 4 });
const integer = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** Lê a alíquota da TEC com a marca opcional de BK/BIT ("12,6BK" → 12,6 + BK). */
export function parseTecValue(
  raw: unknown,
): { aliquota: number; marcador: "BK" | "BIT" | null } | { erro: string } {
  if (typeof raw === "number") return { aliquota: roundRate(raw), marcador: null };
  const t = text(raw)?.toUpperCase().replace(/\s/g, "");
  if (!t) return { erro: "Alíquota da TEC ausente." };
  const match = /^([\d.,]+)(BK|BIT)?$/.exec(t);
  if (!match?.[1]) return { erro: `Alíquota da TEC inválida: "${String(raw)}".` };
  const rate = parseRateValue(match[1]);
  if ("erro" in rate || rate.aliquota === null)
    return { erro: `Alíquota da TEC inválida: "${String(raw)}".` };
  return { aliquota: rate.aliquota, marcador: (match[2] as "BK" | "BIT" | undefined) ?? null };
}

export interface GecexBaseRow {
  kind: "base";
  ncm: unknown;
  /** Coluna "TEC (%)" do Anexo I. */
  tec: unknown;
  /** Ato indicado no Anexo I para a alíquota, quando houver. */
  atoTec: unknown;
  /** Linha correspondente do Anexo II, se existir. */
  anexoII: { aplicada: unknown; fundamentacao: unknown; atos: unknown } | null;
}

export interface GecexExceptionRow {
  kind: "excecao";
  anexo: string;
  ncm: unknown;
  ex: unknown;
  descricao: unknown;
  aliquota: unknown;
  quota: unknown;
  unidadeQuota: unknown;
  inicio: unknown;
  fim: unknown;
  ato: unknown;
  observacao: unknown;
}

export type GecexRow = GecexBaseRow | GecexExceptionRow | { kind: "ignorar" };

const DEFAULT_TEC_ACT = "Resolução Gecex nº 272/2021, Anexo I";

function parseBase(row: GecexBaseRow): Result<TaxDataRecord, ValidationIssue[]> {
  const ncm = parseNcmCell(row.ncm);
  if (!ncm || !isFullNcmCode(ncm)) return ok({ kind: "ignorar" });
  const tec = parseTecValue(row.tec);
  if ("erro" in tec) return err([{ campo: "tec", motivo: `${tec.erro} (NCM ${String(row.ncm)})` }]);

  const notes: string[] = [];
  if (tec.marcador) notes.push(MARKERS[tec.marcador] ?? tec.marcador);

  let aliquota = tec.aliquota;
  let atoLegal = text(row.atoTec) ?? DEFAULT_TEC_ACT;
  if (row.anexoII) {
    const applied = parseRateValue(row.anexoII.aplicada);
    if ("erro" in applied || applied.aliquota === null) {
      return err([
        {
          campo: "anexoII",
          motivo: `Alíquota aplicada inválida no Anexo II (NCM ${String(row.ncm)}).`,
        },
      ]);
    }
    aliquota = applied.aliquota;
    const atos = text(row.anexoII.atos);
    atoLegal = `Resolução Gecex nº 272/2021, Anexo II${atos ? ` (atos: ${atos})` : ""}`;
    const fundamentacao = text(row.anexoII.fundamentacao);
    if (fundamentacao) notes.push(`Fundamentação: ${fundamentacao}`);
    if (applied.aliquota !== tec.aliquota) {
      notes.push(
        `TEC do Mercosul: ${percent.format(tec.aliquota)}%; o Brasil aplica ${percent.format(applied.aliquota)}% (Anexo II).`,
      );
    }
  }

  return ok({
    kind: "aliquota",
    rate: {
      ncm,
      tributo: "II",
      regime: "geral",
      lista: null,
      tipo: "ad_valorem",
      aliquota,
      vigenciaInicio: null,
      vigenciaFim: null,
      atoLegal,
      observacao: notes.length > 0 ? notes.join(" ") : null,
      quota: null,
    },
  });
}

function formatQuota(quota: unknown, unidade: unknown): string | null {
  const q = typeof quota === "number" ? integer.format(quota) : text(quota);
  if (!q) return null;
  const u = text(unidade);
  return u ? `${q} ${u.toLowerCase()}` : q;
}

function parseException(row: GecexExceptionRow): Result<TaxDataRecord, ValidationIssue[]> {
  const ncm = parseNcmCell(row.ncm);
  if (!ncm || !isFullNcmCode(ncm)) return ok({ kind: "ignorar" });
  const lista = GECEX_EXCEPTION_LISTS[row.anexo];
  if (!lista) return err([{ campo: "anexo", motivo: `Anexo desconhecido: ${row.anexo}.` }]);

  const issues: ValidationIssue[] = [];
  const rate = parseRateValue(typeof row.aliquota === "number" ? row.aliquota : text(row.aliquota));
  if ("erro" in rate || rate.tipo !== "ad_valorem" || rate.aliquota === null) {
    issues.push({
      campo: "aliquota",
      motivo: `Alíquota inválida (NCM ${String(row.ncm)}, ${lista}).`,
    });
  }
  const inicio = parseSourceDate(row.inicio);
  if (inicio === undefined)
    issues.push({ campo: "inicio", motivo: `Data de início inválida (NCM ${String(row.ncm)}).` });
  const fim = parseSourceDate(row.fim);
  if (fim === undefined)
    issues.push({ campo: "fim", motivo: `Data de término inválida (NCM ${String(row.ncm)}).` });
  if (issues.length > 0 || "erro" in rate || rate.aliquota === null) return err(issues);

  const quota = formatQuota(row.quota, row.unidadeQuota);
  const ato = text(row.ato);
  const observacao = text(row.observacao);
  const ex = normalizeExNumber(row.ex);

  if (ex) {
    const descricao = text(row.descricao);
    if (!descricao)
      return err([
        { campo: "descricao", motivo: `Ex ${ex} da NCM ${String(row.ncm)} sem descrição.` },
      ]);
    return ok({
      kind: "destaque",
      destaque: {
        ncm,
        tributo: "II",
        numero: ex,
        descricao: descricao.replace(/^[\s\-–—]+/, ""),
        tipo: "ad_valorem",
        aliquota: rate.aliquota,
        vigenciaInicio: inicio ?? null,
        vigenciaFim: normalizeEndDate(fim ?? null),
        atoLegal: ato,
        lista,
        quota,
        observacao,
      },
    });
  }

  return ok({
    kind: "aliquota",
    rate: {
      ncm,
      tributo: "II",
      regime: "excecao",
      lista,
      tipo: "ad_valorem",
      aliquota: rate.aliquota,
      vigenciaInicio: inicio ?? null,
      vigenciaFim: normalizeEndDate(fim ?? null),
      atoLegal: ato,
      observacao,
      quota,
    },
  });
}

export function parseGecexRow(row: GecexRow): Result<TaxDataRecord, ValidationIssue[]> {
  if (row.kind === "ignorar") return ok({ kind: "ignorar" });
  return row.kind === "base" ? parseBase(row) : parseException(row);
}
