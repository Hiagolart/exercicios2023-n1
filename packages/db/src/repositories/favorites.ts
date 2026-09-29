import type { FavoritoTipo, PrismaClient } from "../generated/prisma/client";

export interface FavoriteKey {
  userId: string;
  tipo: FavoritoTipo;
  referencia: string;
}

export async function isFavorite(db: PrismaClient, key: FavoriteKey): Promise<boolean> {
  const found = await db.favorito.findUnique({
    where: { userId_tipo_referencia: key },
    select: { id: true },
  });
  return found !== null;
}

/** Alterna o favorito e devolve o novo estado. */
export async function toggleFavorite(db: PrismaClient, key: FavoriteKey): Promise<boolean> {
  const removed = await db.favorito.deleteMany({ where: key });
  if (removed.count > 0) return false;
  await db.favorito.upsert({ where: { userId_tipo_referencia: key }, create: key, update: {} });
  return true;
}

export interface FavoriteNcm {
  codigo: string;
  descricao: string | null;
  createdAt: Date;
}

/** NCMs favoritas do usuário, das mais recentes para as mais antigas. */
export async function listFavoriteNcms(
  db: PrismaClient,
  userId: string,
  limit = 100,
): Promise<FavoriteNcm[]> {
  const favorites = await db.favorito.findMany({
    where: { userId, tipo: "ncm" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { referencia: true, createdAt: true },
  });
  const nodes = await db.ncmNode.findMany({
    where: { codigo: { in: favorites.map((f) => f.referencia) } },
    select: { codigo: true, descricao: true },
  });
  const byCode = new Map(nodes.map((n) => [n.codigo, n.descricao]));
  // Um favorito cujo código saiu da base continua listado, sem descrição.
  return favorites.map((f) => ({
    codigo: f.referencia,
    descricao: byCode.get(f.referencia) ?? null,
    createdAt: f.createdAt,
  }));
}
