import "server-only";
import type { ParsedSearch } from "@comex/core";
import {
  getPrisma,
  isFavorite,
  listFavoriteNcms,
  listRecentSearches,
  listTopSearches,
  recordSearch,
} from "@comex/db";

/** Dados pessoais do usuário autenticado (favoritos e histórico). */
export const userData = {
  isFavoriteNcm: (userId: string, codigo: string) =>
    isFavorite(getPrisma(), { userId, tipo: "ncm", referencia: codigo }),
  favoriteNcms: (userId: string, limit?: number) => listFavoriteNcms(getPrisma(), userId, limit),
  recentSearches: (userId: string, limit?: number) =>
    listRecentSearches(getPrisma(), userId, limit),
  topSearches: (userId: string, limit?: number) => listTopSearches(getPrisma(), userId, limit),
  recordSearch: (userId: string, termo: string, query: ParsedSearch) => {
    if (query.kind === "invalido") return Promise.resolve();
    return recordSearch(getPrisma(), {
      userId,
      termo,
      tipo: query.kind === "codigo" ? "codigo" : "descricao",
    });
  },
};
