import type { Metadata } from "next";
import Link from "next/link";
import { MockDataBanner } from "@/components/data/mock-banner";
import { SourceNote } from "@/components/data/source-note";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { ncmData } from "@/lib/data/ncm";
import { formatDate, formatDateTime, formatInteger } from "@/lib/format";

export const metadata: Metadata = { title: "Dashboard" };

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className="font-mono text-2xl tabular-nums">{value}</dd>
      {hint ? <dd className="text-xs text-muted">{hint}</dd> : null}
    </div>
  );
}

export default async function DashboardPage() {
  const [stats, run] = await Promise.all([ncmData.stats(), ncmData.latestRun()]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Visão geral da base de dados disponível." />

      {run?.source.isMock ? <MockDataBanner /> : null}

      <Section title="Base de dados">
        <dl className="grid grid-cols-2 gap-6 md:grid-cols-4">
          <Stat
            label="NCMs (8 dígitos)"
            value={stats.subitens > 0 ? formatInteger(stats.subitens) : "—"}
            hint={
              stats.total > 0
                ? `${formatInteger(stats.total)} nós na estrutura`
                : "Nenhuma carga realizada"
            }
          />
          <Stat
            label="Capítulos"
            value={stats.capitulos > 0 ? formatInteger(stats.capitulos) : "—"}
          />
          <Stat label="Registros de importação" value="—" hint="Disponível na Fase 3" />
          <Stat label="Período dos dados" value="—" hint="Disponível na Fase 3" />
        </dl>
        <div className="mt-6 border-t border-line pt-4">
          <SourceNote
            fonte={run?.source ?? null}
            referencia={formatDate(run?.referenceDate)}
            atualizadoEm={formatDateTime(run?.finishedAt)}
          />
        </div>
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="Pesquisas recentes">
          <p className="text-sm text-muted">O histórico de pesquisas chega na Fase 2.</p>
        </Section>
        <Section title="NCMs favoritas">
          <p className="text-sm text-muted">Os favoritos chegam na Fase 2.</p>
        </Section>
      </div>

      <p className="text-sm">
        <Link href="/ncm" className="text-accent hover:underline">
          Navegar pela estrutura da NCM →
        </Link>
      </p>
    </div>
  );
}
