import { describe, expect, it } from "vitest";
import { parseRateValue } from "./parse-rate";

describe("parseRateValue", () => {
  it("lê percentuais nos formatos das tabelas oficiais", () => {
    expect(parseRateValue("14")).toEqual({ tipo: "ad_valorem", aliquota: 14 });
    expect(parseRateValue("12,5")).toEqual({ tipo: "ad_valorem", aliquota: 12.5 });
    expect(parseRateValue(" 3.25 % ")).toEqual({ tipo: "ad_valorem", aliquota: 3.25 });
    expect(parseRateValue(0)).toEqual({ tipo: "ad_valorem", aliquota: 0 });
  });
  it("reconhece NT", () => {
    expect(parseRateValue("nt")).toEqual({ tipo: "nao_tributado", aliquota: null });
  });
  it("rejeita valores inválidos", () => {
    expect(parseRateValue("abc")).toHaveProperty("erro");
    expect(parseRateValue("")).toHaveProperty("erro");
    expect(parseRateValue(-1)).toHaveProperty("erro");
    expect(parseRateValue(null)).toHaveProperty("erro");
  });
});
