import { describe, expect, it } from "vitest";
import { planRateSync, type ExistingRate } from "./history";
import type { RateRecord } from "./types";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const rate = (partial: Partial<RateRecord> = {}): RateRecord => ({
  ncm: "98011000",
  tributo: "II",
  regime: "geral",
  lista: null,
  tipo: "ad_valorem",
  aliquota: 14,
  vigenciaInicio: null,
  vigenciaFim: null,
  atoLegal: null,
  observacao: null,
  quota: null,
  ...partial,
});
let seq = 0;
const stored = (partial: Partial<ExistingRate> = {}): ExistingRate => ({
  ...rate(),
  id: `r${++seq}`,
  vigenciaInferida: false,
  ...partial,
});

const ref = d("2026-09-15");

describe("planRateSync — tabelas sem data de início (TEC, TIPI)", () => {
  it("mantém alíquotas iguais", () => {
    const aberto = stored();
    const plan = planRateSync([aberto], [rate()], ref);
    expect(plan.inalterados).toEqual([aberto]);
    expect(plan.inserir).toEqual([]);
    expect(plan.encerrar).toEqual([]);
  });

  it("atualiza o ato legal sem mexer na vigência", () => {
    const aberto = stored({ atoLegal: "Ato 1" });
    const plan = planRateSync([aberto], [rate({ atoLegal: "Ato 2" })], ref);
    expect(plan.atualizar).toMatchObject([{ atual: aberto, novo: { atoLegal: "Ato 2" } }]);
  });

  it("encerra a anterior e deduz o início da nova quando a alíquota muda", () => {
    const aberto = stored({ aliquota: 14 });
    const plan = planRateSync([aberto], [rate({ aliquota: 12 })], ref);
    const [nova] = plan.inserir;
    expect(nova).toMatchObject({ aliquota: 12, vigenciaInicio: ref });
    expect(nova && plan.inferidos.has(nova)).toBe(true);
    expect(plan.encerrar).toEqual([{ atual: aberto, vigenciaFim: d("2026-09-14") }]);
  });

  it("insere série nova sem data e encerra códigos que saíram da tabela", () => {
    const saiu = stored({ ncm: "98019000" });
    const plan = planRateSync([saiu], [rate({ tributo: "IPI", aliquota: 5 })], ref);
    expect(plan.inserir).toMatchObject([{ tributo: "IPI", vigenciaInicio: null }]);
    expect(plan.inferidos.size).toBe(0);
    expect(plan.encerrar).toEqual([{ atual: saiu, vigenciaFim: d("2026-09-14") }]);
  });
});

describe("planRateSync — listas com vigência (exceções)", () => {
  const excecao = (p: Partial<RateRecord> = {}) =>
    rate({
      regime: "excecao",
      lista: "LETEC",
      aliquota: 2,
      vigenciaInicio: d("2026-01-01"),
      vigenciaFim: d("2027-12-31"),
      ...p,
    });

  it("é idempotente ao recarregar a mesma lista", () => {
    const atual = stored(excecao());
    const plan = planRateSync([atual], [excecao()], ref);
    expect(plan.inalterados).toEqual([atual]);
    expect(plan.inserir.length + plan.atualizar.length + plan.encerrar.length).toBe(0);
  });

  it("atualiza a data de término e insere novos períodos", () => {
    const atual = stored(excecao());
    const plan = planRateSync(
      [atual],
      [
        excecao({ vigenciaFim: d("2026-12-31") }),
        excecao({ vigenciaInicio: d("2027-01-01"), vigenciaFim: null }),
      ],
      ref,
    );
    expect(plan.atualizar).toHaveLength(1);
    expect(plan.inserir).toMatchObject([{ vigenciaInicio: d("2027-01-01") }]);
  });

  it("distingue a alíquota dentro da quota da alíquota fora dela", () => {
    const fora = stored(excecao({ aliquota: 25 }));
    const plan = planRateSync(
      [fora],
      [excecao({ aliquota: 25 }), excecao({ aliquota: 10.8, quota: "100 kg" })],
      ref,
    );
    expect(plan.inalterados).toEqual([fora]);
    expect(plan.inserir).toMatchObject([{ aliquota: 10.8, quota: "100 kg" }]);
  });

  it("encerra exceções revogadas e remove as que ainda não tinham começado", () => {
    const revogada = stored(excecao());
    const futura = stored(excecao({ ncm: "98019000", vigenciaInicio: d("2027-01-01") }));
    const encerrada = stored(
      excecao({ ncm: "98020000", vigenciaFim: d("2025-12-31"), vigenciaInicio: d("2025-01-01") }),
    );
    const plan = planRateSync([revogada, futura, encerrada], [], ref);
    expect(plan.encerrar).toEqual([{ atual: revogada, vigenciaFim: d("2026-09-14") }]);
    expect(plan.remover).toEqual([futura]);
  });
});
