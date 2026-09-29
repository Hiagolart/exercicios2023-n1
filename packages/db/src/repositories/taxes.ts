import { planRateSync, type ExTarifarioRecord, type RateRecord, type Tributo } from "@comex/core";
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
    quota: row.quota,
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
    tipo: row.tipo === "nao_tributado" ? "nao_tributado" : "ad_valorem",
    aliquota: row.aliquota === null ? null : row.aliquota.toNumber(),
    vigenciaInicio: row.vigenciaInicio,
    vigenciaFim: row.vigenciaFim,
    atoLegal: row.atoLegal,
    lista: row.lista || null,
    quota: row.quota,
    observacao: row.observacao,
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
 * Sincroniza a carga completa de uma fonte com o que já existe dessa fonte,
 * preservando o histórico (ver `planRateSync`).
 */
export async function applyRates(
  db: PrismaClient,
  records: RateRecord[],
  ctx: { sourceId: string; runId: string; referencia: Date },
): Promise<RateWriteResult> {
  const existentes = (
    await db.aliquota.findMany({
      where: { sourceId: ctx.sourceId },
      include: { source: sourceSelect },
    })
  ).map(toStoredRate);
  const plan = planRateSync(existentes, records, ctx.referencia);

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
    quota: r.quota,
    sourceId: ctx.sourceId,
    ingestionRunId: ctx.runId,
  });

  await db.$transaction(
    async (tx) => {
      for (const { atual, vigenciaFim } of plan.encerrar) {
        await tx.aliquota.update({
          where: { id: atual.id },
          data: { vigenciaFim, ingestionRunId: ctx.runId },
        });
      }
      for (const { atual, novo } of plan.atualizar) {
        await tx.aliquota.update({
          where: { id: atual.id },
          data: {
            vigenciaFim: novo.vigenciaFim,
            atoLegal: novo.atoLegal,
            observacao: novo.observacao,
            quota: novo.quota,
            ingestionRunId: ctx.runId,
          },
        });
      }
      if (plan.remover.length > 0) {
        await tx.aliquota.deleteMany({ where: { id: { in: plan.remover.map((r) => r.id) } } });
      }
      for (let i = 0; i < plan.inserir.length; i += WRITE_CHUNK) {
        await tx.aliquota.createMany({ data: plan.inserir.slice(i, i + WRITE_CHUNK).map(toData) });
      }
    },
    { timeout: 300_000, maxWait: 30_000 },
  );

  return {
    inseridos: plan.inserir.length,
    atualizados: plan.atualizar.length + plan.encerrar.length + plan.remover.length,
    inalterados: plan.inalterados.length,
  };
}

const destaqueKey = (
  d: Pick<ExTarifarioRecord, "ncm" | "tributo" | "numero" | "lista" | "vigenciaInicio">,
) =>
  [
    d.ncm,
    d.tributo,
    d.numero,
    d.lista ?? "",
    d.vigenciaInicio?.toISOString().slice(0, 10) ?? "",
  ].join("|");

const sameDestaque = (a: ExTarifarioRecord, b: ExTarifarioRecord) =>
  a.descricao === b.descricao &&
  a.tipo === b.tipo &&
  a.aliquota === b.aliquota &&
  (a.vigenciaFim?.getTime() ?? null) === (b.vigenciaFim?.getTime() ?? null) &&
  a.atoLegal === b.atoLegal &&
  a.quota === b.quota &&
  a.observacao === b.observacao;

/**
 * Sincroniza os destaques "Ex" da fonte com a lista publicada na carga atual:
 * novos são inseridos, alterados são atualizados e os ausentes são removidos.
 */
export async function syncDestaques(
  db: PrismaClient,
  records: ExTarifarioRecord[],
  ctx: { sourceId: string; runId: string },
): Promise<RateWriteResult & { removidos: number }> {
  const existing = await db.destaqueEx.findMany({ where: { sourceId: ctx.sourceId } });
  const byKey = new Map(
    existing.map((row) => [
      destaqueKey({
        ncm: row.ncmCodigo,
        tributo: row.tributo as "II" | "IPI",
        numero: row.numero,
        lista: row.lista || null,
        vigenciaInicio: row.vigenciaInicio,
      }),
      row,
    ]),
  );
  const toData = (r: ExTarifarioRecord) => ({
    ncmCodigo: r.ncm,
    tributo: r.tributo,
    numero: r.numero,
    descricao: r.descricao,
    tipo: r.tipo,
    aliquota: r.aliquota,
    vigenciaInicio: r.vigenciaInicio,
    vigenciaFim: r.vigenciaFim,
    atoLegal: r.atoLegal,
    lista: r.lista ?? "",
    quota: r.quota,
    observacao: r.observacao,
    sourceId: ctx.sourceId,
    ingestionRunId: ctx.runId,
  });

  const inserir: ExTarifarioRecord[] = [];
  const atualizar: { id: string; record: ExTarifarioRecord }[] = [];
  let inalterados = 0;
  for (const record of records) {
    const key = destaqueKey(record);
    const row = byKey.get(key);
    byKey.delete(key);
    if (!row) inserir.push(record);
    else {
      const stored: ExTarifarioRecord = {
        ncm: row.ncmCodigo,
        tributo: row.tributo as "II" | "IPI",
        numero: row.numero,
        descricao: row.descricao,
        tipo: row.tipo === "nao_tributado" ? "nao_tributado" : "ad_valorem",
        aliquota: row.aliquota === null ? null : row.aliquota.toNumber(),
        vigenciaInicio: row.vigenciaInicio,
        vigenciaFim: row.vigenciaFim,
        atoLegal: row.atoLegal,
        lista: row.lista || null,
        quota: row.quota,
        observacao: row.observacao,
      };
      if (sameDestaque(stored, record)) inalterados++;
      else atualizar.push({ id: row.id, record });
    }
  }
  const remover = [...byKey.values()].map((row) => row.id);

  await db.$transaction(
    async (tx) => {
      if (remover.length > 0) await tx.destaqueEx.deleteMany({ where: { id: { in: remover } } });
      for (const { id, record } of atualizar)
        await tx.destaqueEx.update({ where: { id }, data: toData(record) });
      if (inserir.length > 0) await tx.destaqueEx.createMany({ data: inserir.map(toData) });
    },
    { timeout: 120_000, maxWait: 30_000 },
  );
  return {
    inseridos: inserir.length,
    atualizados: atualizar.length,
    inalterados,
    removidos: remover.length,
  };
}
