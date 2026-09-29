import type { SourceMetadata } from "@comex/core";
import type { PrismaClient } from "../generated/prisma/client";

/** Registra ou atualiza os metadados de uma fonte. */
export async function upsertDataSource(db: PrismaClient, source: SourceMetadata): Promise<void> {
  const data = {
    nome: source.nome,
    url: source.url,
    licenca: source.licenca,
    descricao: source.descricao,
    isMock: source.isMock,
  };
  await db.dataSource.upsert({
    where: { id: source.id },
    create: { id: source.id, ...data },
    update: data,
  });
}

export interface MockCleanup {
  fontes: number;
  ncm: number;
  aliquotas: number;
  destaques: number;
}

/** Remove todos os dados de fontes fictícias (usado antes de carregar dados oficiais). */
export async function removeMockData(db: PrismaClient): Promise<MockCleanup> {
  const mock = await db.dataSource.findMany({ where: { isMock: true }, select: { id: true } });
  const ids = mock.map((m) => m.id);
  if (ids.length === 0) return { fontes: 0, ncm: 0, aliquotas: 0, destaques: 0 };
  const [aliquotas, destaques, ncm] = await db.$transaction([
    db.aliquota.deleteMany({ where: { sourceId: { in: ids } } }),
    db.destaqueEx.deleteMany({ where: { sourceId: { in: ids } } }),
    db.ncmNode.deleteMany({ where: { sourceId: { in: ids } } }),
    db.ingestionError.deleteMany({ where: { run: { sourceId: { in: ids } } } }),
    db.ingestionRun.deleteMany({ where: { sourceId: { in: ids } } }),
    db.dataSource.deleteMany({ where: { id: { in: ids } } }),
  ]);
  return {
    fontes: ids.length,
    ncm: ncm.count,
    aliquotas: aliquotas.count,
    destaques: destaques.count,
  };
}
