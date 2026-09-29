import { readFile } from "node:fs/promises";
import { getNcmPath, listNcmChildren, type PrismaClient } from "@comex/db";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { runNcmIngestion } from "../src/pipeline/ncm";
import { ClassifNcmProvider } from "../src/providers/classif";
import { createTestDb, resetDb } from "./db";

const fixture = new URL("./fixtures/classif-sample.json", import.meta.url);
const fromFixture = () => new ClassifNcmProvider(() => readFile(fixture, "utf8"));

let db: PrismaClient;

beforeAll(() => {
  db = createTestDb();
});
afterAll(async () => {
  await db.$disconnect();
});
beforeEach(async () => {
  await resetDb(db);
});

describe("runNcmIngestion", () => {
  it("grava a hierarquia e o relatório da carga", async () => {
    const report = await runNcmIngestion(db, fromFixture(), { fileHash: "abc" });

    expect(report).toMatchObject({ processados: 7, inseridos: 5, atualizados: 0, rejeitados: 2 });

    const chapters = await listNcmChildren(db, null);
    expect(chapters.map((c) => [c.codigo, c.childCount])).toEqual([["98", 1]]);
    expect((await listNcmChildren(db, "9801")).map((c) => c.codigo)).toEqual([
      "980110",
      "98019000",
    ]);
    expect((await getNcmPath(db, "98011000")).map((p) => p.codigo)).toEqual([
      "98",
      "9801",
      "980110",
      "98011000",
    ]);

    const run = await db.ingestionRun.findFirstOrThrow({ include: { errors: true } });
    expect(run).toMatchObject({ status: "succeeded", fileHash: "abc", rejeitados: 2 });
    expect(run.referenceDate?.toISOString().slice(0, 10)).toBe("2026-09-15");
    expect(run.errors).toHaveLength(2);
  });

  it("é idempotente e detecta alterações", async () => {
    await runNcmIngestion(db, fromFixture());
    const second = await runNcmIngestion(db, fromFixture());
    expect(second).toMatchObject({ inseridos: 0, atualizados: 0, inalterados: 5 });

    const changed = new ClassifNcmProvider(async () => {
      const json = JSON.parse(await readFile(fixture, "utf8"));
      json.Nomenclaturas[1].Descricao = "Posição de teste (alterada)";
      return JSON.stringify(json);
    });
    const third = await runNcmIngestion(db, changed);
    expect(third).toMatchObject({ inseridos: 0, atualizados: 1, inalterados: 4 });
  });

  it("marca a execução como falha quando a leitura falha", async () => {
    const broken = new ClassifNcmProvider(async () => {
      throw new Error("rede indisponível");
    });
    await expect(runNcmIngestion(db, broken)).rejects.toThrow("rede indisponível");
    const run = await db.ingestionRun.findFirstOrThrow();
    expect(run).toMatchObject({ status: "failed", errorMessage: "rede indisponível" });
  });
});
