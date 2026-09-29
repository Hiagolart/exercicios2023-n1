import ExcelJS from "exceljs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

/** Gera uma planilha de teste com linhas de título antes do cabeçalho, como nas tabelas oficiais. */
export async function writeSheet(rows: (string | number | null)[][]): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tabela");
  for (const row of rows) sheet.addRow(row);
  const dir = await mkdtemp(join(tmpdir(), "comex-xlsx-"));
  const path = join(dir, "tabela.xlsx");
  await workbook.xlsx.writeFile(path);
  return path;
}

// Planilha fictícia no formato NCM / EX / DESCRIÇÃO / ALÍQUOTA (%).
export const TIPI_ROWS: (string | number | null)[][] = [
  ["TABELA DE TESTE"],
  [null],
  ["NCM", "EX", "DESCRIÇÃO", "ALÍQUOTA (%)"],
  ["98.01", null, "Posição de teste", null],
  ["9801.10.00", null, "- Produto de teste", "6,5"],
  ["9801.10.00", "01", "-- Variante específica", "0"],
  ["9801.90.00", null, "- Outros", "NT"],
  ["9801.20.00", null, "- Linha com erro", "abc"],
];

/** Gera uma planilha com várias abas. */
export async function writeWorkbook(
  sheets: { name: string; rows: unknown[][] }[],
): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  for (const sheet of sheets) {
    const ws = workbook.addWorksheet(sheet.name);
    for (const row of sheet.rows) ws.addRow(row);
  }
  const dir = await mkdtemp(join(tmpdir(), "comex-xlsx-"));
  const path = join(dir, "anexos.xlsx");
  await workbook.xlsx.writeFile(path);
  return path;
}
