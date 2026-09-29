import type { DataKind, IngestionReport } from "@comex/core";
import type { PrismaClient } from "../generated/prisma/client";

/** Quantidade máxima de erros detalhados gravados por execução. */
const MAX_STORED_ERRORS = 1000;

export async function startIngestionRun(
  db: PrismaClient,
  params: { sourceId: string; kind: DataKind; fileHash?: string | null },
): Promise<string> {
  const run = await db.ingestionRun.create({
    data: { sourceId: params.sourceId, kind: params.kind, fileHash: params.fileHash ?? null },
  });
  return run.id;
}

export async function finishIngestionRun(
  db: PrismaClient,
  runId: string,
  report: IngestionReport,
  referenceDate: Date | null,
): Promise<void> {
  const errors = report.erros.slice(0, MAX_STORED_ERRORS).flatMap((rejected) =>
    rejected.issues.map((issue) => ({
      runId,
      linha: rejected.linha,
      campo: issue.campo,
      motivo: issue.motivo,
    })),
  );
  await db.$transaction([
    db.ingestionError.createMany({ data: errors }),
    db.ingestionRun.update({
      where: { id: runId },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        referenceDate,
        processados: report.processados,
        inseridos: report.inseridos,
        atualizados: report.atualizados,
        inalterados: report.inalterados,
        rejeitados: report.rejeitados,
      },
    }),
  ]);
}

export async function failIngestionRun(
  db: PrismaClient,
  runId: string,
  message: string,
): Promise<void> {
  await db.ingestionRun.update({
    where: { id: runId },
    data: { status: "failed", finishedAt: new Date(), errorMessage: message.slice(0, 2000) },
  });
}

export interface LatestRunInfo {
  finishedAt: Date | null;
  referenceDate: Date | null;
  source: { id: string; nome: string; url: string | null; isMock: boolean };
}

/** Última carga concluída com sucesso para um tipo de dado (base da "data de atualização"). */
export async function getLatestSuccessfulRun(
  db: PrismaClient,
  kind: DataKind,
): Promise<LatestRunInfo | null> {
  return db.ingestionRun.findFirst({
    where: { kind, status: "succeeded" },
    orderBy: { finishedAt: "desc" },
    select: {
      finishedAt: true,
      referenceDate: true,
      source: { select: { id: true, nome: true, url: true, isMock: true } },
    },
  });
}
