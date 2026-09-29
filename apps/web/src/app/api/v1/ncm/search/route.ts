import { ncmSearchQuerySchema, parseNcmSearch } from "@comex/core";
import { jsonData, jsonError, parseSearchParams, protectedRoute } from "@/lib/api";
import { ncmData } from "@/lib/data/ncm";

/** GET /api/v1/ncm/search?q=empilhadeira&limit=20 — pesquisa por código ou descrição. */
export const GET = protectedRoute(async (request) => {
  const params = parseSearchParams(request, ncmSearchQuerySchema);
  if (!params.ok) return params.response;

  const query = parseNcmSearch(params.data.q);
  if (query.kind === "invalido") return jsonError(400, query.motivo);

  const [result, run] = await Promise.all([
    ncmData.search(query, params.data.limit),
    ncmData.latestRun(),
  ]);
  return jsonData(result, {
    fonte: run ? [run.source] : [],
    atualizadoEm: run?.finishedAt?.toISOString() ?? null,
    metodologia:
      result.estrategia === "codigo"
        ? "Códigos que começam com os dígitos informados."
        : "Busca textual em português na descrição do código e dos níveis superiores; busca aproximada quando não há correspondência exata.",
  });
});
