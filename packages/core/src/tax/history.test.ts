import { describe, expect, it } from "vitest";
import { planRateChanges } from "./history";
import type { RateRecord } from "./types";

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
const rate = (partial: Partial<RateRecord>): RateRecord => ({
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
  ...partial,
});

describe("planRateChanges", () => {
  const ref = d("2026-09-15");

  it("mantém alíquotas iguais sem gerar histórico", () => {
    const aberto = rate({ vigenciaInicio: d("2022-04-01") });
    const plan = planRateChanges([aberto], [rate({})], ref);
    expect(plan.inalterados).toEqual([aberto]);
    expect(plan.inserir).toEqual([]);
  });

  it("encerra a alíquota anterior e infere a vigência quando a fonte não informa", () => {
    const aberto = rate({ aliquota: 14 });
    const plan = planRateChanges([aberto], [rate({ aliquota: 12 })], ref);
    const [inserido] = plan.inserir;
    expect(inserido).toMatchObject({ aliquota: 12, vigenciaInicio: ref });
    expect(inserido && plan.inferidos.has(inserido)).toBe(true);
    expect(plan.encerrar).toEqual([{ atual: aberto, vigenciaFim: d("2026-09-14") }]);
  });

  it("usa a vigência da fonte quando informada", () => {
    const plan = planRateChanges(
      [rate({ aliquota: 14 })],
      [rate({ aliquota: 12, vigenciaInicio: d("2026-07-01") })],
      ref,
    );
    expect(plan.encerrar[0]?.vigenciaFim).toEqual(d("2026-06-30"));
    expect(plan.inferidos.size).toBe(0);
  });

  it("insere séries novas sem encerrar nada", () => {
    const plan = planRateChanges([], [rate({ tributo: "IPI", aliquota: 5 })], ref);
    expect(plan.inserir).toHaveLength(1);
    expect(plan.encerrar).toEqual([]);
    expect(plan.inferidos.size).toBe(0);
  });
});
