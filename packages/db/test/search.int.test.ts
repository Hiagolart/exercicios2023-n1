import { parseNcmSearch } from "@comex/core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { PrismaClient } from "../src";
import { searchNcm } from "../src/repositories/search";
import { createTestDb, resetDb, seedNcm } from "./helpers";

// Nomenclatura fictícia, apenas para exercitar a busca.
const ROWS: [string, string][] = [
  ["98", "Máquinas de teste"],
  ["9801", "Empilhadeiras de teste; veículos para movimentação de carga"],
  ["980110", "Autopropulsadas, com motor elétrico"],
  ["98011010", "Com capacidade até 2 toneladas"],
  ["98011090", "Outras"],
  ["9802", "Paleteiras manuais de teste"],
  ["98020000", "Paleteiras manuais de teste"],
];

let db: PrismaClient;

beforeAll(async () => {
  db = createTestDb();
  await resetDb(db);
  await seedNcm(db, ROWS);
});
afterAll(async () => {
  await db.$disconnect();
});

const search = (term: string) => searchNcm(db, parseNcmSearch(term));

describe("searchNcm", () => {
  it("busca código por prefixo, do nível mais alto para o mais baixo", async () => {
    const result = await search("9801.10");
    expect(result.estrategia).toBe("codigo");
    expect(result.hits.map((h) => h.codigo)).toEqual(["980110", "98011010", "98011090"]);
  });

  it("encontra subitens genéricos pela descrição dos ancestrais", async () => {
    const result = await search("empilhadeira elétrica");
    expect(result.estrategia).toBe("texto");
    const codes = result.hits.map((h) => h.codigo);
    expect(codes).toContain("98011090");
    expect(codes.indexOf("98011010")).toBeLessThan(codes.indexOf("980110"));
  });

  it("ignora acentos e plural", async () => {
    const result = await search("eletricas autopropulsada");
    expect(result.hits.map((h) => h.codigo)).toContain("980110");
  });

  it("usa busca aproximada quando há erro de digitação", async () => {
    const result = await search("paleteria");
    expect(result.estrategia).toBe("aproximada");
    expect(result.hits.map((h) => h.codigo)).toContain("98020000");
  });

  it("inclui capítulo, posição e subposição de cada resultado", async () => {
    const [hit] = (await search("98011010")).hits;
    expect(hit).toMatchObject({
      codigo: "98011010",
      nivel: "subitem",
      isMock: true,
      capitulo: { codigo: "98", descricao: "Máquinas de teste" },
      posicao: { codigo: "9801" },
      subposicao: { codigo: "980110", descricao: "Autopropulsadas, com motor elétrico" },
    });
  });

  it("não quebra com caracteres especiais e retorna vazio sem correspondência", async () => {
    const result = await search("'; DROP TABLE ncm_node; --");
    expect(result.hits).toEqual([]);
    expect(await db.ncmNode.count()).toBe(ROWS.length);
    expect((await search("xyzxyzxyz")).estrategia).toBe("nenhuma");
  });
});
