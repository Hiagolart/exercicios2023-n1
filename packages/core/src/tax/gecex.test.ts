import { describe, expect, it } from "vitest";
import { parseGecexRow, parseTecValue, type GecexExceptionRow } from "./gecex";

describe("parseTecValue", () => {
  it("lê números e marcas BK/BIT", () => {
    expect(parseTecValue(3.6)).toEqual({ aliquota: 3.6, marcador: null });
    expect(parseTecValue("12,6BK")).toEqual({ aliquota: 12.6, marcador: "BK" });
    expect(parseTecValue("0BIT")).toEqual({ aliquota: 0, marcador: "BIT" });
    expect(parseTecValue("x")).toHaveProperty("erro");
  });
});

describe("parseGecexRow — alíquota base", () => {
  it("usa a TEC quando não há Anexo II", () => {
    expect(
      parseGecexRow({
        kind: "base",
        ncm: "9801.10.00",
        tec: "12,6BK",
        atoTec: null,
        anexoII: null,
      }),
    ).toMatchObject({
      ok: true,
      value: {
        rate: {
          ncm: "98011000",
          tributo: "II",
          regime: "geral",
          aliquota: 12.6,
          atoLegal: "Resolução Gecex nº 272/2021, Anexo I",
          observacao: "Bem de capital (BK) na TEC",
        },
      },
    });
  });

  it("aplica o Anexo II e registra a diferença para a TEC", () => {
    const result = parseGecexRow({
      kind: "base",
      ncm: "9801.10.00",
      tec: 3.6,
      atoTec: null,
      anexoII: { aplicada: 3.2, fundamentacao: null, atos: "272/2021; 391/2022" },
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        rate: {
          aliquota: 3.2,
          atoLegal: "Resolução Gecex nº 272/2021, Anexo II (atos: 272/2021; 391/2022)",
          observacao: "TEC do Mercosul: 3,6%; o Brasil aplica 3,2% (Anexo II).",
        },
      },
    });
  });

  it("ignora linhas que não são subitens", () => {
    expect(
      parseGecexRow({ kind: "base", ncm: "98.01", tec: null, atoTec: null, anexoII: null }),
    ).toEqual({
      ok: true,
      value: { kind: "ignorar" },
    });
  });
});

describe("parseGecexRow — exceções", () => {
  const row = (p: Partial<GecexExceptionRow> = {}): GecexExceptionRow => ({
    kind: "excecao",
    anexo: "IX",
    ncm: "9801.10.00",
    ex: "-",
    descricao: "Produto de teste",
    aliquota: 25,
    quota: "-",
    unidadeQuota: "-",
    inicio: new Date("2026-06-26T00:00:00Z"),
    fim: new Date("2027-06-25T00:00:00Z"),
    ato: "Resolução de teste",
    observacao: null,
    ...p,
  });

  it("gera exceção para a NCM inteira quando não há número de Ex", () => {
    expect(parseGecexRow(row())).toMatchObject({
      ok: true,
      value: {
        kind: "aliquota",
        rate: {
          regime: "excecao",
          lista: "DCC (Anexo IX)",
          aliquota: 25,
          quota: null,
          atoLegal: "Resolução de teste",
        },
      },
    });
  });

  it("registra a quota", () => {
    expect(
      parseGecexRow(row({ aliquota: 10.8, quota: 899250, unidadeQuota: "Quilogramas" })),
    ).toMatchObject({
      value: { rate: { aliquota: 10.8, quota: "899.250 quilogramas" } },
    });
  });

  it("gera destaque Ex quando há número", () => {
    expect(
      parseGecexRow(row({ anexo: "V", ex: 1, descricao: "-- Produto específico", fim: "-" })),
    ).toMatchObject({
      value: {
        kind: "destaque",
        destaque: {
          numero: "01",
          lista: "LETEC (Anexo V)",
          descricao: "Produto específico",
          vigenciaFim: null,
        },
      },
    });
  });

  it("aceita datas em texto e rejeita alíquota inválida", () => {
    expect(parseGecexRow(row({ anexo: "VIII", inicio: "05/05/2022", fim: null }))).toMatchObject({
      value: { rate: { vigenciaInicio: new Date(Date.UTC(2022, 4, 5)) } },
    });
    expect(parseGecexRow(row({ aliquota: "abc" })).ok).toBe(false);
  });
});
