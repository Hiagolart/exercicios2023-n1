import { describe, expect, it } from "vitest";
import { parseOfficialTableRow, parseTaxTemplateRow } from "./records";

describe("parseTaxTemplateRow", () => {
  it("lê alíquota geral de uma NCM", () => {
    const r = parseTaxTemplateRow({
      ncm: "9801.10.00",
      tributo: "ii",
      aliquota: "14",
      ato_legal: "Res. Teste 1/2021",
    });
    expect(r).toMatchObject({
      ok: true,
      value: {
        kind: "aliquota",
        rate: {
          ncm: "98011000",
          tributo: "II",
          regime: "geral",
          aliquota: 14,
          atoLegal: "Res. Teste 1/2021",
        },
      },
    });
  });

  it("lê regra geral sem NCM e exceção com lista", () => {
    expect(parseTaxTemplateRow({ tributo: "PIS", aliquota: "2,1" })).toMatchObject({
      ok: true,
      value: { rate: { ncm: null, regime: "regra_geral", aliquota: 2.1 } },
    });
    expect(
      parseTaxTemplateRow({
        ncm: "98011000",
        tributo: "II",
        regime: "excecao",
        lista: "LETEC",
        aliquota: "2",
        vigencia_fim: "31/12/2027",
      }),
    ).toMatchObject({
      ok: true,
      value: {
        rate: { regime: "excecao", lista: "LETEC", vigenciaFim: new Date(Date.UTC(2027, 11, 31)) },
      },
    });
  });

  it("lê destaque Ex", () => {
    const r = parseTaxTemplateRow({
      tipo_registro: "destaque",
      ncm: "98011000",
      tributo: "II",
      numero_ex: "001",
      descricao_ex: "Máquina de teste",
      aliquota: "0",
    });
    expect(r).toMatchObject({
      ok: true,
      value: { kind: "destaque", destaque: { numero: "001", aliquota: 0 } },
    });
  });

  it("aponta todos os problemas", () => {
    const r = parseTaxTemplateRow({
      ncm: "123",
      tributo: "XYZ",
      aliquota: "abc",
      vigencia_inicio: "31/02/2026",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.map((i) => i.campo)).toEqual(["ncm", "tributo", "aliquota", "vigencia_inicio"]);
  });

  it("exige lista na exceção e proíbe NCM na regra geral", () => {
    expect(
      parseTaxTemplateRow({ ncm: "98011000", tributo: "II", regime: "excecao", aliquota: "2" }).ok,
    ).toBe(false);
    expect(
      parseTaxTemplateRow({ ncm: "98011000", tributo: "PIS", regime: "regra_geral", aliquota: "2" })
        .ok,
    ).toBe(false);
  });
});

describe("parseOfficialTableRow", () => {
  const ctx = { tributo: "IPI" as const, atoLegal: "Decreto de teste" };

  it("ignora linhas de capítulo, posição e sem alíquota", () => {
    expect(parseOfficialTableRow({ ncm: "98.01", aliquota: "" }, ctx)).toEqual({
      ok: true,
      value: { kind: "ignorar" },
    });
    expect(parseOfficialTableRow({ ncm: "Capítulo 98", aliquota: null }, ctx)).toEqual({
      ok: true,
      value: { kind: "ignorar" },
    });
  });

  it("lê alíquota, NT e destaque Ex", () => {
    expect(parseOfficialTableRow({ ncm: "9801.10.00", aliquota: "6,5" }, ctx)).toMatchObject({
      value: {
        kind: "aliquota",
        rate: { ncm: "98011000", tributo: "IPI", aliquota: 6.5, atoLegal: "Decreto de teste" },
      },
    });
    expect(parseOfficialTableRow({ ncm: "9801.10.00", aliquota: "NT" }, ctx)).toMatchObject({
      value: { rate: { tipo: "nao_tributado", aliquota: null } },
    });
    expect(
      parseOfficialTableRow(
        { ncm: "9801.10.00", ex: "1", descricao: "- Produto específico", aliquota: "0" },
        ctx,
      ),
    ).toMatchObject({
      value: {
        kind: "destaque",
        destaque: { numero: "01", descricao: "Produto específico", aliquota: 0 },
      },
    });
  });

  it("rejeita alíquota ilegível", () => {
    expect(parseOfficialTableRow({ ncm: "9801.10.00", aliquota: "x" }, ctx).ok).toBe(false);
  });
});
