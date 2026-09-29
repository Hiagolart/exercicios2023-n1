import { describe, expect, it } from "vitest";
import { formatReport } from "./report";

describe("formatReport", () => {
  it("lista contagens e limita os erros exibidos", () => {
    const erros = Array.from({ length: 25 }, (_, i) => ({
      linha: i + 1,
      issues: [{ campo: "codigo", motivo: "inválido" }],
    }));
    const text = formatReport({
      sourceId: "x",
      processados: 30,
      inseridos: 5,
      atualizados: 0,
      inalterados: 0,
      rejeitados: 25,
      erros,
    });
    expect(text).toContain("Rejeitados:   25");
    expect(text).toContain("linha 20: codigo — inválido");
    expect(text).not.toContain("linha 21:");
    expect(text).toContain("e mais 5 registro(s)");
  });
});
