import Link from "next/link";
import { NcmCode } from "./ncm-code";

export function NcmBreadcrumb({ path }: { path: { codigo: string }[] }) {
  return (
    <nav aria-label="Estrutura" className="flex flex-wrap items-center gap-1 text-sm text-muted">
      <Link href="/ncm" className="hover:text-fg">
        Capítulos
      </Link>
      {path.map((p, i) => (
        <span key={p.codigo} className="flex items-center gap-1">
          <span aria-hidden>/</span>
          {i === path.length - 1 ? (
            <NcmCode codigo={p.codigo} className="text-fg" />
          ) : (
            <Link href={`/ncm/${p.codigo}`} className="hover:text-fg">
              <NcmCode codigo={p.codigo} />
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
