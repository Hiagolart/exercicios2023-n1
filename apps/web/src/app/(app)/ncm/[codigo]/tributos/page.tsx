import { TRIBUTO_LABELS, formatNcmCode, isFullNcmCode } from "@comex/core";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MockDataBanner } from "@/components/data/mock-banner";
import { NcmCode } from "@/components/ncm/ncm-code";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { Section } from "@/components/ui/section";
import { ncmData } from "@/lib/data/ncm";
import { getTaxView } from "@/lib/data/taxes";
import { formatDate, formatDateTime } from "@/lib/format";
import { formatRate, rateOrigin } from "@/lib/tax-format";

interface Props {
  params: Promise<{ codigo: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codigo } = await params;
  return { title: `Histórico de alíquotas · ${formatNcmCode(codigo)}` };
}

export default async function RateHistoryPage({ params }: Props) {
  const { codigo } = await params;
  if (!isFullNcmCode(codigo)) notFound();
  const [node, view] = await Promise.all([ncmData.node(codigo), getTaxView(codigo)]);
  if (!node) notFound();
  const today = new Date();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Histórico de alíquotas"
        description={
          <>
            <Link href={`/ncm/${codigo}`} className="text-accent hover:underline">
              <NcmCode codigo={codigo} />
            </Link>{" "}
            · {node.descricao}
          </>
        }
      />
      {view.hasMock ? (
        <MockDataBanner detail="As alíquotas exibidas são inventadas e não correspondem à legislação." />
      ) : null}

      <Section title="Todas as alíquotas registradas">
        {view.historico.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma alíquota registrada para esta NCM.</p>
        ) : (
          <div className="-mx-5 -my-4 overflow-x-auto">
            <table className="w-full min-w-[48rem] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-5 py-2 font-medium">Tributo</th>
                  <th className="px-3 py-2 font-medium">Alíquota</th>
                  <th className="px-3 py-2 font-medium">Origem</th>
                  <th className="px-3 py-2 font-medium">Início</th>
                  <th className="px-3 py-2 font-medium">Fim</th>
                  <th className="px-3 py-2 font-medium">Fundamento legal</th>
                  <th className="px-5 py-2 font-medium">Fonte · carga</th>
                </tr>
              </thead>
              <tbody>
                {view.historico.map((r) => {
                  const ended = r.vigenciaFim !== null && r.vigenciaFim < today;
                  return (
                    <tr key={r.id} className="border-b border-line align-top last:border-0">
                      <td className="px-5 py-2.5">{TRIBUTO_LABELS[r.tributo]}</td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">{formatRate(r)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          <Badge>{rateOrigin(r)}</Badge>
                          {ended ? <Badge tone="warn">Encerrada</Badge> : null}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                        {formatDate(r.vigenciaInicio) ?? "—"}
                        {r.vigenciaInferida ? (
                          <span className="block font-sans text-muted">deduzido da carga</span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                        {formatDate(r.vigenciaFim) ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-muted">{r.atoLegal ?? "Não informado"}</td>
                      <td className="px-5 py-2.5 text-xs text-muted">
                        {r.source.nome}
                        <span className="block">{formatDateTime(r.atualizadoEm)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>
      <p className="max-w-3xl text-xs text-muted">
        O histórico é formado pelas cargas sucessivas das tabelas. Quando a fonte não informa a data
        de início de uma alteração, usamos a data de referência da carga e marcamos o registro como
        “deduzido da carga”.
      </p>
    </div>
  );
}
