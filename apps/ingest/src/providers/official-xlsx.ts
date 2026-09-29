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

export const TEC_SOURCE: SourceMetadata = {
  id: "camex-tec",
  nome: "Camex — Tarifa Externa Comum (Res. Gecex 272/2021, Anexo I)",
  url: "https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes",
  licenca: null,
  descricao: "Alíquotas do Imposto de Importação por NCM.",
  isMock: false,
};

const normalize = (v: unknown) =>
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
    const cells = (rows[i] ?? []).map(normalize);
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

function cellValue(value: ExcelJS.CellValue): unknown {
  if (value && typeof value === "object") {
    if ("result" in value) return value.result;
    if ("richText" in value) return value.richText.map((t) => t.text).join("");
    if ("text" in value) return value.text;
  }
  return value;
}

async function readSheetRows(path: string): Promise<unknown[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path);
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("A planilha não tem abas.");
  const rows: unknown[][] = [];
  sheet.eachRow({ includeEmpty: true }, (row, index) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    rows[index - 1] = values.map((v) => cellValue(v as ExcelJS.CellValue));
  });
  return rows.map((r) => r ?? []);
}

/**
 * Provedor para as planilhas oficiais da TIPI (IPI) e da TEC (II).
 * O layout ainda precisa ser conferido com os arquivos reais (Fase 0);
 * a detecção de cabeçalho tolera variações de posição e de grafia.
 */
export class OfficialTableProvider implements DataProvider<TaxDataRecord> {
  readonly kind = "tariffs" as const;
  readonly source: SourceMetadata;

  constructor(
    private readonly tributo: "II" | "IPI",
    private readonly path: string,
    private readonly atoLegal: string | null,
  ) {
    this.source = tributo === "IPI" ? TIPI_SOURCE : TEC_SOURCE;
  }

  async read(): Promise<ProviderBatch> {
    const rows = await readSheetRows(this.path);
    const headers = this.tributo === "IPI" ? ["ALIQUOTA"] : ["TEC", "ALIQUOTA", "II"];
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
