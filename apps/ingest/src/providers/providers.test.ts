import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TIPI_ROWS, writeSheet } from "../../test/xlsx";
import { validateTaxBatch } from "../pipeline/tax";
import { detectColumns, OfficialTableProvider } from "./official-xlsx";
import { detectDelimiter, readTemplateRows, TaxTemplateProvider } from "./tax-template";

describe("detectColumns", () => {
  it("encontra o cabeçalho fora da primeira linha e com acentos", () => {
    expect(
      detectColumns([["Título"], [], ["NCM", "Ex", "Descrição", "Alíquota (%)"]], ["ALIQUOTA"]),
    ).toEqual({
      headerRow: 2,
      ncm: 0,
      ex: 1,
      descricao: 2,
      aliquota: 3,
    });
  });

  it("aceita a coluna TEC e dispensa EX", () => {
    expect(detectColumns([["NCM", "DESCRIÇÃO", "TEC (%)"]], ["TEC", "ALIQUOTA"])).toMatchObject({
      ex: null,
      aliquota: 2,
    });
  });

  it("retorna null sem cabeçalho reconhecível", () => {
    expect(detectColumns([["Código", "Valor"]], ["ALIQUOTA"])).toBeNull();
  });
});

describe("OfficialTableProvider", () => {
  it("lê a planilha e separa alíquotas, destaques, linhas ignoradas e erros", async () => {
    const provider = new OfficialTableProvider(await writeSheet(TIPI_ROWS), "Decreto de teste");
    const batch = await provider.read();
    const result = await validateTaxBatch(provider, batch.records);

    expect(result.processados).toBe(5);
    expect(result.ignorados).toBe(1);
    expect(result.rates.map((r) => [r.ncm, r.tipo, r.aliquota])).toEqual([
      ["98011000", "ad_valorem", 6.5],
      ["98019000", "nao_tributado", null],
    ]);
    expect(result.destaques).toMatchObject([
      { ncm: "98011000", numero: "01", descricao: "Variante específica", aliquota: 0 },
    ]);
    expect(result.rejected).toHaveLength(1);
    expect(provider.source.id).toBe("rfb-tipi");
  });

  it("explica quando o cabeçalho não existe", async () => {
    const provider = new OfficialTableProvider(await writeSheet([["Sem cabeçalho"]]), null);
    await expect(provider.read()).rejects.toThrow("Cabeçalho não encontrado");
  });
});

describe("TaxTemplateProvider", () => {
  const source = {
    id: "arquivo-teste",
    nome: "Teste",
    url: null,
    licenca: null,
    descricao: "",
    isMock: true,
  };

  it("detecta o separador", () => {
    expect(detectDelimiter("ncm;tributo;aliquota\n1;2;3")).toBe(";");
    expect(detectDelimiter("ncm,tributo,aliquota\n")).toBe(",");
  });

  it("lê CSV com vírgulas dentro de campos entre aspas", async () => {
    const path = join(tmpdir(), `modelo-${Date.now()}.csv`);
    await writeFile(
      path,
      'NCM;Tributo;Aliquota;Observacao\n98011000;II;14;"texto, com vírgula"\n;PIS;2,1;\n',
    );
    const rows = await readTemplateRows(path);
    expect(rows[0]).toMatchObject({ ncm: "98011000", observacao: "texto, com vírgula" });
    const result = await validateTaxBatch(new TaxTemplateProvider(source, path), rows);
    expect(result.rates.map((r) => [r.ncm, r.regime, r.aliquota])).toEqual([
      ["98011000", "geral", 14],
      [null, "regra_geral", 2.1],
    ]);
  });

  it("lê JSON e rejeita alíquotas repetidas", async () => {
    const path = join(tmpdir(), `modelo-${Date.now()}.json`);
    const row = { ncm: "98011000", tributo: "II", aliquota: "14" };
    await writeFile(path, JSON.stringify([row, row]));
    const provider = new TaxTemplateProvider(source, path);
    const result = await validateTaxBatch(provider, (await provider.read()).records);
    expect(result.rates).toHaveLength(1);
    expect(result.rejected[0]?.issues[0]?.motivo).toContain("repetida");
  });
});
