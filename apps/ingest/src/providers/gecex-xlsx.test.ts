import { describe, expect, it } from "vitest";
import { validateTaxBatch } from "../pipeline/tax";
import { annexOf, buildGecexRows, findGecexHeader, GecexWorkbookProvider } from "./gecex-xlsx";
import type { SheetRows } from "./official-xlsx";

// Abas fictícias no mesmo layout da planilha oficial (códigos do capítulo 98).
const SHEETS: SheetRows[] = [
  {
    name: "Anexo I - TEC",
    rows: [
      ["Anexo I - Tarifa Externa Comum"],
      ["Capítulo 98"],
      ["NCM", "DESCRIÇÃO", "TEC (%)"],
      ["98.01", "Posição de teste"],
      ["9801.10.00", "-Produto A", 3.6],
      ["9801.20.00", "-Produto B", "12,6BK", "Resolução Gecex nº 1/2024"],
      ["Nota.", "texto"],
      ["NCM", "DESCRIÇÃO", "TEC (%)"],
      ["9801.30.00", "-Produto C", 18],
    ],
  },
  {
    name: "Anexo II - Diferentes da TEC",
    rows: [
      ["ANEXO II"],
      [
        "NCM",
        "Descrição",
        "TEC (%)",
        "BIT/BK",
        "Anexo III (%)",
        "Alíquota aplicada (%) ",
        "Fundamentação da alíquota aplicada",
        "Atos de inclusão",
      ],
      ["9801.10.00", "-Produto A", 3.6, "", null, 3.2, null, "272/2021; 391/2022"],
    ],
  },
  {
    name: "Anexo III - Setor Aeronáutico",
    rows: [
      ["NCM", "NCM"],
      ["9801.10", "9801.20"],
    ],
  },
  {
    name: "Anexo IX - DCC",
    rows: [
      ["ANEXO IX"],
      [
        "NCM",
        "Nº Ex",
        "Alíquota (%)",
        "Descrição",
        "Quota",
        "Unidade quota",
        "Início de vigência",
        "Término de vigência",
        "Ato de inclusão",
      ],
      [
        "9801.30.00",
        "-",
        25,
        "-Produto C",
        "-",
        "-",
        new Date("2026-06-26T00:00:00Z"),
        new Date("2027-06-25T00:00:00Z"),
        "Resolução Gecex nº 2",
      ],
      [
        "9801.30.00",
        "-",
        10.8,
        null,
        899250,
        "Quilogramas",
        new Date("2026-06-26T00:00:00Z"),
        new Date("2026-10-25T00:00:00Z"),
        "Resolução Gecex nº 2",
      ],
      [
        "9801.30.00",
        1,
        9,
        "Variante específica",
        "-",
        "-",
        new Date("2026-01-01T00:00:00Z"),
        "-",
        "Resolução Gecex nº 3",
      ],
    ],
  },
];

describe("findGecexHeader / annexOf", () => {
  it("mapeia colunas com grafias variadas", () => {
    expect(findGecexHeader(SHEETS[3]?.rows ?? [])?.cols).toMatchObject({
      ncm: 0,
      ex: 1,
      aliquota: 2,
      quota: 4,
      unidade: 5,
      inicio: 6,
      fim: 7,
      ato: 8,
    });
    expect(findGecexHeader(SHEETS[1]?.rows ?? [])?.cols).toMatchObject({
      aplicada: 5,
      fundamentacao: 6,
      ato: 7,
    });
  });
  it("identifica o anexo pelo nome da aba", () => {
    expect(annexOf("Anexo V - LETEC")).toBe("V");
    expect(annexOf("Anexo II - Diferentes da TEC")).toBe("II");
    expect(annexOf("Outra aba")).toBeNull();
  });
});

describe("GecexWorkbookProvider", () => {
  it("combina Anexos I e II, lê exceções com quota e destaques e ignora o Anexo III", async () => {
    const provider = new GecexWorkbookProvider("não usado");
    const result = await validateTaxBatch(provider, buildGecexRows(SHEETS));

    expect(result.rejected).toEqual([]);
    const base = result.rates.filter((r) => r.regime === "geral");
    expect(base.map((r) => [r.ncm, r.aliquota])).toEqual([
      ["98011000", 3.2],
      ["98012000", 12.6],
      ["98013000", 18],
    ]);
    expect(base[1]).toMatchObject({
      atoLegal: "Resolução Gecex nº 1/2024",
      observacao: "Bem de capital (BK) na TEC",
    });

    const excecoes = result.rates.filter((r) => r.regime === "excecao");
    expect(excecoes.map((r) => [r.aliquota, r.quota])).toEqual([
      [25, null],
      [10.8, "899.250 quilogramas"],
    ]);
    expect(result.destaques).toMatchObject([
      { ncm: "98013000", numero: "01", lista: "DCC (Anexo IX)", aliquota: 9 },
    ]);
  });

  it("exige a aba do Anexo I", () => {
    expect(() => buildGecexRows([])).toThrow("Anexo I");
  });
});
