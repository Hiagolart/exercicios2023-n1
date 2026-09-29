import { ncmTreeQuerySchema } from "@comex/core";
import { jsonData, parseSearchParams, protectedRoute } from "@/lib/api";
import { ncmData } from "@/lib/data/ncm";

/** GET /api/v1/ncm/tree?parent=8427 — filhos diretos de um nó (sem parâmetro: capítulos). */
export const GET = protectedRoute(async (request) => {
  const query = parseSearchParams(request, ncmTreeQuerySchema);
  if (!query.ok) return query.response;

  const [nodes, run] = await Promise.all([
    ncmData.children(query.data.parent),
    ncmData.latestRun(),
  ]);
  const sources = new Map(nodes.map((n) => [n.source.id, n.source]));

  return jsonData(
    nodes.map(({ source, lastSeen, ...node }) => ({
      ...node,
      sourceId: source.id,
      atualizadoEm: lastSeen?.finishedAt ?? null,
    })),
    { fonte: [...sources.values()], atualizadoEm: run?.finishedAt?.toISOString() ?? null },
  );
});
