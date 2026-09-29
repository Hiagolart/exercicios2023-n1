import { ExternalLink } from "lucide-react";

export interface SourceNoteProps {
  fonte: { nome: string; url: string | null; isMock: boolean } | null;
  /** Data de referência informada pela fonte. */
  referencia?: string | null;
  /** Data em que a base local foi atualizada. */
  atualizadoEm?: string | null;
  periodo?: string | null;
  metodologia?: string | null;
}

/** Bloco de transparência: fonte, período, atualização e metodologia. */
export function SourceNote({
  fonte,
  referencia,
  atualizadoEm,
  periodo,
  metodologia,
}: SourceNoteProps) {
  const rows: [string, React.ReactNode][] = [
    [
      "Fonte",
      fonte ? (
        fonte.url ? (
          <a
            href={fonte.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-accent hover:underline"
          >
            {fonte.nome}
            <ExternalLink aria-hidden className="size-3" />
          </a>
        ) : (
          fonte.nome
        )
      ) : (
        "Nenhuma carga de dados realizada"
      ),
    ],
    ["Data da base na fonte", referencia ?? "Não informada pela fonte"],
    ["Atualizado em", atualizadoEm ?? "—"],
  ];
  if (periodo !== undefined) rows.push(["Período", periodo ?? "—"]);
  if (metodologia) rows.push(["Metodologia", metodologia]);

  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted">{label}</dt>
          <dd className="min-w-0">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
