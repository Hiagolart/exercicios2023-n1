import { describe, expect, it } from "vitest";
import { parseClassifPayload, parseClassifRecord } from "./classif";

// Registros de teste: códigos e textos fictícios, apenas para validar o parser.
describe("parseClassifPayload", () => {
  it("aceita objeto com lista e data da base", () => {
    const result = parseClassifPayload({
      Data_Ultima_Atualizacao_NCM: "15/09/2026",
      Nomenclaturas: [{ Codigo: "01" }],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.records).toHaveLength(1);
    expect(result.value.dataUltimaAlteracao?.toISOString()).toBe("2026-09-15T00:00:00.000Z");
  });

  it("lê a data no formato do arquivo oficial", () => {
    const result = parseClassifPayload({
      Data_Ultima_Atualizacao_NCM: "Vigente em 29/09/2026",
      Nomenclaturas: [],
    });
    expect(result.ok && result.value.dataUltimaAlteracao?.toISOString()).toBe(
      "2026-09-29T00:00:00.000Z",
    );
  });

  it("aceita lista na raiz", () => {
    const result = parseClassifPayload([{ codigo: "01" }]);
    expect(result.ok && result.value.dataUltimaAlteracao).toBeNull();
  });

  it("rejeita formatos desconhecidos", () => {
    expect(parseClassifPayload({ foo: [] }).ok).toBe(false);
    expect(parseClassifPayload("texto").ok).toBe(false);
  });
});

describe("parseClassifRecord", () => {
  it("normaliza um registro em camelCase", () => {
    const result = parseClassifRecord({
      codigo: "9901.10.00",
      descricao: "-- Produto de teste",
      dataInicio: "01/04/2022",
      dataFim: "31/12/9999",
      tipoOrgaoAtoIni: "Res Teste",
      numeroAtoIni: "1",
      anoAtoIni: "2021",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        codigo: "99011000",
        nivel: "subitem",
        descricao: "Produto de teste",
        dataInicio: new Date(Date.UTC(2022, 3, 1)),
        dataFim: null,
        atoTipo: "Res Teste",
        atoNumero: "1",
        atoAno: 2021,
      },
    });
  });

  it("aceita a grafia com underscores", () => {
    const result = parseClassifRecord({
      Codigo: "99.01",
      Descricao: "Posição de teste",
      Data_Inicio: "2022-04-01",
    });
    expect(result.ok && result.value.nivel).toBe("posicao");
  });

  it("reporta todos os problemas encontrados", () => {
    const result = parseClassifRecord({
      codigo: "123",
      descricao: " ",
      dataInicio: "31/02/2022",
      anoAtoIni: "abc",
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.map((i) => i.campo)).toEqual([
      "codigo",
      "descricao",
      "dataInicio",
      "atoAno",
    ]);
  });

  it("rejeita valores que não são objetos", () => {
    expect(parseClassifRecord(null).ok).toBe(false);
    expect(parseClassifRecord([]).ok).toBe(false);
  });
});
