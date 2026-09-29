import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { PrismaClient } from "../src";
import { isFavorite, listFavoriteNcms, toggleFavorite } from "../src/repositories/favorites";
import {
  clearSearchHistory,
  listRecentSearches,
  listTopSearches,
  recordSearch,
} from "../src/repositories/history";
import { createTestDb, createUser, resetDb, seedNcm } from "./helpers";

let db: PrismaClient;

beforeAll(() => {
  db = createTestDb();
});
afterAll(async () => {
  await db.$disconnect();
});
beforeEach(async () => {
  await resetDb(db);
  await seedNcm(db, [
    ["98", "Capítulo de teste"],
    ["98010000", "Subitem de teste"],
  ]);
});

describe("favoritos", () => {
  it("alterna e lista NCMs favoritas", async () => {
    const userId = await createUser(db);
    const key = { userId, tipo: "ncm" as const, referencia: "98010000" };

    expect(await toggleFavorite(db, key)).toBe(true);
    expect(await isFavorite(db, key)).toBe(true);
    expect(await listFavoriteNcms(db, userId)).toMatchObject([
      { codigo: "98010000", descricao: "Subitem de teste" },
    ]);

    expect(await toggleFavorite(db, key)).toBe(false);
    expect(await listFavoriteNcms(db, userId)).toEqual([]);
  });

  it("isola os favoritos por usuário", async () => {
    const a = await createUser(db, "a");
    const b = await createUser(db, "b");
    await toggleFavorite(db, { userId: a, tipo: "ncm", referencia: "98" });
    expect(await listFavoriteNcms(db, b)).toEqual([]);
  });
});

describe("histórico", () => {
  it("registra, deduplica repetições próximas e ranqueia termos", async () => {
    const userId = await createUser(db);
    const t0 = new Date("2026-09-29T12:00:00Z");
    await recordSearch(db, { userId, termo: "motor", tipo: "descricao" }, t0);
    await recordSearch(
      db,
      { userId, termo: "motor", tipo: "descricao" },
      new Date(t0.getTime() + 10_000),
    );
    await recordSearch(
      db,
      { userId, termo: "motor", tipo: "descricao" },
      new Date(t0.getTime() + 120_000),
    );
    await recordSearch(
      db,
      { userId, termo: "8427", tipo: "codigo" },
      new Date(t0.getTime() + 180_000),
    );

    const recent = await listRecentSearches(db, userId);
    expect(recent.map((r) => r.termo)).toEqual(["8427", "motor", "motor"]);
    expect(await listTopSearches(db, userId)).toEqual([
      { termo: "motor", total: 2 },
      { termo: "8427", total: 1 },
    ]);

    expect(await clearSearchHistory(db, userId)).toBe(3);
    expect(await listRecentSearches(db, userId)).toEqual([]);
  });
});
