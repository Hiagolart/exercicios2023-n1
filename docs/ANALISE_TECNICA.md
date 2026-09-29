# Comex Intelligence — Análise Técnica Inicial

> Documento de análise e proposta. **Nenhum código de aplicação foi escrito.**
> Aguardando aprovação antes da Fase 1.
>
> Data da análise: 29/09/2026

---

## 0. Resumo executivo

1. **O núcleo da proposta é viável com dados oficiais e abertos.** A combinação
   "NCM + estatística de importação" pode ser construída integralmente sobre
   duas fontes públicas brasileiras:
   - **Nomenclatura NCM** — Receita Federal / Portal Único Siscomex (sistema Classif).
   - **Estatísticas de importação** — MDIC / Comex Stat (dados abertos em CSV + API).
2. **Com dados públicos, a análise de empresas por NCM não é possível.** O MDIC
   **descontinuou** a lista de empresas exportadoras/importadoras, invocando o
   sigilo fiscal (arts. 198 e 199 do CTN), e informa que dados que revelem
   produtos, parceiros ou volumes por empresa não serão publicados. Nenhuma fonte
   oficial aberta liga **empresa ↔ NCM ↔ quantidade/valor**. O módulo "Empresas"
   deve ser construído só como **arquitetura preparada** (desligado por feature
   flag) até existir fonte legal (ex.: dados licenciados de um fornecedor, com
   contrato).
3. **O valor médio por unidade é calculável**, mas só para NCMs cuja _unidade
   estatística_ seja contável (ex.: "unidade", "par") e com regras de
   confiabilidade (quantidade zero, unidade em kg, mudança de unidade no
   período etc.).
4. **A IA deve operar por "ferramentas" que consultam agregados já calculados**,
   e não por SQL livre nem por conhecimento próprio do modelo. Assim, cada número
   citado tem origem rastreável.
5. **Restrição de ambiente:** o container desta sessão bloqueia o acesso de rede
   a `*.gov.br`, `balanca.economia.gov.br`, `api-comexstat.mdic.gov.br` e
   `portalunico.siscomex.gov.br`. A pesquisa foi feita por buscador e por
   documentação secundária. **Os formatos precisam ser confirmados com download
   real** (ver §3.4), liberando esses domínios na política de rede do ambiente
   ou rodando a ingestão em outro ambiente.

---

## 1. Análise da ideia e funcionalidades principais

| #   | Módulo                      | Descrição                                                                      | Depende de                            |
| --- | --------------------------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| 1   | Pesquisa NCM                | Por código, descrição, palavra-chave                                           | Tabela NCM (Classif)                  |
| 2   | Estrutura NCM               | Navegação Capítulo → Posição → Subposição → Item → Subitem                     | Tabela NCM                            |
| 3   | Detalhe NCM                 | Código, descrição, hierarquia, unidade estatística, vigência, ato legal, fonte | NCM + tabela de unidades (Comex Stat) |
| 4   | Inteligência de Importações | Quantidade, kg, FOB, frete, seguro, CIF, países, UF, via, URF, série mensal    | Comex Stat                            |
| 5   | Valor médio                 | FOB/quantidade estatística (e/ou FOB/kg) com metodologia exibida               | Comex Stat + regras                   |
| 6   | Países                      | Participação, ranking, evolução do _share_                                     | Comex Stat                            |
| 7   | Comparações                 | NCM × NCM, período × período                                                   | Agregados                             |
| 8   | Produtos                    | Descrição livre → NCMs candidatas → painel consolidado                         | Busca textual + IA (apoio)            |
| 9   | IA                          | Resumo/análise de NCM; Assistente Comex (chat)                                 | Agregados + LLM                       |
| 10  | Favoritos / Histórico       | Por usuário                                                                    | Autenticação                          |
| 11  | Exportação                  | CSV, Excel, PDF com fonte e data da base                                       | Agregados                             |
| 12  | Ingestão                    | CSV/JSON com validação e relatório                                             | Camada DataProvider                   |
| 13  | Empresas                    | **Bloqueado por falta de fonte legal**                                         | Fonte licenciada (futuro)             |

Complementos úteis e oficiais (pós-MVP): alíquotas do II (TEC/Camex), IPI (TIPI/RFB),
NESH (link para a fonte oficial), atributos de NCM (Cadastro de Atributos do Portal Único).

---

## 2. Fontes de dados pesquisadas

### 2.1 Nomenclatura NCM — Receita Federal / Portal Único Siscomex (Classif)

- **Endpoint público (sem captcha):**
  `GET https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json`
- **Campos documentados:** `dataUltimaAlteracao`, `codigo`, `descricao`,
  `dataInicio`, `dataFim`, `tipoOrgaoAtoIni`, `numeroAtoIni`, `anoAtoIni`.
- **Limitação:** o arquivo traz **só a tabela vigente** na data do download.
  Não inclui códigos extintos nem futuros. Para o histórico (necessário para
  ligar estatísticas antigas a códigos extintos), a tabela `NCM` do Comex Stat e
  as correlações do MDIC complementam.
- Referências:
  [Download NCM — Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/download-ncm-nomenclatura-comum-do-mercosul),
  [API Classif — Portal Único](https://docs.portalunico.siscomex.gov.br/api/clsf/),
  [Sistema Classif](https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/classif).

### 2.2 Estatísticas de importação — MDIC / Comex Stat

**a) Arquivos brutos (dados abertos, CSV `;`)** — fonte primária recomendada para ingestão.

- Padrão: `https://balanca.economia.gov.br/balanca/bd/comexstat-bd/ncm/IMP_{ANO}.csv`
- Colunas (importação por NCM):
  `CO_ANO, CO_MES, CO_NCM, CO_UNID, CO_PAIS, SG_UF_NCM, CO_VIA, CO_URF,
QT_ESTAT, KG_LIQUIDO, VL_FOB, VL_FRETE, VL_SEGURO`
- Tabelas auxiliares: NCM, NCM_UNIDADE, PAIS, UF, VIA, URF, correlações NCM↔SH/CUCI/ISIC etc.
- Arquivo por município (`IMP_COMPLETA_MUN`): ano, mês, **SH4** (não NCM), país,
  UF, município do domicílio fiscal da empresa, kg, FOB.
- Referências:
  [Dados abertos MDIC](https://www.gov.br/mdic/pt-br/assuntos/comercio-exterior/estatisticas/base-de-dados-bruta),
  [Manual de utilização dos dados](https://balanca.economia.gov.br/balanca/manual/Manual.pdf),
  [dados.gov.br](https://dados.gov.br/dados/conjuntos-dados/estatisticos-do-comercio-exterior-brasileiro-de-bens).

**b) API Comex Stat** — útil para atualização incremental e verificação cruzada.

- Base: `https://api-comexstat.mdic.gov.br` (spec: `/docs/doc.yaml`).
- Consulta geral com `period {from,to}` (AAAA-MM), `filters`, `details`
  (ex.: `ncm`, `country`, `state`), `monthDetail`, métricas `metricFOB`,
  `metricKG`, `metricStatistic`, `metricFreight`, `metricInsurance`, `metricCIF`.
- Idiomas pt/en/es. **Limites de taxa não documentados publicamente** →
  implementar _backoff_ e cache, sem depender da API para o tempo real da interface.
- CIF, frete e seguro na importação passaram a ser expostos na nova versão do
  Comex Stat (junho/2024). **A cobertura histórica desses campos precisa ser
  medida na ingestão**; onde estiverem ausentes ou zerados, a interface deve
  exibir "não disponível na fonte".
- Referências:
  [spec da API](https://api-comexstat.mdic.gov.br/docs/doc.yaml),
  [Novo Comex Stat (MDIC)](https://www.gov.br/mdic/pt-br/assuntos/noticias/2024/maio/novo-comex-stat-ficara-mais-rapido-e-funcional),
  [pacote R comexr (referência de uso)](https://cran.r-project.org/web/packages//comexr/refman/comexr.html).

### 2.3 Empresas importadoras

- A **lista de empresas exportadoras e importadoras foi descontinuada** pelo MDIC
  para cumprir o sigilo fiscal (CTN arts. 198/199; Portaria RFB 2.344/2011;
  entendimento da PGFN/AGU). O MDIC declara que não publicará dados que revelem
  produtos, parceiros comerciais ou volumes por empresa.
  [Nota informativa MDIC](https://balanca.economia.gov.br/balanca/metodologia/Nota-sobre-lista-de-exportadores-e-importadores.pdf).
- Ainda existem estatísticas **agregadas** por porte da empresa e por faixa de
  empregados (sem identificação), que podem virar indicadores de contexto.
  [Exportação e importação por porte](https://balanca.economia.gov.br/balanca/outras/porte/relatorio_porte.html).
- Plataformas privadas vendem dados por empresa. **Só devem ser usadas com
  contrato/licença explícita e avaliação jurídica (LGPD + sigilo fiscal).**

### 2.4 Fontes complementares oficiais (pós-MVP)

| Fonte                                         | Conteúdo                                        | Formato       | Observação                                                                                                                                                                                                                                    |
| --------------------------------------------- | ----------------------------------------------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TEC — Camex (Res. Gecex 272/2021, anexos I–X) | Alíquota do II, exceções (LETEC, LEBIT-BK etc.) | XLSX          | Atualizada periodicamente ([Tarifas vigentes](https://www.gov.br/mdic/pt-br/assuntos/camex/se-camex/strat/tarifas/vigentes))                                                                                                                  |
| TIPI — RFB                                    | Alíquota do IPI                                 | XLSX/PDF      | Afetada pela Reforma Tributária; tratar como dado versionado ([TIPI](https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/legislacao/tipi-tabela-de-incidencia-do-imposto-sobre-produtos-industrializados))                            |
| NESH — RFB (IN RFB 2.169/2023)                | Notas explicativas do SH                        | PDF / Classif | Recomenda-se **linkar** a fonte oficial, não republicar em massa (ver §4) ([NESH](https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/notas-explicativas-do-sistema-harmonizado)) |
| Cadastro de Atributos — Portal Único          | Atributos exigidos por NCM                      | API           | Útil para refinar a busca por produto ([docs](https://docs.portalunico.siscomex.gov.br/api/cada/))                                                                                                                                            |
| UN Comtrade / WITS                            | Comércio mundial                                | API           | Termos de uso restringem redistribuição; avaliar licença antes                                                                                                                                                                                |

---

## 3. Matriz de disponibilidade dos dados solicitados

| Dado                                     | Disponível?  | Fonte                                   | Observações                                                                                              |
| ---------------------------------------- | ------------ | --------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| NCM (código)                             | ✅           | Classif / Comex Stat                    | 8 dígitos                                                                                                |
| Descrição                                | ✅           | Classif                                 | Texto oficial                                                                                            |
| Estrutura (cap./posição/subposição/item) | ✅           | Classif (códigos de 2, 4, 6, 7 dígitos) | Hierarquia derivada dos códigos e textos                                                                 |
| Vigência / ato legal                     | ✅ (vigente) | Classif                                 | Histórico completo exige fontes adicionais                                                               |
| Unidade de medida estatística            | ✅           | Comex Stat `NCM_UNIDADE` / `CO_UNID`    | Pode ser "quilograma líquido", "unidade", "par", "litro"…                                                |
| Quantidade importada                     | ✅           | `QT_ESTAT`                              | Na unidade estatística da NCM                                                                            |
| Peso líquido                             | ✅           | `KG_LIQUIDO`                            | Sempre disponível                                                                                        |
| Valor FOB (US$)                          | ✅           | `VL_FOB`                                | Dólares correntes                                                                                        |
| Frete / Seguro                           | ⚠️           | `VL_FRETE`, `VL_SEGURO`                 | Cobertura histórica a medir                                                                              |
| Valor CIF                                | ⚠️           | FOB + frete + seguro / `metricCIF`      | Mostrar só onde frete e seguro existirem                                                                 |
| País de origem                           | ✅           | `CO_PAIS`                               |                                                                                                          |
| Estado (UF)                              | ✅           | `SG_UF_NCM`                             | Conferir a definição exata da UF no Manual                                                               |
| "Porto"                                  | ⚠️           | `CO_URF` (+ `CO_VIA`)                   | É a **URF** (unidade da Receita) e o **modal**, não necessariamente o porto físico. Rotular corretamente |
| Período                                  | ✅           | ano + mês                               | Série mensal desde 1997                                                                                  |
| Quantidade de operações (DI/DUIMP)       | ❌           | —                                       | Não publicado nos dados abertos                                                                          |
| Empresas por NCM                         | ❌           | —                                       | Sigilo fiscal                                                                                            |
| Município do importador                  | ⚠️           | arquivo `_MUN`                          | Só em **SH4**, sem quantidade estatística                                                                |
| Valor em R$                              | ⚠️           | —                                       | Não vem na base; se houver conversão, usar PTAX (BCB) e explicitar a metodologia                         |

### 3.4 Pontos a confirmar com download real (Fase 0)

1. Tamanho real dos arquivos anuais e volume total (esperado: milhões de linhas por ano).
2. Codificação (latin-1 × UTF-8), separador e aspas.
3. Anos em que `VL_FRETE`/`VL_SEGURO` vêm preenchidos.
4. Revisões retroativas: o MDIC revisa meses anteriores? (Determina a estratégia de _upsert_.)
5. Diferenças entre a tabela NCM do Classif (vigente) e a do Comex Stat (histórica).
6. Licença declarada no dados.gov.br para citar corretamente na interface.

---

## 4. Limitações legais e técnicas

### Legais

- **Sigilo fiscal (CTN 198/199):** nenhum dado de empresa × produto × volume
  vindo de fonte oficial aberta. Não inferir, não "reidentificar" empresas por
  cruzamento (ex.: NCM com um único importador numa UF). Recomendação: aplicar
  **supressão de células pequenas** nas visões por UF/URF quando a granularidade
  for muito fina (a definir).
- **LGPD:** CNPJ de MEI/empresário individual pode conter dados pessoais. Mesmo
  com fonte futura licenciada, tratar com base legal e minimização.
- **TECwin / terceiros:** não reutilizar textos, notas comentadas, bases ou
  interface. Usar só textos oficiais (atos normativos não têm proteção autoral —
  Lei 9.610/98, art. 8º, IV), sempre com fonte.
- **NESH:** o texto é publicado oficialmente pela RFB, mas deriva de obra da OMA.
  Por prudência: exibir trechos com citação e **link para a fonte oficial**, sem
  redistribuir a obra completa. Validar com assessoria jurídica se for exibir
  o texto integral.
- **Scraping:** desnecessário para o MVP. Todas as fontes do MVP têm download
  ou API oficiais.
- **IA:** a saída é apoio à pesquisa, nunca classificação fiscal. Aviso fixo em
  toda resposta e em toda página analítica.

### Técnicas

- **Unidade estatística heterogênea:** somar quantidade entre NCMs com unidades
  diferentes é inválido. Comparações de quantidade entre NCMs só com a mesma unidade.
- **Mudanças de NCM ao longo do tempo:** códigos são criados e extintos.
  As séries longas precisam de aviso "código vigente desde…" e, no futuro, de
  correlação.
- **Valor médio enganoso:** _mix_ de produtos dentro de uma mesma NCM ("outros")
  distorce médias. Mostrar a dispersão (maior/menor por país/mês) e o aviso metodológico.
- **Dados preliminares/revisados:** o mês mais recente pode ser revisado depois.
  Guardar `carga_id` e a data de extração em cada registro.
- **Volume de dados:** a tabela-fato cresce rápido. Particionar por ano e
  pré-agregar (visões materializadas) para a interface.
- **Acesso de rede do ambiente atual:** os domínios governamentais estão
  bloqueados neste ambiente (ver §0).

---

## 5. Arquitetura proposta

```
┌───────────────────────────────────────────────────────────────┐
│                     apps/web (Next.js)                        │
│  UI (RSC + Client Components) ── Route Handlers (/api/v1/*)   │
│        │                              │                       │
│        ▼                              ▼                       │
│   packages/ui               packages/core (domínio)           │
│   (componentes)             ├─ services (NCM, Import, Compare)│
│                             ├─ metrics (valor médio, variação)│
│                             ├─ ai (orquestração + tools)      │
│                             └─ validation (zod)               │
│                                       │                       │
│                             packages/db (Prisma + SQL)        │
└───────────────────────────────────────┼───────────────────────┘
                                        ▼
                                  PostgreSQL 16
                     (fato particionado + visões materializadas)
                                        ▲
┌───────────────────────────────────────┼───────────────────────┐
│               apps/ingest (worker Node/TS, CLI + cron)        │
│  DataProvider interface                                       │
│   ├─ ClassifNcmProvider        (JSON oficial)                 │
│   ├─ ComexStatBulkProvider     (CSV anual)                    │
│   ├─ ComexStatApiProvider      (incremental)                  │
│   ├─ FileUploadProvider        (CSV/JSON do usuário/admin)    │
│   └─ MockProvider              (DEV ONLY, marcado "fictício") │
│  Pipeline: fetch → parse → validate → stage → upsert → report │
└───────────────────────────────────────────────────────────────┘
```

**Princípios**

- **Monorepo** (pnpm workspaces): `apps/web`, `apps/ingest`, `packages/core`,
  `packages/db`, `packages/ui`, `packages/config`.
- **Regra de negócio fora da interface:** cálculos em `packages/core`, com funções
  puras e testáveis. A interface só consome os serviços.
- **API REST versionada** (`/api/v1/ncm`, `/api/v1/imports/summary`,
  `/api/v1/compare`, `/api/v1/ai/analyze`…), validada com **zod** e com envelope
  de resposta que **sempre** inclui `meta: { fonte, periodo, atualizadoEm, metodologia }`.
- **DataProvider** (contrato):
  ```ts
  interface DataProvider<T> {
    id: string; // "comexstat-bulk"
    kind: "ncm" | "imports" | "companies" | "tariffs";
    isMock: boolean;
    fetch(opts: FetchOptions): AsyncIterable<RawRecord>;
    validate(r: RawRecord): Result<T, ValidationError>;
    sourceInfo(): SourceMetadata; // url, licença, data de extração
  }
  ```
- **Ingestão desacoplada da web:** o worker roda por agendamento (cron mensal,
  alinhado ao calendário de divulgação do MDIC) e grava `ingestion_run` com o
  relatório (processados, inseridos, atualizados, rejeitados, erros).
- **IA com _tool calling_:** o LLM recebe apenas ferramentas determinísticas
  (`getNcmSummary`, `getImportSeries`, `getTopCountries`, `comparePeriods`…),
  cujas saídas vêm do banco com `meta` de fonte. O prompt de sistema proíbe
  números fora das ferramentas, e a resposta final lista as consultas usadas.
  Não há SQL gerado pelo modelo. O provedor de LLM fica atrás de uma interface
  e é configurado por variável de ambiente.
- **Segurança:** autenticação por sessão com cookies httpOnly; RBAC simples
  (`user`, `admin`); middleware de proteção de rotas; rate limiting por
  usuário/IP (mais restritivo nos endpoints de IA e exportação); Prisma e
  queries parametrizadas; erros sanitizados; segredos só em `.env`
  (com `.env.example` sem valores); cabeçalhos de segurança (CSP etc.).

---

## 6. Banco de dados proposto

Ajustes em relação à estrutura sugerida, e por quê:

- `periodo` vira `ano` + `mes` (inteiros), porque consultas e partições ficam
  mais simples e evitam ambiguidade de formato.
- Inclusão de `kg_liquido`, `via` e `urf`, que existem na fonte e são úteis.
- `valor_cif` **não é armazenado**: é derivado (FOB + frete + seguro) e fica
  nulo quando faltam componentes.
- Dimensões (`pais`, `uf`, `via`, `urf`, `unidade`) em tabelas próprias, com
  códigos oficiais.
- `fonte` vira FK para `data_source`, e cada fato referencia a carga (`ingestion_run`).
- `empresas` / `importacao_empresas` ficam no esquema, **vazias e atrás de
  feature flag**, até existir fonte legal.

### Tabelas

**Nomenclatura**

- `ncm_node` — `id, codigo (2–8 díg.), nivel (capitulo|posicao|subposicao|item|subitem), parent_id, descricao, data_inicio, data_fim, ato_tipo, ato_numero, ato_ano, source_id, updated_at`
  - Índices: `codigo` único por vigência; GIN `tsvector('portuguese', unaccent(descricao))`; GIN `pg_trgm`.
- `ncm` — visão/tabela das folhas de 8 dígitos com `capitulo, posicao, subposicao, unidade_id`.
- `ncm_sinonimo` — termos curados para a busca por produto (`termo, ncm_id, origem: curadoria|usuario|ia_sugerida, aprovado`).

**Dimensões**

- `pais (co_pais, nome, iso3)`, `uf (sigla, nome)`, `via (co_via, nome)`,
  `urf (co_urf, nome)`, `unidade (co_unid, nome, sigla, contavel boolean)`.

**Fatos**

- `importacao_mensal` — `id, ano, mes, ncm_id, pais_id, uf, via_id, urf_id, unidade_id, qt_estat numeric, kg_liquido numeric, vl_fob numeric, vl_frete numeric null, vl_seguro numeric null, source_id, ingestion_run_id, created_at, updated_at`
  - Chave natural única: `(ano, mes, ncm_id, pais_id, uf, via_id, urf_id)` para _upsert_ idempotente.
  - **Particionada por `ano`.**
- Visões materializadas: `mv_imp_ncm_ano`, `mv_imp_ncm_mes`, `mv_imp_ncm_pais_ano`, `mv_imp_ncm_uf_ano`, atualizadas ao fim de cada ingestão.

**Proveniência**

- `data_source (id, nome, url, licenca, is_mock, descricao)`
- `ingestion_run (id, source_id, iniciado_em, finalizado_em, status, processados, inseridos, atualizados, rejeitados, periodo_coberto, arquivo_hash)`
- `ingestion_error (run_id, linha, campo, motivo, payload_resumido)`

**Usuários e uso**

- `user`, `session`, `account` (conforme a lib de autenticação)
- `favorito (id, user_id, tipo: ncm|produto|pais|empresa, referencia, created_at)`
- `pesquisa (id, user_id, termo, tipo, created_at)`
- `ai_analise (id, user_id, ncm_id, parametros_hash, prompt_version, resposta, fontes jsonb, created_at)` — cache e auditoria.

**Empresas (preparado, inativo)**

- `empresa (id, nome, identificador, uf, pais, source_id, created_at)`
- `importacao_empresa (id, importacao_id, empresa_id, quantidade, valor, source_id)`

### Regra do valor médio (pertence a `packages/core`)

```
válido se:  unidade.contavel = true
          AND qt_estat > 0
          AND vl_fob > 0
          AND unidade constante no período comparado
valor_medio = Σ vl_fob / Σ qt_estat   (média ponderada, nunca média de médias)
caso contrário: null + motivo ("unidade em kg", "quantidade zero", "unidade alterada")
```

Adicionalmente: exibir sempre o preço médio por kg (FOB/kg) como métrica
alternativa, identificada como tal.

---

## 7. Stack proposta

| Camada                  | Escolha                                                                                    | Justificativa                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Linguagem               | TypeScript `strict`                                                                        | Requisito; tipos compartilhados entre web e ingestão                                                             |
| Web                     | Next.js (App Router)                                                                       | Requisito; RSC reduz o JS enviado em páginas de dados                                                            |
| API                     | Route Handlers do Next + camada de serviço em `packages/core`                              | Dispensa backend separado no MVP; os serviços podem migrar para um backend dedicado (ex.: Fastify) sem reescrita |
| Ingestão                | Worker Node/TS separado (`apps/ingest`)                                                    | Carga pesada fora do processo web                                                                                |
| Banco                   | PostgreSQL 16                                                                              | Relacional, particionamento, FTS em português, `pg_trgm`, `unaccent`                                             |
| ORM                     | Prisma (CRUD) + SQL tipado (`$queryRaw`/TypedSQL) para agregações                          | O Prisma não expressa bem visões materializadas e agregações analíticas                                          |
| UI                      | Tailwind CSS + componentes próprios (base Radix / shadcn)                                  | Identidade própria, acessibilidade                                                                               |
| Gráficos                | Apache ECharts (`echarts-for-react`)                                                       | Desempenho com séries longas, tooltips ricos, exportação de imagem para PDF. Alternativa mais leve: Recharts     |
| Tabelas                 | TanStack Table                                                                             | Filtros e ordenação                                                                                              |
| Estado de URL / filtros | `nuqs` ou search params                                                                    | Filtros compartilháveis por link                                                                                 |
| Autenticação            | Better Auth (e-mail/senha + OAuth), com adapter Prisma                                     | Moderno, suporta credenciais com segurança. Alternativa: Auth.js v5                                              |
| Validação               | zod                                                                                        | Entrada de API, formulários e ingestão                                                                           |
| Rate limit              | Tabela no Postgres ou Redis (Upstash)                                                      | Começa sem infraestrutura extra                                                                                  |
| IA                      | Interface `LlmProvider`; SDK do provedor via variável de ambiente; _tool calling_          | Independência de fornecedor                                                                                      |
| Exportação              | `exceljs` (XLSX), CSV nativo, PDF via Playwright renderizando uma rota de relatório        | Os gráficos saem no PDF idênticos aos da tela                                                                    |
| Testes                  | Vitest (unitário/integração), Testing Library, Playwright (E2E), Testcontainers (Postgres) |                                                                                                                  |
| Qualidade               | ESLint, Prettier, `tsc --noEmit`, CI no GitHub Actions                                     | lint → typecheck → test → build                                                                                  |
| Dev                     | Docker Compose (Postgres)                                                                  |                                                                                                                  |

---

## 8. Roadmap

**Fase 0 — Validação de dados (antes do código de produto)**

- Liberar os domínios oficiais na rede do ambiente.
- Baixar a NCM (Classif), `IMP_{ano}.csv` e as tabelas auxiliares. Medir volume,
  codificação, cobertura de frete/seguro e revisões.
- Documentar os resultados em `docs/FONTES_DE_DADOS.md`.

**Fase 1 — Fundação**

- Monorepo, TS strict, lint/format, CI, Docker Compose.
- Esquema Prisma + migrações (nomenclatura, dimensões, fonte, carga, usuários).
- Layout com menu lateral, tema e componentes base.
- Autenticação, proteção de rotas e papéis.
- `ClassifNcmProvider` + carga da NCM + navegação da estrutura.

**Fase 2 — Pesquisa**

- Busca por código (com e sem pontos) e por descrição (FTS + trigram).
- Página de detalhes da NCM com fonte e data.
- Favoritos e histórico.
- Aviso de responsabilidade fiscal global.

**Fase 3 — Dados de importação**

- `ComexStatBulkProvider`, staging, validação, _upsert_, relatório de carga.
- Upload CSV/JSON (admin).
- Visões materializadas, filtros, KPIs, gráficos 1–6.

**Fase 4 — Inteligência**

- Países (com filtro por clique), gráfico 7 (evolução do _share_), valor médio
  com metodologia, comparação de períodos e de NCMs, dashboard inicial.

**Fase 5 — IA**

- Ferramentas determinísticas, "Analisar com IA", Assistente Comex, cache e
  auditoria (`ai_analise`), avaliação com perguntas de teste e checagem de
  números citados contra a base.

**Fase 6 — Relatórios**

- CSV, Excel e PDF com NCM, período, dados, gráficos, fonte e data da consulta.

**Fase 7 — Refinamento**

- Segurança (revisão, CSP, rate limit), performance, acessibilidade,
  responsividade, documentação e observabilidade.

**Futuro:** TEC/TIPI, `ComexStatApiProvider` incremental, módulo Empresas com
fonte licenciada, conversão em R$ via PTAX, dados de exportação.

---

## 9. Riscos

| Risco                                                 | Impacto     | Prob.        | Mitigação                                                                       |
| ----------------------------------------------------- | ----------- | ------------ | ------------------------------------------------------------------------------- |
| Expectativa de dados de empresas por NCM              | Alto        | Certa        | Deixar explícito na interface; feature flag; só fonte licenciada                |
| Mudança de formato ou URL das fontes oficiais         | Médio       | Média        | DataProvider isolado, testes de contrato com amostras, alertas na ingestão      |
| Valor médio enganoso (mix de produtos, unidade em kg) | Alto        | Alta         | Regras de validade, metodologia visível, FOB/kg separado                        |
| IA "alucinando" números                               | Alto        | Média        | Tool calling restrito, verificação pós-resposta dos números citados, aviso fixo |
| Uso de IA percebido como classificação oficial        | Alto        | Média        | Linguagem de "sugestão", aviso, sem botão "classificar"                         |
| Volume de dados e desempenho                          | Médio       | Média        | Partições, visões materializadas, índices, paginação                            |
| Reidentificação de empresas por células pequenas      | Médio       | Baixa        | Supressão de células em granularidade fina                                      |
| Série histórica quebrada por mudança de NCM           | Médio       | Alta         | Aviso de vigência; correlações no futuro                                        |
| Direitos sobre a NESH e textos de terceiros           | Médio       | Baixa        | Citar e linkar a fonte; revisão jurídica                                        |
| Reforma tributária mudando IPI/tributos               | Baixo (MVP) | Alta         | Tabelas tributárias versionadas, fora do MVP                                    |
| Custo de LLM / abuso                                  | Médio       | Média        | Rate limit, cache, cota por usuário                                             |
| Bloqueio de rede no ambiente de desenvolvimento       | Médio       | Certa (hoje) | Liberar domínios ou ingerir fora e importar via upload                          |

---

## 10. Escopo possível do MVP (Fases 1–4, com dados reais)

**Entra no MVP**

- Pesquisa de NCM por código e descrição; navegação pela estrutura; detalhes com fonte e data.
- Importações por NCM: quantidade estatística, kg, FOB, frete/seguro/CIF (onde houver), país, UF, via, URF, série mensal/anual.
- Valor médio por unidade (com regras) e por kg.
- Países: participação, ranking, evolução, filtro por clique.
- Comparação de períodos e de NCMs (mesma unidade para quantidade).
- Filtros: ano, mês, intervalo, país, UF, via, URF, NCM.
- Favoritos, histórico, autenticação.
- Ingestão CSV/JSON com relatório.
- Transparência (fonte, período, atualização, metodologia) e aviso fiscal em todas as páginas analíticas.

**Logo após o MVP**

- IA (Fase 5), exportações (Fase 6), busca por produto com sinônimos curados.

**Fora do MVP (dependência externa)**

- Empresas por NCM; quantidade de operações (DI/DUIMP); porto físico
  (existe só a URF); valores em R$ sem metodologia de câmbio definida.

---

## 11. Decisões para aprovação

1. Aprovar a arquitetura em monorepo (web + worker de ingestão + pacotes de domínio).
2. Aprovar a stack (em especial ECharts × Recharts e Better Auth × Auth.js).
3. Aprovar os ajustes no esquema do banco (§6).
4. Aprovar que o módulo **Empresas** fique apenas preparado (feature flag), sem dados.
5. Liberar na política de rede do ambiente: `balanca.economia.gov.br`,
   `api-comexstat.mdic.gov.br`, `portalunico.siscomex.gov.br`, `www.gov.br`
   (para executar a Fase 0).
6. Definir o provedor de LLM para a Fase 5 (a arquitetura é agnóstica).

---

> **Aviso:** As informações apresentadas possuem caráter informativo e de apoio
> à pesquisa. A classificação fiscal e as demais decisões relacionadas à
> importação devem ser verificadas nas fontes oficiais e, quando necessário,
> por profissional habilitado.
