import "server-only";
import {
  getLatestSuccessfulRun,
  getNcmNode,
  getNcmPath,
  getNcmStats,
  getPrisma,
  listNcmChildren,
} from "@comex/db";

/** Camada de dados da interface: concentra o acesso ao banco usado pelas páginas. */
export const ncmData = {
  children: (parent: string | null) => listNcmChildren(getPrisma(), parent),
  node: (codigo: string) => getNcmNode(getPrisma(), codigo),
  path: (codigo: string) => getNcmPath(getPrisma(), codigo),
  stats: () => getNcmStats(getPrisma()),
  latestRun: () => getLatestSuccessfulRun(getPrisma(), "ncm"),
};
