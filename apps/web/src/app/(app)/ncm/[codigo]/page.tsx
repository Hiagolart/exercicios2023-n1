import {
  NCM_LEVEL_LABELS,
  NCM_STATUS_LABELS,
  formatNcmCode,
  isValidNcmCodeLength,
  ncmStatusOf,
  ncmStructureOf,
} from "@comex/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MockDataBanner } from "@/components/data/mock-banner";
import { SourceNote } from "@/components/data/source-note";
import { NcmBreadcrumb } from "@/components/ncm/ncm-breadcrumb";
import { NcmChildren } from "@/components/ncm/ncm-children";
import { NcmCode } from "@/components/ncm/ncm-code";
import { FavoriteButton } from "@/components/ncm/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { TaxPanel } from "@/components/tax/tax-panel";
import { ncmData } from "@/lib/data/ncm";
import { getTaxView } from "@/lib/data/taxes";
import { userData } from "@/lib/data/user";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireSession } from "@/lib/session";

interface Props {
  params: Promise<{ codigo: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params;
  return { title: `NCM ${formatNcmCode(codigo)}` };
}

const NOT_AVAILABLE = <span className="text-muted">Não disponível na fonte</span>;

export default async function NcmNodePage({ params }: Props) {
  const { codigo } = await params;
  if (!isValidNcmCodeLength(codigo)) notFound();
  const { user } = await requireSession();

  const node = await ncmData.node(codigo);
  if (!node) notFound();
  const [children, path, run, favorito, taxView] = await Promise.all([
    ncmData.children(codigo),
    ncmData.path(codigo),
    ncmData.latestRun(),
    userData.isFavoriteNcm(user.id, codigo),
    node.nivel === "subitem" ? getTaxView(codigo) : Promise.resolve(null),
  ]);

  const status = ncmStatusOf(node);
  const structure = ncmStructureOf(node.codigo);
  const ato = [
    node.atoTipo,
    node.atoNumero && `nº ${node.atoNumero}`,
    node.atoAno && `de ${node.atoAno}`,
  ]
    .filter(Boolean)
    .join(" ");
  const absentFromLatest =
    run && node.lastSeen?.finishedAt?.getTime() !== run.finishedAt?.getTime();

  const fields: [string, React.ReactNode][] = [
    ["Código", <NcmCode key="c" codigo={node.codigo} />],
    ["Nível", NCM_LEVEL_LABELS[node.nivel]],
    ["Capítulo", <NcmCode key="cap" codigo={structure.capitulo} />],
    ["Posição", structure.posicao ? <NcmCode key="pos" codigo={structure.posicao} /> : "—"],
    [
      "Subposição",
      structure.subposicao ? <NcmCode key="sub" codigo={structure.subposicao} /> : "—",
    ],
    ["Início da vigência", formatDate(node.dataInicio) ?? NOT_AVAILABLE],
    [
      "Fim da vigência",
      formatDate(node.dataFim) ?? (node.dataInicio ? "Sem data de término" : NOT_AVAILABLE),
    ],
    ["Ato legal", ato || NOT_AVAILABLE],
    [
      "Unidade estatística",
      <span key="u" className="text-muted">
        Disponível após a carga do Comex Stat (Fase 6)
      </span>,
    ],
  ];

  return (
    <div className="flex flex-col gap-6">
      <NcmBreadcrumb path={path} />

      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <NcmCode codigo={node.codigo} className="text-3xl font-medium" />
          <Badge tone={status === "vigente" ? "accent" : "warn"}>{NCM_STATUS_LABELS[status]}</Badge>
          {absentFromLatest ? <Badge tone="warn">Não consta na última carga</Badge> : null}
        </div>
        <p className="max-w-3xl text-lg">{node.descricao}</p>
        <div className="flex flex-wrap items-center gap-2">
          <FavoriteButton codigo={node.codigo} initial={favorito} />
          <Button
            variant="secondary"
            disabled
            title="Disponível na Fase 6 (estatísticas de importação)"
          >
            Ver importações
          </Button>
          <Button variant="secondary" disabled title="Disponível na Fase 7 (IA)">
            Analisar com IA
          </Button>
        </div>
      </header>

      {node.source.isMock ? <MockDataBanner /> : null}

      <Section title="Informações">
        <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[10rem_1fr] gap-2">
              <dt className="text-muted">{label}</dt>
              <dd className="min-w-0">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {node.nivel === "subitem" && taxView ? (
        <TaxPanel ncm={node.codigo} view={taxView} />
      ) : (
        <p className="text-sm text-muted">
          Alíquotas e o simulador de tributos se aplicam aos códigos de 8 dígitos. Navegue até um
          subitem abaixo.
        </p>
      )}

      {children.length > 0 ? (
        <Section
          title="Desdobramentos"
          aside={<span className="text-xs text-muted">{children.length}</span>}
        >
          <div className="-mx-5 -my-4">
            <NcmChildren nodes={children} />
          </div>
        </Section>
      ) : null}

      <SourceNote
        fonte={node.source}
        referencia={formatDate(node.lastSeen?.referenceDate)}
        atualizadoEm={formatDateTime(node.lastSeen?.finishedAt)}
      />
    </div>
  );
}
