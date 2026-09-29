import type { FavoriteNcm } from "@comex/db";
import Link from "next/link";
import { NcmCode } from "./ncm-code";

export function FavoriteList({ items }: { items: FavoriteNcm[] }) {
  return (
    <ul className="divide-y divide-line">
      {items.map((fav) => (
        <li key={fav.codigo}>
          <Link
            href={`/ncm/${fav.codigo}`}
            className="grid grid-cols-[7.5rem_1fr] gap-4 px-5 py-3 text-sm hover:bg-surface-2"
          >
            <NcmCode codigo={fav.codigo} className="text-accent" />
            <span className="min-w-0 truncate">
              {fav.descricao ?? <span className="text-muted">Código não consta na base atual</span>}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
