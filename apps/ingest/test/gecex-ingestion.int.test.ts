import { listDestaquesForNcm, listRatesForNcm, type PrismaClient } from "@comex/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runTaxIngestion } from "../src/pipeline/tax";
import { GecexWorkbookProvider } from "../src/providers/gecex-xlsx";
import { createTestDb, resetDb } from "./db";
import { writeWorkbook } from "./xlsx";

let db: PrismaClient;
const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

// Planilha fictícia no layout da "Anexos I a X da Res. Gecex 272/2021".
const anexoI = {
  name: "Anexo I - TEC",
  rows: [
    ["Anexo I"],
    ["NCM", "DESCRIÇÃO", "TEC (%)"],
    ["9801.10.00", "-Produto A", 3.6],
    ["9801.30.00", "-Produto C", "12,6BK"],
  ],
};
const dccHeader = [
  "NCM",
  "Nº Ex",
  "Alíquota (%)",
  "Descrição",
  "Quota",
  "Unidade quota",
  "Início de vigência",
  "Término de vigência",
  "Ato de inclusão",
];
const dccRows = [
  [
    "9801.30.00",
    "-",
    25,
    "-Produto C",
    "-",
    "-",
    d("2026-06-26"),
    d("2027-06-25"),
    "Resolução de teste nº 1",
  ],
  [
    "9801.30.00",
    "-",
    10.8,
    null,
    899250,
    "Quilogramas",
    d("2026-06-26"),
    d("2026-10-25"),
    "Resolução de teste nº 1",
  ],
  [
    "9801.30.00",
    1,
    9,
    "Variante específica",
    "-",
    "-",
    d("2026-01-01"),
    "-",
    "Resolução de teste nº 2",
  ],
];
const workbook = (rows: unknown[][]) =>
  writeWorkbook([anexoI, { name: "Anexo IX - DCC", rows: [["Anexo IX"], dccHeader, ...rows] }]);

beforeAll(() => {
  db = createTestDb();
});
afterAll(async () => {
  await db.$disconnect();
});
beforeEach(async () => {
  await resetDb(db);
});

describe("carga da planilha Gecex", () => {
  it("grava base, exceções com quota e destaques, e é idempotente", async () => {
    const path = await workbook(dccRows);
    const first = await runTaxIngestion(db, new GecexWorkbookProvider(path), {
      referencia: d("2026-09-25"),
    });
    expect(first).toMatchObject({ inseridos: 5, rejeitados: 0 });

    const again = await runTaxIngestion(db, new GecexWorkbookProvider(path), {
      referencia: d("2026-09-26"),
    });
    expect(again).toMatchObject({ inseridos: 0, atualizados: 0, inalterados: 5 });

    const rates = await listRatesForNcm(db, "98013000");
    expect(rates.map((r) => [r.regime, r.aliquota, r.quota]).sort()).toEqual([
      ["excecao", 10.8, "899.250 quilogramas"],
      ["excecao", 25, null],
      ["geral", 12.6, null],
    ]);
    expect(await listDestaquesForNcm(db, "98013000")).toMatchObject([
      { numero: "01", lista: "DCC (Anexo IX)", aliquota: 9 },
    ]);
  });

  it("encerra exceções revogadas e remove destaques que saíram da lista", async () => {
    await runTaxIngestion(db, new GecexWorkbookProvider(await workbook(dccRows)), {
      referencia: d("2026-09-25"),
    });
    const revoked = await runTaxIngestion(
      db,
      new GecexWorkbookProvider(await workbook(dccRows.slice(1, 2))),
      {
        referencia: d("2026-10-01"),
      },
    );
    expect(revoked).toMatchObject({ inalterados: 3 });

    const excecao25 = (await listRatesForNcm(db, "98013000")).find((r) => r.aliquota === 25);
    expect(excecao25?.vigenciaFim?.toISOString().slice(0, 10)).toBe("2026-09-30");
    expect(await listDestaquesForNcm(db, "98013000")).toEqual([]);
  });
});
