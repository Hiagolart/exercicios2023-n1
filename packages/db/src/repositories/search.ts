import { ncmStructureOf, type ParsedSearch } from "@comex/core";
import type { NcmLevel, PrismaClient } from "../generated/prisma/client";

export interface NcmSearchHit {
  codigo: string;
  nivel: NcmLevel;
  descricao: string;
  dataInicio: Date | null;
  dataFim: Date | null;
  isMock: boolean;
  capitulo: { codigo: string; descricao: string | null };
  posicao: { codigo: string; descricao: string | null } | null;
  subposicao: { codigo: string; descricao: string | null } | null;
}

export interface NcmSearchResult {
  hits: NcmSearchHit[];
  /** Estratégia usada: prefixo de código, busca textual ou busca aproximada. */
  estrategia: "codigo" | "texto" | "aproximada" | "nenhuma";
}

/** Similaridade mínima (0–1) para a busca aproximada. */
const MIN_WORD_SIMILARITY = 0.45;

/** Atualiza os campos de busca após uma carga da nomenclatura. */
export async function refreshNcmSearch(db: PrismaClient): Promise<void> {
  await db.$executeRaw`SELECT refresh_ncm_busca()`;
}

async function codesByPrefix(db: PrismaClient, digits: string, limit: number): Promise<string[]> {
  const rows = await db.$queryRaw<{ codigo: string }[]>`
    SELECT codigo FROM ncm_node
    WHERE codigo LIKE ${`${digits}%`}
    ORDER BY length(codigo), codigo
    LIMIT ${limit}`;
  return rows.map((r) => r.codigo);
}

async function codesByText(db: PrismaClient, text: string, limit: number): Promise<string[]> {
  const rows = await db.$queryRaw<{ codigo: string }[]>`
    SELECT n.codigo
    FROM ncm_node n, websearch_to_tsquery('portuguese', unaccent(${text})) AS q
    WHERE n.busca @@ q
    ORDER BY (n.nivel = 'subitem') DESC, ts_rank(n.busca, q) DESC, n.codigo
    LIMIT ${limit}`;
  return rows.map((r) => r.codigo);
}

async function codesBySimilarity(db: PrismaClient, text: string, limit: number): Promise<string[]> {
  const rows = await db.$queryRaw<{ codigo: string }[]>`
    SELECT codigo
    FROM ncm_node
    WHERE word_similarity(lower(unaccent(${text})), texto_busca) >= ${MIN_WORD_SIMILARITY}
    ORDER BY word_similarity(lower(unaccent(${text})), texto_busca) DESC, (nivel = 'subitem') DESC, codigo
    LIMIT ${limit}`;
  return rows.map((r) => r.codigo);
}

/** Carrega os resultados com as descrições de capítulo, posição e subposição. */
async function loadHits(db: PrismaClient, codes: string[]): Promise<NcmSearchHit[]> {
  if (codes.length === 0) return [];
  const structures = new Map(codes.map((c) => [c, ncmStructureOf(c)]));
  const related = new Set<string>(codes);
  for (const s of structures.values()) {
    for (const code of [s.capitulo, s.posicao, s.subposicao]) if (code) related.add(code);
  }
  const nodes = await db.ncmNode.findMany({
    where: { codigo: { in: [...related] } },
    select: {
      codigo: true,
      nivel: true,
      descricao: true,
      dataInicio: true,
      dataFim: true,
      source: { select: { isMock: true } },
    },
  });
  const byCode = new Map(nodes.map((n) => [n.codigo, n]));
  const ref = (code: string | null) =>
    code ? { codigo: code, descricao: byCode.get(code)?.descricao ?? null } : null;

  return codes.flatMap((codigo) => {
    const node = byCode.get(codigo);
    const s = structures.get(codigo);
    if (!node || !s) return [];
    return [
      {
        codigo,
        nivel: node.nivel,
        descricao: node.descricao,
        dataInicio: node.dataInicio,
        dataFim: node.dataFim,
        isMock: node.source.isMock,
        capitulo: { codigo: s.capitulo, descricao: byCode.get(s.capitulo)?.descricao ?? null },
        posicao: s.posicao === codigo ? null : ref(s.posicao),
        subposicao: s.subposicao === codigo ? null : ref(s.subposicao),
      },
    ];
  });
}

/**
 * Pesquisa na nomenclatura. Códigos buscam por prefixo; textos usam a busca
 * textual em português e, sem resultados, a busca aproximada por trigramas
 * (tolera erros de digitação).
 */
export async function searchNcm(
  db: PrismaClient,
  query: ParsedSearch,
  limit = 50,
): Promise<NcmSearchResult> {
  if (query.kind === "invalido") return { hits: [], estrategia: "nenhuma" };
  if (query.kind === "codigo") {
    return {
      hits: await loadHits(db, await codesByPrefix(db, query.digits, limit)),
      estrategia: "codigo",
    };
  }
  const textCodes = await codesByText(db, query.text, limit);
  if (textCodes.length > 0) return { hits: await loadHits(db, textCodes), estrategia: "texto" };
  const similar = await codesBySimilarity(db, query.text, limit);
  return {
    hits: await loadHits(db, similar),
    estrategia: similar.length > 0 ? "aproximada" : "nenhuma",
  };
}
