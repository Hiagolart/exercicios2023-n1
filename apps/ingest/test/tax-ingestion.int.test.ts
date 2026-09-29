import { listDestaquesForNcm, listRatesForNcm, type PrismaClient } from "@comex/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runTaxIngestion } from "../src/pipeline/tax";
import { OfficialTableProvider } from "../src/providers/official-xlsx";
import { createTestDb, resetDb } from "./db";
import { TIPI_ROWS, writeSheet } from "./xlsx";

let db: PrismaClient;
const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

beforeAll(() => {
  db = createTestDb();
});
afterAll(async () => {
  await db.$disconnect();
});
beforeEach(async () => {
  await resetDb(db);
});

describe("runTaxIngestion", () => {
  it("grava alíquotas e destaques com o relatório da carga", async () => {
    const provider = new OfficialTableProvider(
      "IPI",
      await writeSheet(TIPI_ROWS),
      "Decreto de teste",
    );
    const report = await runTaxIngestion(db, provider, { referencia: d("2026-09-01") });

    expect(report).toMatchObject({ processados: 5, inseridos: 3, rejeitados: 1, ignorados: 1 });
    const rates = await listRatesForNcm(db, "98011000");
    expect(rates).toMatchObject([
      { tributo: "IPI", aliquota: 6.5, atoLegal: "Decreto de teste", vigenciaFim: null },
    ]);
    expect(await listDestaquesForNcm(db, "98011000")).toMatchObject([
      { numero: "01", aliquota: 0 },
    ]);

    const run = await db.ingestionRun.findFirstOrThrow({ where: { sourceId: "rfb-tipi" } });
    expect(run).toMatchObject({ status: "succeeded", ignorados: 1, rejeitados: 1 });
  });

  it("forma o histórico quando a alíquota muda entre cargas", async () => {
    const v1 = await writeSheet(TIPI_ROWS);
    const v2 = await writeSheet(
      TIPI_ROWS.map((row) =>
        row[0] === "9801.10.00" && row[1] === null ? [row[0], null, row[2] ?? null, "9,75"] : row,
      ),
    );

    await runTaxIngestion(db, new OfficialTableProvider("IPI", v1, null), {
      referencia: d("2026-01-10"),
    });
    const repeat = await runTaxIngestion(db, new OfficialTableProvider("IPI", v1, null), {
      referencia: d("2026-05-10"),
    });
    expect(repeat).toMatchObject({ inseridos: 1, atualizados: 0, inalterados: 2 });

    const changed = await runTaxIngestion(db, new OfficialTableProvider("IPI", v2, null), {
      referencia: d("2026-09-01"),
    });
    expect(changed).toMatchObject({ atualizados: 1, inalterados: 1 });

    const history = (await listRatesForNcm(db, "98011000")).map((r) => ({
      aliquota: r.aliquota,
      inicio: r.vigenciaInicio?.toISOString().slice(0, 10) ?? null,
      fim: r.vigenciaFim?.toISOString().slice(0, 10) ?? null,
      inferida: r.vigenciaInferida,
    }));
    expect(history).toEqual([
      { aliquota: 9.75, inicio: "2026-09-01", fim: null, inferida: true },
      { aliquota: 6.5, inicio: null, fim: "2026-08-31", inferida: false },
    ]);
  });
});
