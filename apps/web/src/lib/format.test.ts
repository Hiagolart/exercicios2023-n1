import { describe, expect, it } from "vitest";
import { formatDate, formatInteger, formatTime, relativeDayLabel } from "./format";

describe("format", () => {
  it("formata datas de calendário sem deslocamento de fuso", () => {
    expect(formatDate(new Date(Date.UTC(2026, 8, 28)))).toBe("28/09/2026");
    expect(formatDate(null)).toBeNull();
  });
  it("usa separador de milhar brasileiro", () => {
    expect(formatInteger(10512)).toBe("10.512");
  });
});

describe("relativeDayLabel", () => {
  const now = new Date("2026-09-29T15:00:00Z"); // 12:00 em Brasília

  it("usa Hoje e Ontem no horário de Brasília", () => {
    expect(relativeDayLabel(new Date("2026-09-29T03:30:00Z"), now)).toBe("Hoje");
    expect(relativeDayLabel(new Date("2026-09-29T02:30:00Z"), now)).toBe("Ontem");
  });

  it("mostra a data para dias anteriores", () => {
    expect(relativeDayLabel(new Date("2026-09-20T15:00:00Z"), now)).toBe("20/09/2026");
  });

  it("formata a hora local", () => {
    expect(formatTime(new Date("2026-09-29T17:32:00Z"))).toBe("14:32");
  });
});
