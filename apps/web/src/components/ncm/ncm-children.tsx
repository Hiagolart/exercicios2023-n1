import { NCM_LEVEL_LABELS } from "@comex/core";
import type { NcmNodeView } from "@comex/db";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { NcmCode } from "./ncm-code";

/** Lista de nós filhos para navegação na estrutura. */
export function NcmChildren({ nodes }: { nodes: NcmNodeView[] }) {
  return (
    <ul className="divide-y divide-line">
      {nodes.map((node) => (
        <li key={node.codigo}>
          <Link
            href={`/ncm/${node.codigo}`}
            className="grid grid-cols-[7.5rem_1fr_auto] items-start gap-4 px-5 py-3 hover:bg-surface-2"
          >
            <NcmCode codigo={node.codigo} className="pt-px text-sm text-accent" />
            <span className="min-w-0 text-sm">
              {node.descricao}
              <span className="mt-0.5 block text-xs text-muted">
                {NCM_LEVEL_LABELS[node.nivel]}
                {node.childCount > 0 ? ` · ${node.childCount} desdobramento(s)` : ""}
              </span>
            </span>
            <ChevronRight aria-hidden className="mt-0.5 size-4 text-muted" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
