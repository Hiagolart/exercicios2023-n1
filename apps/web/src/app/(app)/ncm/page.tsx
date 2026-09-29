import type { Metadata } from "next";
import { MockDataBanner } from "@/components/data/mock-banner";
import { SourceNote } from "@/components/data/source-note";
import { NcmChildren } from "@/components/ncm/ncm-children";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { ncmData } from "@/lib/data/ncm";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Pesquisa NCM" };

export default async function NcmIndexPage() {
  const [chapters, run] = await Promise.all([ncmData.children(null), ncmData.latestRun()]);
  const hasMock = chapters.some((c) => c.source.isMock);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pesquisa NCM"
        description="Navegue pela estrutura da Nomenclatura Comum do Mercosul. A pesquisa por código e descrição chega na Fase 2."
      />
      {hasMock ? <MockDataBanner /> : null}

      <Section
        title="Capítulos"
        aside={<span className="text-xs text-muted">{chapters.length} capítulo(s)</span>}
      >
        {chapters.length === 0 ? (
          <p className="text-sm text-muted">
            A nomenclatura ainda não foi carregada. Execute{" "}
            <code className="font-mono">pnpm ingest ncm --source classif</code> para importar a
            tabela oficial.
          </p>
        ) : (
          <div className="-mx-5 -my-4">
            <NcmChildren nodes={chapters} />
          </div>
        )}
      </Section>

      <SourceNote
        fonte={run?.source ?? null}
        referencia={formatDate(run?.referenceDate)}
        atualizadoEm={formatDateTime(run?.finishedAt)}
      />
    </div>
  );
}
