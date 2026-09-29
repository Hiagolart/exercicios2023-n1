import {
  GECEX_EXCEPTION_LISTS,
  parseNcmCell,
  parseGecexRow,
  type DataProvider,
  type GecexRow,
  type ProviderBatch,
  type SourceMetadata,
  type TaxDataRecord,
} from "@comex/core";
import { normalizeHeader, readWorkbook, type SheetRows } from "./official-xlsx";

export const GECEX_SOURCE: SourceMetadata = {
  id: "camex-gecex-272",
  nome: "Camex — Resolução Gecex nº 272/2021, Anexos I a X (TEC e exceções)",
  url: "https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes",
  licenca: null,
  descricao:
    "Alíquotas do Imposto de Importação: TEC (Anexo I), alíquotas aplicadas pelo Brasil (Anexo II) " +
    "e alterações temporárias (Anexos IV, V, VI, VIII, IX e X).",
  isMock: false,
};

type Field =
  | "ncm"
  | "ex"
  | "descricao"
  | "aliquota"
  | "tec"
  | "aplicada"
  | "quota"
  | "unidade"
  | "inicio"
  | "fim"
  | "ato"
  | "observacao"
  | "fundamentacao";

const MATCHERS: [Field, (h: string) => boolean][] = [
  ["ncm", (h) => h === "NCM"],
  ["ex", (h) => h.replace(/[^A-Z]/g, "") === "NEX"],
  ["descricao", (h) => h.startsWith("DESCRI")],
  ["aplicada", (h) => h.startsWith("ALIQUOTA APLICADA")],
  ["aliquota", (h) => h.startsWith("ALIQUOTA")],
  ["tec", (h) => h.startsWith("TEC")],
  ["quota", (h) => h === "QUOTA"],
  ["unidade", (h) => h.startsWith("UNIDADE")],
  ["inicio", (h) => h.startsWith("INICIO")],
  ["fim", (h) => h.startsWith("TERMINO")],
  ["ato", (h) => h.startsWith("ATO DE INCLUSAO") || h.startsWith("ATOS DE INCLUSAO")],
  ["observacao", (h) => h.startsWith("OBSERVA")],
  ["fundamentacao", (h) => h.startsWith("FUNDAMENTA")],
];

interface Header {
  row: number;
  cols: Partial<Record<Field, number>>;
}

/** Primeira linha cujo cabeçalho começa com "NCM", com o índice de cada coluna conhecida. */
export function findGecexHeader(rows: unknown[][]): Header | null {
  for (let i = 0; i < Math.min(rows.length, 60); i++) {
    const cells = (rows[i] ?? []).map((c) => normalizeHeader(c).replace(/\s+/g, " "));
    if (cells[0] !== "NCM") continue;
    const cols: Partial<Record<Field, number>> = {};
    cells.forEach((h, index) => {
      const match = MATCHERS.find(([field, test]) => cols[field] === undefined && test(h));
      if (match) cols[match[0]] = index;
    });
    return { row: i, cols };
  }
  return null;
}

/** Algarismo romano do anexo a partir do nome da aba ("Anexo V - LETEC" → "V"). */
export function annexOf(sheetName: string): string | null {
  return /^Anexo\s+([IVX]+)\b/i.exec(sheetName.trim())?.[1]?.toUpperCase() ?? null;
}

const at = (cells: unknown[], index: number | undefined) =>
  index === undefined ? null : cells[index];

function dataRows(sheet: SheetRows): { header: Header; rows: unknown[][] } {
  const header = findGecexHeader(sheet.rows);
  if (!header) throw new Error(`Cabeçalho com "NCM" não encontrado na aba "${sheet.name}".`);
  return { header, rows: sheet.rows.slice(header.row + 1) };
}

/** Monta as linhas da carga a partir das abas da planilha (sem validar). */
export function buildGecexRows(sheets: SheetRows[]): GecexRow[] {
  const byAnnex = new Map(sheets.map((s) => [annexOf(s.name), s]));
  const anexoI = byAnnex.get("I");
  if (!anexoI) throw new Error('Aba "Anexo I - TEC" não encontrada.');

  const anexoII = new Map<string, { aplicada: unknown; fundamentacao: unknown; atos: unknown }>();
  const sheetII = byAnnex.get("II");
  if (sheetII) {
    const { header, rows } = dataRows(sheetII);
    for (const cells of rows) {
      const ncm = parseNcmCell(at(cells, header.cols.ncm));
      if (ncm?.length !== 8) continue;
      anexoII.set(ncm, {
        aplicada: at(cells, header.cols.aplicada),
        fundamentacao: at(cells, header.cols.fundamentacao),
        atos: at(cells, header.cols.ato),
      });
    }
  }

  const out: GecexRow[] = [];
  const { header: hI, rows: rowsI } = dataRows(anexoI);
  const tecCol = hI.cols.tec ?? hI.cols.aliquota;
  if (tecCol === undefined) throw new Error('Coluna "TEC (%)" não encontrada no Anexo I.');
  for (const cells of rowsI) {
    const ncm = at(cells, hI.cols.ncm);
    const digits = parseNcmCell(ncm);
    if (digits?.length !== 8) {
      out.push({ kind: "ignorar" });
      continue;
    }
    // No Anexo I, a coluna após "TEC (%)" traz, quando preenchida, o ato que alterou a alíquota.
    out.push({
      kind: "base",
      ncm,
      tec: cells[tecCol],
      atoTec: cells[tecCol + 1] ?? null,
      anexoII: anexoII.get(digits) ?? null,
    });
  }

  for (const [annex, sheet] of byAnnex) {
    if (!annex || !GECEX_EXCEPTION_LISTS[annex]) continue;
    const { header, rows } = dataRows(sheet);
    for (const cells of rows) {
      const ncm = at(cells, header.cols.ncm);
      if (parseNcmCell(ncm)?.length !== 8) {
        out.push({ kind: "ignorar" });
        continue;
      }
      out.push({
        kind: "excecao",
        anexo: annex,
        ncm,
        ex: at(cells, header.cols.ex),
        descricao: at(cells, header.cols.descricao),
        aliquota: at(cells, header.cols.aliquota),
        quota: at(cells, header.cols.quota),
        unidadeQuota: at(cells, header.cols.unidade),
        inicio: at(cells, header.cols.inicio),
        fim: at(cells, header.cols.fim),
        ato: at(cells, header.cols.ato),
        observacao: at(cells, header.cols.observacao),
      });
    }
  }
  return out;
}

/** Provedor da planilha "Anexos I a X da Resolução Gecex nº 272/2021". */
export class GecexWorkbookProvider implements DataProvider<TaxDataRecord> {
  readonly kind = "tariffs" as const;
  readonly source = GECEX_SOURCE;

  constructor(private readonly path: string) {}

  async read(): Promise<ProviderBatch> {
    return { referenceDate: null, records: buildGecexRows(await readWorkbook(this.path)) };
  }

  validate(raw: unknown) {
    return parseGecexRow(raw as GecexRow);
  }
}
