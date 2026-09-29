import { describe, expect, it } from "vitest";
import { formatBRL, formatRate, parseBrNumber, rateOrigin } from "./tax-format";

describe("formatRate", () => {
  it("formata percentuais, NT e ausência de dado", () => {
    expect(formatRate({ tipo: "ad_valorem", aliquota: 12.5 })).toBe("12,5%");
    expect(formatRate({ tipo: "ad_valorem", aliquota: 9.65 })).toBe("9,65%");
    expect(formatRate({ tipo: "nao_tributado", aliquota: null })).toBe("NT (não tributado)");
    expect(formatRate(null)).toBe("Não disponível na base");
  });
});

describe("rateOrigin", () => {
  it("descreve a origem da alíquota", () => {
    expect(rateOrigin({ regime: "excecao", lista: "LETEC" })).toBe("Exceção: LETEC");
    expect(rateOrigin({ regime: "regra_geral", lista: null })).toBe("Regra geral");
    expect(rateOrigin({ regime: "geral", lista: null })).toBe("Alíquota da NCM");
  });
});

describe("parseBrNumber", () => {
  it.each([
    ["10.000,50", 10000.5],
    ["10000,5", 10000.5],
    ["10000.50", 10000.5],
    ["1.234.567", 1234567],
    ["1,234.56", 1234.56],
    ["5,4321", 5.4321],
    ["", 0],
  ])("%s → %d", (input, expected) => {
    expect(parseBrNumber(input)).toBe(expected);
  });

  it("rejeita texto", () => {
    expect(parseBrNumber("dez")).toBeNaN();
  });
});

describe("formatBRL", () => {
  it("usa o formato de moeda brasileiro", () => {
    expect(formatBRL(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  });
});
