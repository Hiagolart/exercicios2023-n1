import "server-only";
import type { ParsedSearch } from "@comex/core";
import {
  getLatestSuccessfulRun,
  getNcmNode,
  getNcmPath,
  getNcmStats,
  getPrisma,
  listNcmChildren,
  searchNcm,
} from "@comex/db";

/** Camada de dados da interface: concentra o acesso ao banco usado pelas páginas. */
export const ncmData = {
  children: (parent: string | null) => listNcmChildren(getPrisma(), parent),
  node: (codigo: string) => getNcmNode(getPrisma(), codigo),
  path: (codigo: string) => getNcmPath(getPrisma(), codigo),
  stats: () => getNcmStats(getPrisma()),
  latestRun: () => getLatestSuccessfulRun(getPrisma(), "ncm"),
  search: (query: ParsedSearch, limit?: number) => searchNcm(getPrisma(), query, limit),
};
