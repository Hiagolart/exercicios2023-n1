import { parseNcmSearch } from "@comex/core";
import type { Metadata } from "next";
import { MockDataBanner } from "@/components/data/mock-banner";
import { SourceNote } from "@/components/data/source-note";
import { NcmChildren } from "@/components/ncm/ncm-children";
import { SearchBox } from "@/components/ncm/search-box";
import { SearchResults } from "@/components/ncm/search-results";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { ncmData } from "@/lib/data/ncm";
import { userData } from "@/lib/data/user";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Pesquisa NCM" };

const STRATEGY_NOTE: Record<string, string> = {
  codigo: "Códigos que começam com os dígitos informados.",
  texto:
    "Busca na descrição de cada código e dos níveis acima dele, sem diferenciar acentos, singular e plural.",
  aproximada: "Nenhum resultado exato. Mostrando descrições parecidas com o termo digitado.",
};

interface Props {
  searchParams: Promise<{ q?: string | string[] }>;
}

async function Results({ term, userId }: { term: string; userId: string }) {
  const query = parseNcmSearch(term);
  if (query.kind === "invalido") {
    return <p className="text-sm text-danger">{query.motivo}</p>;
  }
  const [result] = await Promise.all([
    ncmData.search(query),
    userData.recordSearch(userId, term, query),
  ]);
  const hasMock = result.hits.some((h) => h.isMock);

  return (
    <div className="flex flex-col gap-4">
      {hasMock ? <MockDataBanner /> : null}
      <Section
        title={`${result.hits.length} resultado(s) para "${term}"`}
        aside={
          result.hits.length === 50 ? (
            <span className="text-xs text-muted">Mostrando os 50 primeiros</span>
          ) : null
        }
      >
        {result.hits.length === 0 ? (
          <p className="text-sm text-muted">
            Nenhuma NCM encontrada. Tente outro termo, um sinônimo ou parte do código.
          </p>
        ) : (
          <div className="-mx-5 -my-4">
            <SearchResults hits={result.hits} />
          </div>
        )}
      </Section>
      {result.estrategia !== "nenhuma" ? (
        <p className="text-xs text-muted">{STRATEGY_NOTE[result.estrategia]}</p>
      ) : null}
    </div>
  );
}

export default async function NcmSearchPage({ searchParams }: Props) {
  const { user } = await requireSession();
  const raw = (await searchParams).q;
  const term = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const [chapters, run] = await Promise.all([
    term ? Promise.resolve([]) : ncmData.children(null),
    ncmData.latestRun(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pesquisa NCM"
        description="Pesquise por código, descrição ou produto, ou navegue pela estrutura da nomenclatura."
      />
      <SearchBox defaultValue={term} autoFocus={!term} />

      {term ? (
        <Results term={term} userId={user.id} />
      ) : (
        <>
          {chapters.some((c) => c.source.isMock) ? <MockDataBanner /> : null}
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
        </>
      )}

      <SourceNote
        fonte={run?.source ?? null}
        referencia={formatDate(run?.referenceDate)}
        atualizadoEm={formatDateTime(run?.finishedAt)}
      />
    </div>
  );
}
