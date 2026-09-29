import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { ClassifNcmProvider } from "../providers/classif";
import { MockNcmProvider } from "../providers/mock";
import { validateNcmBatch } from "./validate";

const fixture = new URL("../../test/fixtures/classif-sample.json", import.meta.url);

describe("validateNcmBatch", () => {
  it("separa válidos, inválidos e duplicados", async () => {
    const provider = new ClassifNcmProvider(() => readFile(fixture, "utf8"));
    const batch = await provider.read();
    const result = await validateNcmBatch(provider, batch);

    expect(batch.referenceDate?.toISOString()).toBe("2026-09-15T00:00:00.000Z");
    expect(result.processados).toBe(7);
    expect(result.valid.map((r) => r.codigo)).toEqual([
      "98",
      "9801",
      "980110",
      "98011000",
      "98019000",
    ]);
    expect(result.rejected.map((r) => r.linha)).toEqual([6, 7]);
    expect(result.rejected[0]?.issues[0]?.motivo).toContain("duplicado");
  });

  it("valida o provedor fictício sem rejeições", async () => {
    const provider = new MockNcmProvider();
    const result = await validateNcmBatch(provider, await provider.read());
    expect(result.rejected).toHaveLength(0);
    expect(provider.source.isMock).toBe(true);
    expect(result.valid.every((r) => r.descricao.startsWith("[FICTÍCIO]"))).toBe(true);
  });
});

describe("ClassifNcmProvider.read", () => {
  it("falha com mensagem clara para JSON inválido", async () => {
    const provider = new ClassifNcmProvider(async () => "<html>");
    await expect(provider.read()).rejects.toThrow("não é um JSON válido");
  });

  it("falha quando a estrutura não é reconhecida", async () => {
    const provider = new ClassifNcmProvider(async () => JSON.stringify({ outra: [] }));
    await expect(provider.read()).rejects.toThrow("Lista de nomenclaturas não encontrada");
  });
});
