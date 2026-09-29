import {
  planRateChanges,
  rateSeriesKey,
  type ExTarifarioRecord,
  type RateRecord,
  type Tributo,
} from "@comex/core";
import type { Prisma, PrismaClient } from "../generated/prisma/client";

export interface SourceRef {
  id: string;
  nome: string;
  url: string | null;
  isMock: boolean;
}

export interface StoredRate extends RateRecord {
  id: string;
  vigenciaInferida: boolean;
  source: SourceRef;
  atualizadoEm: Date;
}

export interface StoredDestaque extends ExTarifarioRecord {
  id: string;
  source: SourceRef;
}

const sourceSelect = { select: { id: true, nome: true, url: true, isMock: true } } as const;

type AliquotaRow = Prisma.AliquotaGetPayload<{ include: { source: typeof sourceSelect } }>;

function toStoredRate(row: AliquotaRow): StoredRate {
  return {
    id: row.id,
    ncm: row.ncmCodigo,
    tributo: row.tributo,
    regime: row.regime,
    lista: row.lista || null,
    tipo: row.tipo,
    aliquota: row.aliquota === null ? null : row.aliquota.toNumber(),
    vigenciaInicio: row.vigenciaInicio,
    vigenciaFim: row.vigenciaFim,
    vigenciaInferida: row.vigenciaInferida,
    atoLegal: row.atoLegal,
    observacao: row.observacao,
    source: row.source,
    atualizadoEm: row.updatedAt,
  };
}

/** Todas as alíquotas (vigentes e históricas) que podem se aplicar a uma NCM. */
export async function listRatesForNcm(db: PrismaClient, ncm: string): Promise<StoredRate[]> {
  const rows = await db.aliquota.findMany({
    where: { OR: [{ ncmCodigo: ncm }, { ncmCodigo: null }] },
    include: { source: sourceSelect },
    orderBy: [{ tributo: "asc" }, { vigenciaInicio: { sort: "desc", nulls: "last" } }],
  });
  return rows.map(toStoredRate);
}

export async function listDestaquesForNcm(
  db: PrismaClient,
  ncm: string,
): Promise<StoredDestaque[]> {
  const rows = await db.destaqueEx.findMany({
    where: { ncmCodigo: ncm },
    include: { source: sourceSelect },
    orderBy: [{ tributo: "asc" }, { numero: "asc" }],
  });
  return rows.map((row) => ({
    id: row.id,
    ncm: row.ncmCodigo,
    tributo: row.tributo as "II" | "IPI",
    numero: row.numero,
    descricao: row.descricao,
    aliquota: row.aliquota.toNumber(),
    vigenciaInicio: row.vigenciaInicio,
    vigenciaFim: row.vigenciaFim,
    atoLegal: row.atoLegal,
    source: row.source,
  }));
}

/** Quantidade de NCMs com alíquota própria, por tributo. */
export async function countRatedNcms(db: PrismaClient): Promise<Partial<Record<Tributo, number>>> {
  const rows = await db.aliquota.groupBy({
    by: ["tributo"],
    where: { ncmCodigo: { not: null }, vigenciaFim: null },
    _count: { ncmCodigo: true },
  });
  return Object.fromEntries(rows.map((r) => [r.tributo, r._count.ncmCodigo]));
}

// ---------------------------------------------------------------------------
// Escrita (usada pela ingestão)
// ---------------------------------------------------------------------------

export interface RateWriteResult {
  inseridos: number;
  atualizados: number;
  inalterados: number;
}

const WRITE_CHUNK = 1000;

/**
 * Grava alíquotas preservando o histórico: alíquotas iguais às vigentes ficam
 * como estão; alterações encerram o registro anterior e abrem um novo.
 * Só compara com registros abertos da mesma fonte.
 */
export async function applyRates(
  db: PrismaClient,
  records: RateRecord[],
  ctx: { sourceId: string; runId: string; referencia: Date },
): Promise<RateWriteResult> {
  const abertosRows = await db.aliquota.findMany({
    where: { sourceId: ctx.sourceId, vigenciaFim: null },
    include: { source: sourceSelect },
  });
  const keys = new Set(records.map(rateSeriesKey));
  const abertos = abertosRows.map(toStoredRate).filter((r) => keys.has(rateSeriesKey(r)));
  const plan = planRateChanges(abertos, records, ctx.referencia);

  const toData = (r: RateRecord): Prisma.AliquotaCreateManyInput => ({
    ncmCodigo: r.ncm,
    tributo: r.tributo,
    regime: r.regime,
    lista: r.lista ?? "",
    tipo: r.tipo,
    aliquota: r.aliquota,
    vigenciaInicio: r.vigenciaInicio,
    vigenciaFim: r.vigenciaFim,
    vigenciaInferida: plan.inferidos.has(r),
    atoLegal: r.atoLegal,
    observacao: r.observacao,
    sourceId: ctx.sourceId,
    ingestionRunId: ctx.runId,
  });

  await db.$transaction(async (tx) => {
    for (const { atual, vigenciaFim } of plan.encerrar) {
      await tx.aliquota.update({ where: { id: atual.id }, data: { vigenciaFim } });
    }
    for (let i = 0; i < plan.inserir.length; i += WRITE_CHUNK) {
      await tx.aliquota.createMany({ data: plan.inserir.slice(i, i + WRITE_CHUNK).map(toData) });
    }
  });

  return {
    inseridos: plan.inserir.length - plan.encerrar.length,
    atualizados: plan.encerrar.length,
    inalterados: plan.inalterados.length,
  };
}

/** Substitui os destaques "Ex" da fonte pelos da carga atual (a fonte publica a lista vigente completa). */
export async function replaceDestaques(
  db: PrismaClient,
  records: ExTarifarioRecord[],
  ctx: { sourceId: string; runId: string },
): Promise<number> {
  await db.$transaction([
    db.destaqueEx.deleteMany({ where: { sourceId: ctx.sourceId } }),
    db.destaqueEx.createMany({
      data: records.map((r) => ({
        ncmCodigo: r.ncm,
        tributo: r.tributo,
        numero: r.numero,
        descricao: r.descricao,
        aliquota: r.aliquota,
        vigenciaInicio: r.vigenciaInicio,
        vigenciaFim: r.vigenciaFim,
        atoLegal: r.atoLegal,
        sourceId: ctx.sourceId,
        ingestionRunId: ctx.runId,
      })),
    }),
  ]);
  return records.length;
}
