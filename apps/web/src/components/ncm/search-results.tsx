import { NCM_LEVEL_LABELS, NCM_STATUS_LABELS, ncmStatusOf } from "@comex/core";
import type { NcmSearchHit } from "@comex/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { NcmCode } from "./ncm-code";

function Context({
  label,
  item,
}: {
  label: string;
  item: { codigo: string; descricao: string | null } | null;
}) {
  if (!item) return null;
  return (
    <p className="truncate">
      <span className="text-muted">{label} </span>
      <NcmCode codigo={item.codigo} className="text-muted" />
      {item.descricao ? <span className="text-muted"> · {item.descricao}</span> : null}
    </p>
  );
}

function validity(hit: NcmSearchHit): string {
  const inicio = formatDate(hit.dataInicio);
  const fim = formatDate(hit.dataFim);
  if (!inicio && !fim) return "Vigência não informada na fonte";
  return `Desde ${inicio ?? "data não informada"}${fim ? ` até ${fim}` : ""}`;
}

/** Resultados da pesquisa: código, descrição, estrutura, situação e vigência. */
export function SearchResults({ hits }: { hits: NcmSearchHit[] }) {
  return (
    <ul className="divide-y divide-line">
      {hits.map((hit) => {
        const status = ncmStatusOf(hit);
        return (
          <li key={hit.codigo} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start">
            <div className="flex w-36 shrink-0 flex-col items-start gap-1.5">
              <NcmCode codigo={hit.codigo} className="text-base font-medium text-accent" />
              <div className="flex flex-wrap gap-1">
                <Badge>{NCM_LEVEL_LABELS[hit.nivel]}</Badge>
                <Badge tone={status === "vigente" ? "accent" : "warn"}>
                  {NCM_STATUS_LABELS[status]}
                </Badge>
              </div>
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
              <p className="font-medium">{hit.descricao}</p>
              <div className="flex flex-col gap-0.5 text-xs">
                <Context label="Capítulo" item={hit.nivel === "capitulo" ? null : hit.capitulo} />
                <Context label="Posição" item={hit.posicao} />
                <Context label="Subposição" item={hit.subposicao} />
                <p className="text-muted">{validity(hit)}</p>
              </div>
            </div>
            <Link
              href={`/ncm/${hit.codigo}`}
              className="shrink-0 self-start rounded-md border border-line px-3 py-1.5 text-sm hover:bg-surface-2"
            >
              Ver detalhes
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
