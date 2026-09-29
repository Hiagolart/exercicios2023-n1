import type { PesquisaTipo, PrismaClient } from "../generated/prisma/client";

/** Pesquisas idênticas repetidas dentro desta janela não geram novo registro. */
const DEDUPE_WINDOW_MS = 60_000;

export async function recordSearch(
  db: PrismaClient,
  entry: { userId: string; termo: string; tipo: PesquisaTipo },
  now: Date = new Date(),
): Promise<void> {
  const recent = await db.pesquisa.findFirst({
    where: {
      userId: entry.userId,
      termo: entry.termo,
      tipo: entry.tipo,
      createdAt: { gte: new Date(now.getTime() - DEDUPE_WINDOW_MS) },
    },
    select: { id: true },
  });
  if (!recent) await db.pesquisa.create({ data: { ...entry, createdAt: now } });
}

export interface SearchHistoryEntry {
  id: string;
  termo: string;
  tipo: PesquisaTipo;
  createdAt: Date;
}

export async function listRecentSearches(
  db: PrismaClient,
  userId: string,
  limit = 50,
): Promise<SearchHistoryEntry[]> {
  return db.pesquisa.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, termo: true, tipo: true, createdAt: true },
  });
}

export interface TopSearch {
  termo: string;
  total: number;
}

/** Termos mais pesquisados pelo usuário. */
export async function listTopSearches(
  db: PrismaClient,
  userId: string,
  limit = 5,
): Promise<TopSearch[]> {
  const rows = await db.pesquisa.groupBy({
    by: ["termo"],
    where: { userId },
    _count: { termo: true },
    orderBy: [{ _count: { termo: "desc" } }, { termo: "asc" }],
    take: limit,
  });
  return rows.map((r) => ({ termo: r.termo, total: r._count.termo }));
}

export async function clearSearchHistory(db: PrismaClient, userId: string): Promise<number> {
  const { count } = await db.pesquisa.deleteMany({ where: { userId } });
  return count;
}
