import { isFullNcmCode, normalizeNcmCode, type Tributo } from "@comex/core";
import type { StoredRate } from "@comex/db";
import type { Metadata } from "next";
import Link from "next/link";
import { MockDataBanner } from "@/components/data/mock-banner";
import { NcmCode } from "@/components/ncm/ncm-code";
import { TaxSimulator, type RateField, type RatePreset } from "@/components/tax/simulator";
import { PageHeader } from "@/components/ui/page-header";
import { ncmData } from "@/lib/data/ncm";
import { getTaxView, simulatorDefaults } from "@/lib/data/taxes";
import { rateOrigin } from "@/lib/tax-format";

export const metadata: Metadata = { title: "Simulador de tributos" };

interface Props {
  searchParams: Promise<{ ncm?: string | string[] }>;
}

function preset(rate: StoredRate | null | undefined): RatePreset {
  if (!rate) return { valor: "", origem: "Sem alíquota na base: informe manualmente." };
  const origem = `${rateOrigin(rate)} · ${rate.source.nome}`;
  if (rate.tipo === "nao_tributado") return { valor: "NT", origem };
  if (rate.aliquota === null)
    return { valor: "", origem: `${origem} (alíquota específica: informe o equivalente)` };
  return { valor: String(rate.aliquota).replace(".", ","), origem };
}

export default async function SimulatorPage({ searchParams }: Props) {
  const raw = (await searchParams).ncm;
  const ncm = normalizeNcmCode((Array.isArray(raw) ? raw[0] : raw) ?? "");
  const valid = isFullNcmCode(ncm);
  const node = valid ? await ncmData.node(ncm) : null;
  const view = node ? await getTaxView(ncm) : null;
  const defaults: Partial<Record<Tributo, StoredRate | null>> = view ? simulatorDefaults(view) : {};

  const presets: Record<RateField, RatePreset> = {
    II: preset(defaults.II),
    IPI: preset(defaults.IPI),
    PIS: preset(defaults.PIS),
    COFINS: preset(defaults.COFINS),
    ICMS: {
      valor: "",
      origem: "Informe a alíquota do estado de destino (ICMS por UF chega na Fase 5).",
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Simulador de tributos"
        description="Estimativa de II, IPI, PIS/Cofins-Importação e ICMS a partir das alíquotas da base."
      />

      <form action="/simulador" method="get" className="flex flex-wrap items-end gap-3">
        <label htmlFor="ncm" className="flex flex-col gap-1 text-sm">
          NCM (8 dígitos)
          <input
            id="ncm"
            name="ncm"
            defaultValue={ncm}
            required
            pattern="[0-9.\s]{8,12}"
            placeholder="0000.00.00"
            className="h-10 w-48 rounded-md border border-line bg-surface px-3 font-mono text-sm outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="h-10 rounded-md border border-line bg-surface px-4 text-sm hover:bg-surface-2"
        >
          Carregar alíquotas
        </button>
        {node ? (
          <p className="pb-2 text-sm">
            <Link href={`/ncm/${ncm}`} className="text-accent hover:underline">
              <NcmCode codigo={ncm} />
            </Link>{" "}
            <span className="text-muted">· {node.descricao}</span>
          </p>
        ) : ncm ? (
          <p className="pb-2 text-sm text-danger">
            {valid ? "NCM não encontrada na base." : "Informe um código NCM com 8 dígitos."}
          </p>
        ) : null}
      </form>

      {view?.hasMock ? (
        <MockDataBanner detail="As alíquotas pré-preenchidas são inventadas e não correspondem à legislação." />
      ) : null}

      <TaxSimulator key={ncm} presets={presets} />
    </div>
  );
}
