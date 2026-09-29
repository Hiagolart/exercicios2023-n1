import { isFullNcmCode, normalizeNcmCode, parseSourceDate } from "@comex/core";
import { jsonData, jsonError, protectedRoute } from "@/lib/api";
import { getTaxView } from "@/lib/data/taxes";

/** GET /api/v1/ncm/{codigo}/tributos?data=aaaa-mm-dd — alíquotas vigentes, histórico e destaques Ex. */
export async function GET(request: Request, context: { params: Promise<{ codigo: string }> }) {
  return protectedRoute(async () => {
    const codigo = normalizeNcmCode((await context.params).codigo);
    if (!isFullNcmCode(codigo)) return jsonError(400, "Informe uma NCM com 8 dígitos.");

    const rawDate = new URL(request.url).searchParams.get("data");
    const date = rawDate ? parseSourceDate(rawDate) : new Date();
    if (!date) return jsonError(400, "Data inválida. Use aaaa-mm-dd.");

    const view = await getTaxView(codigo, date);
    const sources = new Map(
      [...view.historico.map((r) => r.source), ...view.destaques.map((d) => d.source)].map((s) => [
        s.id,
        s,
      ]),
    );
    return jsonData(
      { ncm: codigo, data: date.toISOString().slice(0, 10), ...view },
      {
        fonte: [...sources.values()],
        atualizadoEm: null,
        metodologia:
          "Precedência: exceção vigente > alíquota da NCM > regra geral. Vigência avaliada na data informada.",
      },
    );
  })(request);
}
