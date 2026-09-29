import { describe, expect, it } from "vitest";
import {
  formatNcmCode,
  isFullNcmCode,
  isValidNcmCodeLength,
  ncmLevelOf,
  ncmStructureOf,
  normalizeNcmCode,
} from "./code";

describe("normalizeNcmCode", () => {
  it("remove pontuação e espaços", () => {
    expect(normalizeNcmCode(" 8427.10.90 ")).toBe("84271090");
    expect(normalizeNcmCode("84-27")).toBe("8427");
  });
});

describe("isValidNcmCodeLength", () => {
  it.each(["84", "8427", "84271", "842710", "8427109", "84271090"])("aceita %s", (code) => {
    expect(isValidNcmCodeLength(code)).toBe(true);
  });
  it.each(["", "8", "842", "842710901", "84a7"])("rejeita %s", (code) => {
    expect(isValidNcmCodeLength(code)).toBe(false);
  });
});

describe("ncmLevelOf", () => {
  it("mapeia o comprimento para o nível", () => {
    expect(ncmLevelOf("84")).toBe("capitulo");
    expect(ncmLevelOf("8427")).toBe("posicao");
    expect(ncmLevelOf("84271")).toBe("subposicao");
    expect(ncmLevelOf("842710")).toBe("subposicao");
    expect(ncmLevelOf("8427109")).toBe("item");
    expect(ncmLevelOf("84271090")).toBe("subitem");
    expect(ncmLevelOf("842")).toBeNull();
  });
});

describe("formatNcmCode", () => {
  it("formata cada nível na notação usual", () => {
    expect(formatNcmCode("84")).toBe("84");
    expect(formatNcmCode("8427")).toBe("84.27");
    expect(formatNcmCode("84271")).toBe("8427.1");
    expect(formatNcmCode("842710")).toBe("8427.10");
    expect(formatNcmCode("8427109")).toBe("8427.10.9");
    expect(formatNcmCode("84271090")).toBe("8427.10.90");
  });
  it("é idempotente para códigos já formatados", () => {
    expect(formatNcmCode("8427.10.90")).toBe("8427.10.90");
  });
});

describe("ncmStructureOf / isFullNcmCode", () => {
  it("decompõe um código completo", () => {
    expect(ncmStructureOf("84271090")).toEqual({
      capitulo: "84",
      posicao: "8427",
      subposicao: "842710",
    });
    expect(isFullNcmCode("84271090")).toBe(true);
    expect(isFullNcmCode("842710")).toBe(false);
  });
  it("retorna null para níveis inexistentes", () => {
    expect(ncmStructureOf("84")).toEqual({ capitulo: "84", posicao: null, subposicao: null });
  });
});
