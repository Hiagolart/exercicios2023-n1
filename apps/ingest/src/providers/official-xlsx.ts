import ExcelJS from "exceljs";
import {
  parseOfficialTableRow,
  type DataProvider,
  type ProviderBatch,
  type SourceMetadata,
  type TaxDataRecord,
} from "@comex/core";

export const TIPI_SOURCE: SourceMetadata = {
  id: "rfb-tipi",
  nome: "Receita Federal — TIPI (Tabela de Incidência do IPI)",
  url: "https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/tipi-tabela-de-incidencia-do-imposto-sobre-produtos-industrializados",
  licenca: null,
  descricao: "Alíquotas do IPI por NCM e destaques Ex da TIPI.",
  isMock: false,
};

export const normalizeHeader = (v: unknown) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();

export interface ColumnMap {
  headerRow: number;
  ncm: number;
  ex: number | null;
  descricao: number | null;
  aliquota: number;
}

/**
 * Localiza o cabeçalho procurando uma linha com "NCM" e uma coluna de alíquota
 * ("ALÍQUOTA", "TEC" ou "II"). A posição exata varia entre versões da planilha.
 */
export function detectColumns(rows: unknown[][], rateHeaders: string[]): ColumnMap | null {
  for (let i = 0; i < Math.min(rows.length, 60); i++) {
    const cells = (rows[i] ?? []).map(normalizeHeader);
    const ncm = cells.findIndex((c) => c === "NCM" || c.startsWith("NCM "));
    const aliquota = cells.findIndex((c) =>
      rateHeaders.some((h) => c === h || c.startsWith(`${h} `) || c.startsWith(`${h}(`)),
    );
    if (ncm >= 0 && aliquota >= 0) {
      const ex = cells.findIndex((c) => c === "EX");
      const descricao = cells.findIndex((c) => c.startsWith("DESCRI"));
      return {
        headerRow: i,
        ncm,
        ex: ex >= 0 ? ex : null,
        descricao: descricao >= 0 ? descricao : null,
        aliquota,
      };
    }
  }
  return null;
}

export function cellValue(value: ExcelJS.CellValue): unknown {
  if (value && typeof value === "object") {
    if ("result" in value) return value.result;
    if ("richText" in value) return value.richText.map((t) => t.text).join("");
    if ("text" in value) return value.text;
  }
  return value;
}

export interface SheetRows {
  name: string;
  rows: unknown[][];
}

/** Lê todas as abas de uma planilha como matrizes de valores. */
export async function readWorkbook(path: string): Promise<SheetRows[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  return workbook.worksheets.map((sheet) => {
    const rows: unknown[][] = [];
    sheet.eachRow({ includeEmpty: true }, (row, index) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      rows[index - 1] = values.map((v) => cellValue(v as ExcelJS.CellValue));
    });
    return { name: sheet.name, rows: Array.from(rows, (r) => r ?? []) };
  });
}

async function readSheetRows(path: string): Promise<unknown[][]> {
  const [first] = await readWorkbook(path);
  if (!first) throw new Error("A planilha não tem abas.");
  return first.rows;
}

/**
 * Provedor para a TIPI (planilha "Tabela Completa" da Receita Federal):
 * colunas NCM / EX / DESCRIÇÃO / ALÍQUOTA (%), com o cabeçalho após linhas de título.
 */
export class OfficialTableProvider implements DataProvider<TaxDataRecord> {
  readonly kind = "tariffs" as const;
  readonly source = TIPI_SOURCE;
  private readonly tributo = "IPI" as const;

  constructor(
    private readonly path: string,
    private readonly atoLegal: string | null,
  ) {}

  async read(): Promise<ProviderBatch> {
    const rows = await readSheetRows(this.path);
    const headers = ["ALIQUOTA"];
    const map = detectColumns(rows, headers);
    if (!map) {
      throw new Error(
        `Cabeçalho não encontrado: procurei uma linha com "NCM" e ${headers.map((h) => `"${h}"`).join(" ou ")}.`,
      );
    }
    const records = rows.slice(map.headerRow + 1).map((cells) => ({
      ncm: cells[map.ncm],
      ex: map.ex === null ? null : cells[map.ex],
      descricao: map.descricao === null ? null : cells[map.descricao],
      aliquota: cells[map.aliquota],
    }));
    return { referenceDate: null, records };
  }

  validate(raw: unknown) {
    return parseOfficialTableRow(raw as Parameters<typeof parseOfficialTableRow>[0], {
      tributo: this.tributo,
      atoLegal: this.atoLegal,
    });
  }
}
