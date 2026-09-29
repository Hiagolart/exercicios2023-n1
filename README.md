# Comex Intelligence

Plataforma de pesquisa fiscal (NCM) e inteligência de importações baseada em dados oficiais.

> As informações apresentadas possuem caráter informativo e de apoio à pesquisa. A classificação
> fiscal e demais decisões relacionadas à importação devem ser verificadas nas fontes oficiais e,
> quando necessário, por profissional habilitado.

A análise técnica, as fontes de dados e a arquitetura estão em
[`docs/ANALISE_TECNICA.md`](docs/ANALISE_TECNICA.md). O roadmap atual, com as funcionalidades
equivalentes às de um sistema de consulta aduaneira como o TECwin, está em
[`docs/ROADMAP.md`](docs/ROADMAP.md).

## Estado atual

**Fases 0 a 3 concluídas**, com a nomenclatura, a TIPI e os Anexos da Res. Gecex 272/2021 oficiais carregados (veja [`docs/FONTES_DE_DADOS.md`](docs/FONTES_DE_DADOS.md)).

| Módulo                                                              | Situação                           |
| ------------------------------------------------------------------- | ---------------------------------- |
| Monorepo, TypeScript strict, lint, testes, CI                       | ✅                                 |
| Banco PostgreSQL + Prisma (nomenclatura, cargas, usuários)          | ✅                                 |
| Autenticação (e-mail e senha), proteção de rotas e APIs             | ✅                                 |
| Layout, menu lateral, landing page, tema claro/escuro               | ✅                                 |
| Ingestão da NCM oficial (Classif/RFB) com relatório                 | ✅ (formato a confirmar na Fase 0) |
| Navegação pela estrutura da NCM                                     | ✅                                 |
| Pesquisa por código e descrição, favoritos, histórico               | ✅                                 |
| Tributação: alíquotas, exceções, destaques Ex, histórico, simulador | ✅ (aguarda planilhas oficiais)    |
| Dados de importação (Comex Stat)                                    | Fase 6                             |

## Estrutura

```
apps/
  web/        Next.js (interface + API REST /api/v1)
  ingest/     Worker de ingestão (CLI): DataProviders, validação, relatório de carga
packages/
  core/       Regras de negócio puras (códigos NCM, parsers, contratos de DataProvider)
  db/         Esquema Prisma, migrações e repositórios
  eslint-config/
docs/         Análise técnica e documentação
```

Regras de negócio ficam em `packages/core` (funções puras e testadas). A interface consome dados por
`apps/web/src/lib/data`, que usa os repositórios de `packages/db`.

## Como rodar

Requisitos: Node 22+, pnpm 10+, PostgreSQL 16 (ou `docker compose up -d`).

```bash
cp .env.example .env          # preencha BETTER_AUTH_SECRET (openssl rand -base64 32)
pnpm install
pnpm db:migrate               # aplica as migrações
pnpm ingest ncm --source classif   # baixa a NCM vigente da Receita Federal
pnpm dev                      # http://localhost:3000
```

Sem acesso à rede das fontes oficiais, há duas alternativas:

- `pnpm ingest ncm --source file --file caminho/ncm.json` — importa o JSON da NCM baixado manualmente
  em [Download NCM — Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/download-ncm-nomenclatura-comum-do-mercosul).
- `pnpm ingest ncm --source mock` — carrega **dados fictícios** (capítulo 99, descrições marcadas
  `[FICTÍCIO]`). A interface exibe um aviso sempre que esses dados aparecem. Bloqueado quando
  `NODE_ENV=production`.

Tributos: veja [`docs/IMPORTACAO_TRIBUTOS.md`](docs/IMPORTACAO_TRIBUTOS.md).

```bash
pnpm ingest ncm --source file --file ../../data/raw/Tabela_NCM_Vigente_20260929.json
pnpm ingest tributos --source tipi --file ../../data/raw/tipi.xlsx --ato "Decreto nº 11.158/2022 (TIPI) e alterações"
pnpm ingest tributos --source tec --file ../../data/raw/25-09-2026-anexos-i-a-x-resolucao-gecex-272-21.xlsx --referencia 2026-09-25
pnpm ingest tributos --source legislacao             # regras gerais (PIS/Cofins, CBS/IBS)
pnpm ingest limpar-ficticios                         # remove dados fictícios de desenvolvimento
```

Os caminhos de `--file` são relativos a `apps/ingest`. Os arquivos oficiais ficam em `data/raw/`
(fora do Git).

```bash

```

## Verificações

```bash
pnpm lint
pnpm typecheck
pnpm test                 # testes unitários
pnpm test:integration     # exige TEST_DATABASE_URL (banco dedicado a testes)
pnpm build
pnpm test:e2e             # Playwright; use um banco separado com as cargas fictícias (DATABASE_URL=.../comex_e2e)
pnpm check                # lint + typecheck + test + build
```

## Princípios de dados

- Somente fontes oficiais ou licenciadas; nada de dados inventados.
- Toda tela analítica mostra fonte, período, data de atualização e metodologia.
- Informação ausente na fonte aparece como "Não disponível na fonte".
- Dados de empresas por NCM não são exibidos: as fontes oficiais não os publicam (sigilo fiscal).
- Nenhuma credencial no código: tudo via variáveis de ambiente (`.env.example`).
