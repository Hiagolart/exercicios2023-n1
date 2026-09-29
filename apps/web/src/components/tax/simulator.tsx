"use client";

import { simulateImportTaxes, validateSimulationInput, type SimulationInput } from "@comex/core";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { formatBRL, formatPercent, parseBrNumber } from "@/lib/tax-format";

export type RateField = "II" | "IPI" | "PIS" | "COFINS" | "ICMS";

export interface RatePreset {
  /** Texto inicial do campo ("14", "NT" ou vazio). */
  valor: string;
  /** De onde veio o valor, exibido abaixo do campo. */
  origem: string;
}

const LABELS: Record<RateField, string> = {
  II: "II",
  IPI: "IPI",
  PIS: "PIS/Pasep-Importação",
  COFINS: "Cofins-Importação",
  ICMS: "ICMS",
};

const TRIBUTO_ROW: Record<RateField, string> = {
  II: "Imposto de Importação",
  IPI: "IPI",
  PIS: "PIS/Pasep-Importação",
  COFINS: "Cofins-Importação",
  ICMS: "ICMS",
};

const inputClass =
  "h-10 w-full rounded-md border border-line bg-bg px-3 font-mono text-sm tabular-nums outline-none focus:border-accent";

function Field({
  id,
  label,
  value,
  onChange,
  hint,
  suffix,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  suffix?: string;
}) {
  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-1 text-sm">
      {label}
      <div className="relative">
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          inputMode="decimal"
          autoComplete="off"
          className={cn(inputClass, suffix && "pr-8")}
        />
        {suffix ? (
          <span className="absolute inset-y-0 right-3 flex items-center text-xs text-muted">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <span className="text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

function toInput(
  values: Record<string, string>,
  rates: Record<RateField, string>,
): SimulationInput {
  const rate = (v: string) => (v.trim().toUpperCase() === "NT" ? null : parseBrNumber(v));
  return {
    fob: parseBrNumber(values.fob ?? ""),
    frete: parseBrNumber(values.frete ?? ""),
    seguro: parseBrNumber(values.seguro ?? ""),
    cambio: parseBrNumber(values.cambio ?? ""),
    despesasAduaneiras: parseBrNumber(values.despesas ?? ""),
    aliquotas: {
      II: rate(rates.II) ?? Number.NaN,
      IPI: rate(rates.IPI),
      PIS: rate(rates.PIS) ?? Number.NaN,
      COFINS: rate(rates.COFINS) ?? Number.NaN,
      ICMS: rate(rates.ICMS) ?? Number.NaN,
    },
  };
}

export function TaxSimulator({ presets }: { presets: Record<RateField, RatePreset> }) {
  const [values, setValues] = useState<Record<string, string>>({
    fob: "10.000,00",
    frete: "1.000,00",
    seguro: "100,00",
    cambio: "",
    despesas: "",
  });
  const [rates, setRates] = useState<Record<RateField, string>>({
    II: presets.II.valor,
    IPI: presets.IPI.valor,
    PIS: presets.PIS.valor,
    COFINS: presets.COFINS.valor,
    ICMS: presets.ICMS.valor,
  });

  const input = useMemo(() => toInput(values, rates), [values, rates]);
  const check = useMemo(() => validateSimulationInput(input), [input]);
  const result = useMemo(() => (check.ok ? simulateImportTaxes(input) : null), [check, input]);

  const set = (key: string) => (v: string) => setValues((prev) => ({ ...prev, [key]: v }));
  const setRate = (key: RateField) => (v: string) => setRates((prev) => ({ ...prev, [key]: v }));

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 text-sm font-semibold">
            Valores da operação (moeda da negociação)
          </legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field id="fob" label="Valor FOB" value={values.fob ?? ""} onChange={set("fob")} />
            <Field
              id="frete"
              label="Frete internacional"
              value={values.frete ?? ""}
              onChange={set("frete")}
            />
            <Field
              id="seguro"
              label="Seguro internacional"
              value={values.seguro ?? ""}
              onChange={set("seguro")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="cambio"
              label="Taxa de câmbio (R$)"
              value={values.cambio ?? ""}
              onChange={set("cambio")}
              hint="Informe a taxa vigente para fins aduaneiros na data do registro."
            />
            <Field
              id="despesas"
              label="Despesas aduaneiras (R$)"
              value={values.despesas ?? ""}
              onChange={set("despesas")}
              hint="Taxa Siscomex, AFRMM e outras que integram a base do ICMS."
            />
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4">
          <legend className="mb-3 text-sm font-semibold">Alíquotas (%)</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(LABELS) as RateField[]).map((key) => (
              <Field
                key={key}
                id={`aliquota-${key}`}
                label={LABELS[key]}
                value={rates[key]}
                onChange={setRate(key)}
                suffix="%"
                hint={presets[key].origem}
              />
            ))}
          </div>
          <p className="text-xs text-muted">
            Use “NT” no IPI para produto não tributado. Todos os campos podem ser editados.
          </p>
        </fieldset>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-line bg-surface" aria-live="polite">
          <div className="border-b border-line px-5 py-3">
            <h2 className="text-sm font-semibold">Resultado estimado</h2>
          </div>
          {!result ? (
            <div className="px-5 py-4 text-sm">
              <p className="text-muted">Preencha os campos para ver o cálculo:</p>
              <ul className="mt-2 list-disc pl-5 text-danger">
                {!check.ok && check.erros.map((e) => <li key={e}>{e}</li>)}
              </ul>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[26rem] text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                    <th className="px-5 py-2 font-medium">Tributo</th>
                    <th className="px-3 py-2 text-right font-medium">Base de cálculo</th>
                    <th className="px-3 py-2 text-right font-medium">Alíquota</th>
                    <th className="px-5 py-2 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="font-mono tabular-nums">
                  <tr className="border-b border-line">
                    <td className="px-5 py-2 font-sans">Valor aduaneiro</td>
                    <td />
                    <td />
                    <td className="px-5 py-2 text-right">{formatBRL(result.valorAduaneiro)}</td>
                  </tr>
                  {result.linhas.map((l) => (
                    <tr key={l.tributo} className="border-b border-line">
                      <td className="px-5 py-2 font-sans">{TRIBUTO_ROW[l.tributo]}</td>
                      <td className="px-3 py-2 text-right text-muted">{formatBRL(l.base)}</td>
                      <td className="px-3 py-2 text-right text-muted">
                        {l.aliquota === null ? "NT" : formatPercent(l.aliquota)}
                      </td>
                      <td className="px-5 py-2 text-right">{formatBRL(l.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="font-mono tabular-nums">
                  <tr className="border-b border-line">
                    <td colSpan={3} className="px-5 py-2 font-sans text-muted">
                      Tributos federais
                    </td>
                    <td className="px-5 py-2 text-right">{formatBRL(result.totalFederais)}</td>
                  </tr>
                  <tr className="border-b border-line">
                    <td colSpan={3} className="px-5 py-2 font-sans font-medium">
                      Total de tributos
                    </td>
                    <td className="px-5 py-2 text-right font-medium">
                      {formatBRL(result.totalTributos)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="px-5 py-3 font-sans font-semibold">
                      Custo total estimado
                      <span className="block text-xs font-normal text-muted">
                        Valor aduaneiro + tributos + despesas aduaneiras
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-base font-semibold text-accent">
                      {formatBRL(result.custoTotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <details className="rounded-lg border border-line bg-surface px-5 py-3 text-sm">
          <summary className="cursor-pointer font-medium">Metodologia e fundamentação</summary>
          <ul className="mt-3 flex flex-col gap-2 text-muted">
            <li>
              <strong className="text-fg">Valor aduaneiro</strong> = (FOB + frete + seguro) ×
              câmbio. Regulamento Aduaneiro (Decreto 6.759/2009), art. 77.
            </li>
            <li>
              <strong className="text-fg">II</strong> = valor aduaneiro × alíquota. Regulamento
              Aduaneiro, art. 75.
            </li>
            <li>
              <strong className="text-fg">IPI</strong> = (valor aduaneiro + II) × alíquota.
              Regulamento Aduaneiro, art. 239.
            </li>
            <li>
              <strong className="text-fg">PIS/Pasep e Cofins-Importação</strong> = valor aduaneiro ×
              alíquota. Lei 10.865/2004, art. 7º, I.
            </li>
            <li>
              <strong className="text-fg">ICMS</strong> = base × alíquota, com base “por dentro”:
              (valor aduaneiro + II + IPI + PIS + Cofins + despesas aduaneiras) ÷ (1 − alíquota). LC
              87/1996, art. 13, V e § 1º, I.
            </li>
            <li>Cada tributo é arredondado ao centavo.</li>
            <li>
              Não considerados: CBS e IBS (regras de transição em modelagem), antidumping, alíquotas
              específicas, regimes especiais, benefícios fiscais estaduais e o adicional de
              Cofins-Importação.
            </li>
          </ul>
        </details>
        <p className="text-xs text-muted">
          Estimativa para apoio à pesquisa. Os valores devidos dependem do enquadramento da operação
          e devem ser conferidos na legislação e, quando necessário, com profissional habilitado.
        </p>
      </div>
    </div>
  );
}
