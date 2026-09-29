import type { SearchHistoryEntry } from "@comex/db";
import Link from "next/link";
import { formatTime, relativeDayLabel } from "@/lib/format";

const TYPE_LABEL = { codigo: "Código", descricao: "Descrição", produto: "Produto" } as const;

/** Pesquisas agrupadas por dia ("Hoje", "Ontem", data). */
export function HistoryList({
  items,
  now = new Date(),
}: {
  items: SearchHistoryEntry[];
  now?: Date;
}) {
  const groups = new Map<string, SearchHistoryEntry[]>();
  for (const item of items) {
    const label = relativeDayLabel(item.createdAt, now);
    groups.set(label, [...(groups.get(label) ?? []), item]);
  }
  return (
    <div className="flex flex-col">
      {[...groups].map(([label, entries]) => (
        <section key={label}>
          <h3 className="bg-surface-2 px-5 py-1.5 text-xs font-medium uppercase tracking-wider text-muted">
            {label}
          </h3>
          <ul className="divide-y divide-line">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/ncm?q=${encodeURIComponent(entry.termo)}`}
                  className="flex items-center gap-4 px-5 py-2.5 text-sm hover:bg-surface-2"
                >
                  <span className={entry.tipo === "codigo" ? "font-mono" : undefined}>
                    {entry.termo}
                  </span>
                  <span className="text-xs text-muted">{TYPE_LABEL[entry.tipo]}</span>
                  <span className="ml-auto font-mono text-xs tabular-nums text-muted">
                    {formatTime(entry.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
