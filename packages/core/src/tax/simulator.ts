import Decimal from "decimal.js";

/**
 * Simulador de tributos na importação (estimativa).
 *
 * Fórmulas e fundamentos:
 * - Valor aduaneiro (VA) = (FOB + frete + seguro) × taxa de câmbio.
 *   Acordo de Valoração Aduaneira; Regulamento Aduaneiro (Decreto 6.759/2009), art. 77.
 * - II = VA × alíquota do II. Regulamento Aduaneiro, art. 75.
 * - IPI = (VA + II) × alíquota do IPI. Regulamento Aduaneiro, art. 239.
 * - PIS/Pasep-Importação = VA × alíquota; Cofins-Importação = VA × alíquota.
 *   Lei 10.865/2004, art. 7º, I (redação da Lei 12.865/2013).
 * - ICMS = base × alíquota, com base "por dentro":
 *   (VA + II + IPI + PIS + Cofins + despesas aduaneiras) ÷ (1 − alíquota).
 *   LC 87/1996, art. 13, V e § 1º, I.
 *
 * Cada tributo é arredondado ao centavo (meio para cima).
 * CBS e IBS não são calculados: as regras de transição ainda estão sendo modeladas.
 */

export interface SimulationInput {
  /** Valores na moeda da negociação. */
  fob: number;
  frete: number;
  seguro: number;
  /** R$ por unidade da moeda estrangeira. */
  cambio: number;
  /** Alíquotas em percentual; `null` = não tributado (NT). */
  aliquotas: { II: number; IPI: number | null; PIS: number; COFINS: number; ICMS: number };
  /** Taxa Siscomex, AFRMM e outras despesas aduaneiras (R$), que integram a base do ICMS. */
  despesasAduaneiras: number;
}

export interface TaxLine {
  tributo: "II" | "IPI" | "PIS" | "COFINS" | "ICMS";
  base: number;
  aliquota: number | null;
  valor: number;
}

export interface SimulationResult {
  valorAduaneiro: number;
  linhas: TaxLine[];
  totalFederais: number;
  totalTributos: number;
  despesasAduaneiras: number;
  /** VA + tributos + despesas aduaneiras. */
  custoTotal: number;
}

export type SimulationValidation = { ok: true } | { ok: false; erros: string[] };

const money = (d: Decimal) => d.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
const pct = (rate: number | null) => new Decimal(rate ?? 0).div(100);

export function validateSimulationInput(input: SimulationInput): SimulationValidation {
  const erros: string[] = [];
  const nonNegative: [string, number][] = [
    ["Valor FOB", input.fob],
    ["Frete", input.frete],
    ["Seguro", input.seguro],
    ["Despesas aduaneiras", input.despesasAduaneiras],
  ];
  for (const [label, value] of nonNegative) {
    if (!Number.isFinite(value) || value < 0)
      erros.push(`${label} deve ser um número maior ou igual a zero.`);
  }
  if (!Number.isFinite(input.cambio) || input.cambio <= 0)
    erros.push("Taxa de câmbio deve ser maior que zero.");
  for (const [tributo, rate] of Object.entries(input.aliquotas)) {
    if (rate === null && tributo === "IPI") continue;
    if (rate === null || !Number.isFinite(rate) || rate < 0 || rate > 100) {
      erros.push(`Alíquota de ${tributo} deve estar entre 0 e 100.`);
    }
  }
  if (input.aliquotas.ICMS >= 100) erros.push("Alíquota de ICMS deve ser menor que 100.");
  return erros.length === 0 ? { ok: true } : { ok: false, erros };
}

export function simulateImportTaxes(input: SimulationInput): SimulationResult {
  const check = validateSimulationInput(input);
  if (!check.ok) throw new Error(check.erros.join(" "));

  const { aliquotas } = input;
  const va = money(new Decimal(input.fob).plus(input.frete).plus(input.seguro).times(input.cambio));
  const ii = money(va.times(pct(aliquotas.II)));
  const ipiBase = va.plus(ii);
  const ipi = money(ipiBase.times(pct(aliquotas.IPI)));
  const pis = money(va.times(pct(aliquotas.PIS)));
  const cofins = money(va.times(pct(aliquotas.COFINS)));
  const despesas = money(new Decimal(input.despesasAduaneiras));

  const icmsRate = pct(aliquotas.ICMS);
  const icmsBase = money(
    va.plus(ii).plus(ipi).plus(pis).plus(cofins).plus(despesas).div(new Decimal(1).minus(icmsRate)),
  );
  const icms = money(icmsBase.times(icmsRate));

  const federais = ii.plus(ipi).plus(pis).plus(cofins);
  const total = federais.plus(icms);

  return {
    valorAduaneiro: va.toNumber(),
    linhas: [
      { tributo: "II", base: va.toNumber(), aliquota: aliquotas.II, valor: ii.toNumber() },
      {
        tributo: "IPI",
        base: money(ipiBase).toNumber(),
        aliquota: aliquotas.IPI,
        valor: ipi.toNumber(),
      },
      { tributo: "PIS", base: va.toNumber(), aliquota: aliquotas.PIS, valor: pis.toNumber() },
      {
        tributo: "COFINS",
        base: va.toNumber(),
        aliquota: aliquotas.COFINS,
        valor: cofins.toNumber(),
      },
      {
        tributo: "ICMS",
        base: icmsBase.toNumber(),
        aliquota: aliquotas.ICMS,
        valor: icms.toNumber(),
      },
    ],
    totalFederais: federais.toNumber(),
    totalTributos: total.toNumber(),
    despesasAduaneiras: despesas.toNumber(),
    custoTotal: va.plus(total).plus(despesas).toNumber(),
  };
}
