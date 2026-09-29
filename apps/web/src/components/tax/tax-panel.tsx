import { TRIBUTO_LABELS } from "@comex/core";
import type { StoredDestaque } from "@comex/db";
import Link from "next/link";
import { MockDataBanner } from "@/components/data/mock-banner";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import type { TaxView } from "@/lib/data/taxes";
import { formatDate } from "@/lib/format";
import { formatPercent, formatRate, rateOrigin } from "@/lib/tax-format";

function vigencia(r: { vigenciaInicio: Date | null; vigenciaFim: Date | null }): string {
  const inicio = formatDate(r.vigenciaInicio);
  const fim = formatDate(r.vigenciaFim);
  if (!inicio && !fim) return "Não informada na fonte";
  if (!fim) return `Desde ${inicio}`;
  return `${inicio ?? "—"} a ${fim}`;
}

const DESTAQUE_LABEL = { II: "Ex-tarifário (II)", IPI: "Ex da TIPI (IPI)" } as const;

function Destaques({ items }: { items: StoredDestaque[] }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Destaques Ex</h3>
      <ul className="divide-y divide-line rounded-md border border-line">
        {items.map((ex) => (
          <li
            key={ex.id}
            className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-start sm:gap-4"
          >
            <div className="flex w-40 shrink-0 flex-col gap-1">
              <span className="font-mono">Ex {ex.numero}</span>
              <span className="text-xs text-muted">{DESTAQUE_LABEL[ex.tributo]}</span>
            </div>
            <p className="min-w-0 flex-1">{ex.descricao}</p>
            <div className="flex shrink-0 flex-col items-start gap-1 sm:items-end">
              <span className="font-mono tabular-nums">{formatPercent(ex.aliquota)}</span>
              <span className="text-xs text-muted">{vigencia(ex)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Tributos vigentes da NCM, com origem, vigência, fundamento legal e fonte. */
export function TaxPanel({ ncm, view }: { ncm: string; view: TaxView }) {
  const hasAny = view.vigentes.some((v) => v.aplicavel);
  const notes = [
    ...new Set(
      view.vigentes.flatMap((v) => (v.aplicavel?.observacao ? [v.aplicavel.observacao] : [])),
    ),
  ];

  return (
    <Section
      title="Tributos na importação"
      aside={
        <div className="flex gap-2">
          <Link href={`/ncm/${ncm}/tributos`} className="text-xs text-accent hover:underline">
            Histórico de alíquotas
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {view.hasMock ? (
          <MockDataBanner detail="As alíquotas exibidas são inventadas e não correspondem à legislação." />
        ) : null}
        {!hasAny ? (
          <p className="text-sm text-muted">
            Nenhuma alíquota carregada para esta NCM. As tabelas oficiais (TEC e TIPI) ainda não
            foram importadas.
          </p>
        ) : null}

        <div className="-mx-5 overflow-x-auto">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-y border-line text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-5 py-2 font-medium">Tributo</th>
                <th className="px-3 py-2 font-medium">Alíquota</th>
                <th className="px-3 py-2 font-medium">Origem</th>
                <th className="px-3 py-2 font-medium">Vigência</th>
                <th className="px-3 py-2 font-medium">Fundamento legal</th>
                <th className="px-5 py-2 font-medium">Fonte</th>
              </tr>
            </thead>
            <tbody>
              {view.vigentes.map(({ tributo, aplicavel, geral, excecoes }) => (
                <tr key={tributo} className="border-b border-line align-top last:border-0">
                  <td className="px-5 py-3">{TRIBUTO_LABELS[tributo]}</td>
                  <td className="px-3 py-3">
                    <span className={aplicavel ? "font-mono tabular-nums" : "text-muted"}>
                      {formatRate(aplicavel)}
                    </span>
                    {excecoes.length > 0 && geral ? (
                      <span className="mt-1 block text-xs text-muted">
                        Alíquota da NCM: {formatRate(geral)}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    {aplicavel ? (
                      <Badge tone={aplicavel.regime === "excecao" ? "warn" : "neutral"}>
                        {rateOrigin(aplicavel)}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {aplicavel ? vigencia(aplicavel) : "—"}
                    {aplicavel?.vigenciaInferida ? (
                      <span className="block text-xs">Início deduzido da data da carga</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-muted">
                    {aplicavel?.atoLegal ?? (aplicavel ? "Não informado" : "—")}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted">
                    {aplicavel ? (
                      aplicavel.source.url ? (
                        <a
                          href={aplicavel.source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-accent hover:underline"
                        >
                          {aplicavel.source.nome}
                        </a>
                      ) : (
                        aplicavel.source.nome
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {view.destaques.length > 0 ? <Destaques items={view.destaques} /> : null}

        {notes.length > 0 ? (
          <ul className="flex flex-col gap-1 text-xs text-muted">
            {notes.map((n) => (
              <li key={n}>• {n}</li>
            ))}
          </ul>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <ButtonLink href={`/simulador?ncm=${ncm}`}>Simular tributos</ButtonLink>
          <p className="text-xs text-muted">
            ICMS por estado, anuências e defesa comercial chegam nas Fases 4 e 5.
          </p>
        </div>
      </div>
    </Section>
  );
}
