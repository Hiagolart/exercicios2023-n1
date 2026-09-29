import { describe, expect, it } from "vitest";
import { normalizeEndDate, parseSourceDate } from "./dates";

describe("parseSourceDate", () => {
  it("lê datas brasileiras e ISO", () => {
    expect(parseSourceDate("28/09/2026")?.toISOString()).toBe("2026-09-28T00:00:00.000Z");
    expect(parseSourceDate("2026-09-28T10:00:00Z")?.toISOString()).toBe("2026-09-28T00:00:00.000Z");
  });
  it("retorna null para vazio e undefined para inválido", () => {
    expect(parseSourceDate("")).toBeNull();
    expect(parseSourceDate(undefined)).toBeNull();
    expect(parseSourceDate("30/02/2026")).toBeUndefined();
    expect(parseSourceDate("ontem")).toBeUndefined();
    expect(parseSourceDate(20260928)).toBeUndefined();
  });
});

describe("normalizeEndDate", () => {
  it("trata 9999 como vigência sem término", () => {
    expect(normalizeEndDate(new Date(Date.UTC(9999, 11, 31)))).toBeNull();
    const date = new Date(Date.UTC(2026, 0, 1));
    expect(normalizeEndDate(date)).toBe(date);
  });
});
