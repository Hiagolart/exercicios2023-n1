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
