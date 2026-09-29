import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { parse } from "csv-parse/sync";
import {
  parseTaxTemplateRow,
  type DataProvider,
  type ProviderBatch,
  type SourceMetadata,
  type TaxDataRecord,
} from "@comex/core";

/** Separador do CSV pela linha de cabeçalho: ";" (padrão do Excel em português) ou ",". */
export function detectDelimiter(content: string): ";" | "," {
  const header = content.split(/\r?\n/, 1)[0] ?? "";
  return header.split(";").length >= header.split(",").length ? ";" : ",";
}

/** Lê linhas do modelo próprio de tributos (CSV com cabeçalho ou JSON com lista de objetos). */
export async function readTemplateRows(path: string): Promise<Record<string, unknown>[]> {
  const content = await readFile(path, "utf8");
  if (extname(path).toLowerCase() === ".json") {
    const json: unknown = JSON.parse(content);
    if (!Array.isArray(json)) throw new Error("O JSON deve ser uma lista de objetos.");
    return json as Record<string, unknown>[];
  }
  return parse(content, {
    delimiter: detectDelimiter(content),
    columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as Record<string, unknown>[];
}

/** Provedor para arquivos no modelo próprio. A fonte é declarada por quem faz a carga. */
export class TaxTemplateProvider implements DataProvider<TaxDataRecord> {
  readonly kind = "tariffs" as const;

  constructor(
    readonly source: SourceMetadata,
    private readonly path: string,
  ) {}

  async read(): Promise<ProviderBatch> {
    return { referenceDate: null, records: await readTemplateRows(this.path) };
  }

  validate(raw: unknown) {
    return parseTaxTemplateRow(raw as Record<string, unknown>);
  }
}
