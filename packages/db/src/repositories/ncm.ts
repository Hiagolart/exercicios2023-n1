import type { NcmRecord } from "@comex/core";
import type { NcmLevel, PrismaClient } from "../generated/prisma/client";

export interface NcmNodeView {
  codigo: string;
  nivel: NcmLevel;
  descricao: string;
  parentCodigo: string | null;
  dataInicio: Date | null;
  dataFim: Date | null;
  atoTipo: string | null;
  atoNumero: string | null;
  atoAno: number | null;
  childCount: number;
  source: { id: string; nome: string; url: string | null; isMock: boolean };
  /** Data de referência da carga mais recente em que o código constava. */
  lastSeen: { finishedAt: Date | null; referenceDate: Date | null } | null;
}

const nodeSelect = {
  codigo: true,
  nivel: true,
  descricao: true,
  parentCodigo: true,
  dataInicio: true,
  dataFim: true,
  atoTipo: true,
  atoNumero: true,
  atoAno: true,
  lastSeenRunId: true,
  source: { select: { id: true, nome: true, url: true, isMock: true } },
} as const;

type SelectedNode = Awaited<ReturnType<typeof findNodes>>[number];

function findNodes(db: PrismaClient, where: { parentCodigo: string | null } | { codigo: string }) {
  return db.ncmNode.findMany({ where, select: nodeSelect, orderBy: { codigo: "asc" } });
}

async function toViews(db: PrismaClient, nodes: SelectedNode[]): Promise<NcmNodeView[]> {
  if (nodes.length === 0) return [];
  const codes = nodes.map((n) => n.codigo);
  const runIds = [...new Set(nodes.map((n) => n.lastSeenRunId).filter((id): id is string => !!id))];
  const [counts, runs] = await Promise.all([
    db.ncmNode.groupBy({
      by: ["parentCodigo"],
      where: { parentCodigo: { in: codes } },
      _count: true,
    }),
    db.ingestionRun.findMany({
      where: { id: { in: runIds } },
      select: { id: true, finishedAt: true, referenceDate: true },
    }),
  ]);
  const countByParent = new Map(counts.map((c) => [c.parentCodigo, c._count]));
  const runById = new Map(runs.map((r) => [r.id, r]));

  return nodes.map(({ lastSeenRunId, ...node }) => {
    const run = lastSeenRunId ? runById.get(lastSeenRunId) : undefined;
    return {
      ...node,
      childCount: countByParent.get(node.codigo) ?? 0,
      lastSeen: run ? { finishedAt: run.finishedAt, referenceDate: run.referenceDate } : null,
    };
  });
}

/** Filhos diretos de um nó; `null` retorna os capítulos. */
export async function listNcmChildren(
  db: PrismaClient,
  parent: string | null,
): Promise<NcmNodeView[]> {
  return toViews(db, await findNodes(db, { parentCodigo: parent }));
}

export async function getNcmNode(db: PrismaClient, codigo: string): Promise<NcmNodeView | null> {
  const [view] = await toViews(db, await findNodes(db, { codigo }));
  return view ?? null;
}

/** Cadeia de ancestrais (do capítulo até o próprio nó). */
export async function getNcmPath(
  db: PrismaClient,
  codigo: string,
): Promise<{ codigo: string; descricao: string }[]> {
  const path: { codigo: string; descricao: string }[] = [];
  let current: string | null = codigo;
  // A profundidade máxima da NCM é 6 níveis; o limite protege contra ciclos.
  for (let depth = 0; current && depth < 8; depth++) {
    const node: { codigo: string; descricao: string; parentCodigo: string | null } | null =
      await db.ncmNode.findUnique({
        where: { codigo: current },
        select: { codigo: true, descricao: true, parentCodigo: true },
      });
    if (!node) break;
    path.unshift({ codigo: node.codigo, descricao: node.descricao });
    current = node.parentCodigo;
  }
  return path;
}

export interface NcmStats {
  total: number;
  subitens: number;
  capitulos: number;
}

export async function getNcmStats(db: PrismaClient): Promise<NcmStats> {
  const rows = await db.ncmNode.groupBy({ by: ["nivel"], _count: true });
  const byLevel = new Map(rows.map((r) => [r.nivel, r._count]));
  return {
    total: rows.reduce((sum, r) => sum + r._count, 0),
    subitens: byLevel.get("subitem") ?? 0,
    capitulos: byLevel.get("capitulo") ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Escrita (usada pela ingestão)
// ---------------------------------------------------------------------------

export interface NcmWriteInput extends NcmRecord {
  parentCodigo: string | null;
}

export interface NcmWriteResult {
  inseridos: number;
  atualizados: number;
  inalterados: number;
}

const COMPARED_FIELDS = [
  "nivel",
  "parentCodigo",
  "descricao",
  "atoTipo",
  "atoNumero",
  "atoAno",
  "sourceId",
] as const satisfies readonly (keyof NcmWriteInput | "sourceId")[];

function sameDate(a: Date | null, b: Date | null): boolean {
  return (a?.getTime() ?? null) === (b?.getTime() ?? null);
}

const WRITE_CHUNK = 500;

/**
 * Insere ou atualiza nós da nomenclatura de forma idempotente.
 * Registros sem alteração só têm `last_seen_run_id` atualizado.
 */
export async function upsertNcmNodes(
  db: PrismaClient,
  records: NcmWriteInput[],
  ctx: { sourceId: string; runId: string },
): Promise<NcmWriteResult> {
  const existing = await db.ncmNode.findMany({
    where: { codigo: { in: records.map((r) => r.codigo) } },
  });
  const byCode = new Map(existing.map((n) => [n.codigo, n]));

  const toCreate: NcmWriteInput[] = [];
  const toUpdate: NcmWriteInput[] = [];
  const unchanged: string[] = [];

  for (const record of records) {
    const current = byCode.get(record.codigo);
    if (!current) {
      toCreate.push(record);
      continue;
    }
    const candidate = { ...record, sourceId: ctx.sourceId };
    const changed =
      COMPARED_FIELDS.some((field) => current[field] !== candidate[field]) ||
      !sameDate(current.dataInicio, record.dataInicio) ||
      !sameDate(current.dataFim, record.dataFim);
    if (changed) toUpdate.push(record);
    else unchanged.push(record.codigo);
  }

  for (let i = 0; i < toCreate.length; i += WRITE_CHUNK) {
    await db.ncmNode.createMany({
      data: toCreate
        .slice(i, i + WRITE_CHUNK)
        .map((r) => ({ ...r, sourceId: ctx.sourceId, lastSeenRunId: ctx.runId })),
    });
  }
  for (let i = 0; i < toUpdate.length; i += WRITE_CHUNK) {
    await db.$transaction(
      toUpdate.slice(i, i + WRITE_CHUNK).map(({ codigo, ...data }) =>
        db.ncmNode.update({
          where: { codigo },
          data: { ...data, sourceId: ctx.sourceId, lastSeenRunId: ctx.runId },
        }),
      ),
    );
  }
  for (let i = 0; i < unchanged.length; i += WRITE_CHUNK) {
    await db.ncmNode.updateMany({
      where: { codigo: { in: unchanged.slice(i, i + WRITE_CHUNK) } },
      data: { lastSeenRunId: ctx.runId },
    });
  }

  return {
    inseridos: toCreate.length,
    atualizados: toUpdate.length,
    inalterados: unchanged.length,
  };
}
