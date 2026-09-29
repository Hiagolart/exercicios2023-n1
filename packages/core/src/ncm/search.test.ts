import { describe, expect, it } from "vitest";
import { ncmSearchQuerySchema, ncmTreeQuerySchema, parseNcmSearch } from "./search";

describe("parseNcmSearch", () => {
  it("reconhece códigos com ou sem pontuação", () => {
    expect(parseNcmSearch("8427.10.90")).toEqual({ kind: "codigo", digits: "84271090" });
    expect(parseNcmSearch(" 8427 10 ")).toEqual({ kind: "codigo", digits: "842710" });
    expect(parseNcmSearch("84")).toEqual({ kind: "codigo", digits: "84" });
  });

  it("trata o restante como texto, normalizando espaços", () => {
    expect(parseNcmSearch("  empilhadeira   elétrica ")).toEqual({
      kind: "texto",
      text: "empilhadeira elétrica",
    });
    expect(parseNcmSearch("motor 12V")).toEqual({ kind: "texto", text: "motor 12V" });
  });

  it("rejeita termos curtos, longos ou códigos impossíveis", () => {
    expect(parseNcmSearch("a").kind).toBe("invalido");
    expect(parseNcmSearch("x".repeat(121)).kind).toBe("invalido");
    expect(parseNcmSearch("842710901").kind).toBe("invalido");
    expect(parseNcmSearch("8").kind).toBe("invalido");
  });
});

describe("schemas de consulta", () => {
  it("aplica limite padrão e máximo", () => {
    expect(ncmSearchQuerySchema.parse({ q: "motor" }).limit).toBe(50);
    expect(ncmSearchQuerySchema.safeParse({ q: "motor", limit: "500" }).success).toBe(false);
  });

  it("valida o parâmetro da árvore", () => {
    expect(ncmTreeQuerySchema.parse({}).parent).toBeNull();
    expect(ncmTreeQuerySchema.parse({ parent: "84.27" }).parent).toBe("8427");
    expect(ncmTreeQuerySchema.safeParse({ parent: "842" }).success).toBe(false);
  });
});
