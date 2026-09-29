-- Evita espaço inicial no texto de busca dos capítulos (nós sem ancestrais).
CREATE OR REPLACE FUNCTION refresh_ncm_busca() RETURNS void
LANGUAGE sql AS $$
  WITH RECURSIVE arvore AS (
    SELECT codigo, NULL::text AS ancestrais
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
           || setweight(to_tsvector('portuguese', unaccent(coalesce(arvore.ancestrais, ''))), 'B')
  FROM arvore
  WHERE arvore.codigo = n.codigo;
$$;

SELECT refresh_ncm_busca();
