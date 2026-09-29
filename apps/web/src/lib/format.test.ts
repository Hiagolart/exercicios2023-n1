import { describe, expect, it } from "vitest";
import { formatDate, formatInteger } from "./format";

describe("format", () => {
  it("formata datas de calendário sem deslocamento de fuso", () => {
    expect(formatDate(new Date(Date.UTC(2026, 8, 28)))).toBe("28/09/2026");
    expect(formatDate(null)).toBeNull();
  });
  it("usa separador de milhar brasileiro", () => {
    expect(formatInteger(10512)).toBe("10.512");
  });
});
