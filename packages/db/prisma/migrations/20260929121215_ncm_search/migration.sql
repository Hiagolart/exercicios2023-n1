-- Extensões para busca sem acento e busca aproximada (trigramas).
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- AlterTable
ALTER TABLE "ncm_node" ADD COLUMN     "busca" tsvector,
ADD COLUMN     "texto_busca" TEXT;

-- CreateIndex
CREATE INDEX "ncm_node_busca_idx" ON "ncm_node" USING GIN ("busca");

-- CreateIndex
CREATE INDEX "ncm_node_texto_busca_idx" ON "ncm_node" USING GIN ("texto_busca" gin_trgm_ops);

-- Recalcula os campos de busca de toda a nomenclatura. O texto de cada nó inclui
-- as descrições dos ancestrais, para que subitens genéricos ("Outros") sejam
-- encontrados pela descrição da posição ou subposição a que pertencem.
CREATE OR REPLACE FUNCTION refresh_ncm_busca() RETURNS void
LANGUAGE sql AS $$
  WITH RECURSIVE arvore AS (
    SELECT codigo, ''::text AS ancestrais
    FROM ncm_node
    WHERE parent_codigo IS NULL
    UNION ALL
    SELECT filho.codigo, concat_ws(' ', arvore.ancestrais, pai.descricao)
    FROM ncm_node filho
    JOIN arvore ON filho.parent_codigo = arvore.codigo
    JOIN ncm_node pai ON pai.codigo = arvore.codigo
  )
  UPDATE ncm_node AS n
  SET texto_busca = lower(unaccent(concat_ws(' ', arvore.ancestrais, n.descricao))),
      busca = setweight(to_tsvector('portuguese', unaccent(n.descricao)), 'A')
           || setweight(to_tsvector('portuguese', unaccent(arvore.ancestrais)), 'B')
  FROM arvore
  WHERE arvore.codigo = n.codigo;
$$;

SELECT refresh_ncm_busca();
