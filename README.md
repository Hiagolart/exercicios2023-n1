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

**Fases 1 (Fundação) e 2 (Pesquisa NCM) concluídas.** A Fase 0 (validação com download real das fontes oficiais) está
pendente de liberação de rede no ambiente de desenvolvimento.

| Módulo                                                     | Situação                           |
| ---------------------------------------------------------- | ---------------------------------- |
| Monorepo, TypeScript strict, lint, testes, CI              | ✅                                 |
| Banco PostgreSQL + Prisma (nomenclatura, cargas, usuários) | ✅                                 |
| Autenticação (e-mail e senha), proteção de rotas e APIs    | ✅                                 |
| Layout, menu lateral, landing page, tema claro/escuro      | ✅                                 |
| Ingestão da NCM oficial (Classif/RFB) com relatório        | ✅ (formato a confirmar na Fase 0) |
| Navegação pela estrutura da NCM                            | ✅                                 |
| Pesquisa por código e descrição, favoritos, histórico      | ✅                                 |
| Tributação (II, IPI, PIS/Cofins, CBS/IBS)                  | Fase 3                             |
| Dados de importação (Comex Stat)                           | Fase 6                             |

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

## Verificações

```bash
pnpm lint
pnpm typecheck
pnpm test                 # testes unitários
pnpm test:integration     # exige TEST_DATABASE_URL (banco dedicado a testes)
pnpm build
pnpm test:e2e             # Playwright; exige banco com a carga fictícia
pnpm check                # lint + typecheck + test + build
```

## Princípios de dados

- Somente fontes oficiais ou licenciadas; nada de dados inventados.
- Toda tela analítica mostra fonte, período, data de atualização e metodologia.
- Informação ausente na fonte aparece como "Não disponível na fonte".
- Dados de empresas por NCM não são exibidos: as fontes oficiais não os publicam (sigilo fiscal).
- Nenhuma credencial no código: tudo via variáveis de ambiente (`.env.example`).
