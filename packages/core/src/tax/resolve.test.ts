import { describe, expect, it } from "vitest";
import { isInForce, resolveRates } from "./resolve";
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
  quota: null,
  ...partial,
});

describe("isInForce", () => {
  it("respeita início e fim da vigência", () => {
    const r = rate({ vigenciaInicio: d("2025-01-01"), vigenciaFim: d("2025-12-31") });
    expect(isInForce(r, d("2025-06-01"))).toBe(true);
    expect(isInForce(r, d("2024-12-31"))).toBe(false);
    expect(isInForce(r, d("2026-01-01"))).toBe(false);
  });
});

describe("resolveRates", () => {
  const today = d("2026-09-29");

  it("aplica exceção vigente sobre a alíquota geral", () => {
    const records = [
      rate({ aliquota: 14 }),
      rate({ regime: "excecao", lista: "LETEC", aliquota: 2 }),
    ];
    const ii = resolveRates(records, "98011000", today).find((r) => r.tributo === "II");
    expect(ii?.aplicavel?.aliquota).toBe(2);
    expect(ii?.geral?.aliquota).toBe(14);
    expect(ii?.excecoes.map((e) => e.lista)).toEqual(["LETEC"]);
  });

  it("ignora exceções fora de vigência", () => {
    const records = [
      rate({ aliquota: 14 }),
      rate({ regime: "excecao", lista: "LETEC", aliquota: 2, vigenciaFim: d("2025-12-31") }),
    ];
    expect(resolveRates(records, "98011000", today)[0]?.aplicavel?.aliquota).toBe(14);
  });

  it("usa a regra geral quando o código não tem alíquota própria", () => {
    const records = [
      rate({ ncm: null, tributo: "PIS", regime: "regra_geral", aliquota: 2.1 }),
      rate({ ncm: "98019000", tributo: "PIS", aliquota: 0 }),
    ];
    const pis = resolveRates(records, "98011000", today).find((r) => r.tributo === "PIS");
    expect(pis?.aplicavel?.aliquota).toBe(2.1);
    const outro = resolveRates(records, "98019000", today).find((r) => r.tributo === "PIS");
    expect(outro?.aplicavel?.aliquota).toBe(0);
  });

  it("não trata exceção com quota como a alíquota aplicável", () => {
    const records = [
      rate({ aliquota: 14 }),
      rate({ regime: "excecao", lista: "DCC", aliquota: 10.8, quota: "100 kg" }),
    ];
    const ii = resolveRates(records, "98011000", today)[0];
    expect(ii?.aplicavel?.aliquota).toBe(14);
    expect(ii?.comQuota.map((r) => r.aliquota)).toEqual([10.8]);
  });

  it("escolhe o registro de início mais recente e sinaliza ausência de dados", () => {
    const records = [
      rate({ aliquota: 16, vigenciaInicio: d("2020-01-01") }),
      rate({ aliquota: 14, vigenciaInicio: d("2024-01-01") }),
    ];
    const resolved = resolveRates(records, "98011000", today);
    expect(resolved.find((r) => r.tributo === "II")?.aplicavel?.aliquota).toBe(14);
    expect(resolved.find((r) => r.tributo === "IPI")?.aplicavel).toBeNull();
  });
});
