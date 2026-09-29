import { describe, expect, it } from "vitest";
import { simulateImportTaxes, validateSimulationInput, type SimulationInput } from "./simulator";

const base: SimulationInput = {
  fob: 10_000,
  frete: 1_000,
  seguro: 100,
  cambio: 5.5,
  aliquotas: { II: 14, IPI: 10, PIS: 2.1, COFINS: 9.65, ICMS: 18 },
  despesasAduaneiras: 154.23,
};

describe("simulateImportTaxes", () => {
  // Valores conferidos manualmente:
  // VA = 11.100 × 5,5 = 61.050,00
  // II = 61.050,00 × 14% = 8.547,00
  // IPI = (61.050,00 + 8.547,00) × 10% = 6.959,70
  // PIS = 61.050,00 × 2,1% = 1.282,05
  // Cofins = 61.050,00 × 9,65% = 5.891,325 → 5.891,33
  // Base ICMS = (61.050 + 8.547 + 6.959,70 + 1.282,05 + 5.891,33 + 154,23) ÷ 0,82 = 102.297,94
  // ICMS = 102.297,94 × 18% = 18.413,6292 → 18.413,63
  it("calcula cada tributo conforme a legislação", () => {
    const r = simulateImportTaxes(base);
    expect(r.valorAduaneiro).toBe(61050);
    expect(Object.fromEntries(r.linhas.map((l) => [l.tributo, [l.base, l.valor]]))).toEqual({
      II: [61050, 8547],
      IPI: [69597, 6959.7],
      PIS: [61050, 1282.05],
      COFINS: [61050, 5891.33],
      ICMS: [102297.94, 18413.63],
    });
    expect(r.totalFederais).toBe(22680.08);
    expect(r.totalTributos).toBe(41093.71);
  });

  it("tem custo total igual à base do ICMS (propriedade do cálculo por dentro)", () => {
    const r = simulateImportTaxes(base);
    expect(r.custoTotal).toBe(r.linhas.find((l) => l.tributo === "ICMS")?.base);
  });

  it("trata IPI não tributado (NT) como zero", () => {
    const r = simulateImportTaxes({ ...base, aliquotas: { ...base.aliquotas, IPI: null } });
    expect(r.linhas.find((l) => l.tributo === "IPI")).toMatchObject({ aliquota: null, valor: 0 });
  });

  it("evita erro de ponto flutuante", () => {
    const r = simulateImportTaxes({ ...base, fob: 0.1, frete: 0.2, seguro: 0, cambio: 1 });
    expect(r.valorAduaneiro).toBe(0.3);
  });

  it("zera tudo quando o valor é zero", () => {
    const r = simulateImportTaxes({ ...base, fob: 0, frete: 0, seguro: 0, despesasAduaneiras: 0 });
    expect(r.totalTributos).toBe(0);
  });
});

describe("validateSimulationInput", () => {
  it("rejeita valores negativos, câmbio zero e alíquotas fora do intervalo", () => {
    const result = validateSimulationInput({
      ...base,
      fob: -1,
      cambio: 0,
      aliquotas: { ...base.aliquotas, II: 120, ICMS: 100 },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.erros).toEqual([
      "Valor FOB deve ser um número maior ou igual a zero.",
      "Taxa de câmbio deve ser maior que zero.",
      "Alíquota de II deve estar entre 0 e 100.",
      "Alíquota de ICMS deve ser menor que 100.",
    ]);
  });

  it("lança erro ao simular com entrada inválida", () => {
    expect(() => simulateImportTaxes({ ...base, cambio: Number.NaN })).toThrow("câmbio");
  });
});
