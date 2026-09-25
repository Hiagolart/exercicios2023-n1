# 06 — Telas e navegação

> Estrutura funcional das telas (o que existe, o que mostra, de onde vem o dado). Layout visual final segue o **Forza Cost Control**.

## 1. Menu lateral (grafite/preto)

| Item | Conteúdo |
|------|----------|
| Dashboard | Visão geral de todos os projetos |
| Projetos | Lista/tabela principal de projetos + "Novo projeto" |
| Concorrentes | Base histórica: empresas, modelos, preços (com data e fonte) |
| Fornecedores | Cadastro geral, status de homologação, auditorias |
| Modelos e especificações | Fichas técnicas (Forza, fornecedores, concorrentes) |
| Acessórios | Catálogo e compatibilidade por categoria/modelo |
| Relatórios [PROPOSTA] | Exportações (matriz técnica, comparação de mercado, status geral) |
| Configurações (Admin) | Categorias, atributos técnicos, etapas/pesos, documentos obrigatórios, parâmetros de importação, status/cores, usuários |

No celular o menu vira gaveta (ícone ☰).

## 2. Barra de filtros (topo — padrão em Dashboard e Projetos)

Categoria · Responsável · Fornecedor · Status · Etapa · Período (data prevista / criação / lançamento).
Filtros persistem entre Dashboard e Projetos (clicar em um card aplica o filtro na lista).

## 3. Dashboard

1. **Linha de KPIs (cards clicáveis)** — conforme doc 05 §4: Total, Em desenvolvimento, Em pesquisa, Em cotação, Aguardando fornecedor, Em produção de amostra, Em validação, Homologados, Em preparação para lançamento, Lançados, **Atrasados** e **Bloqueados** (os dois últimos em destaque vermelho quando > 0).
2. **Funil por fases** — Pesquisa e viabilidade → Amostra e homologação → Preparação para venda → Primeiro lote e lançamento → Pós-lançamento, com quantidade de projetos em cada fase (clicável).
3. **Progresso por projeto** — barra horizontal segmentada pelas 5 fases, com % de avanço.
4. **Tabela principal** — Projeto · Modelo · Categoria · Responsável · Etapa atual · Status (badge) · Data prevista · Dias de atraso · Principal pendência · % de avanço. Ordenável; clique abre o projeto.
5. **Próximos vencimentos** [PROPOSTA] — etapas com data prevista nos próximos 15 dias.

## 4. Lista de projetos

Mesma tabela principal, com todos os filtros, busca por nome/código, exportação e botão **Novo projeto** (nome, categoria, responsável, data prevista de lançamento → gera automaticamente as 21 etapas a partir de `etapas_modelo`).

## 5. Página do projeto

**Cabeçalho fixo:** código, nome, categoria, responsável, situação, etapa atual + status, % avanço, data prevista de lançamento, SKU (quando existir), fornecedor homologado (quando existir).
**Faixa de fases/etapas:** linha do tempo com as 21 etapas coloridas por status; clique abre o painel da etapa (status, responsável, datas, pendência, observação, aprovador, evidências).

### 5.1 Abas e regra de visibilidade

Regra geral: a aba aparece quando **a fase do projeto alcançou a fase da aba** ou **a aba já tem dados**. Botão "Mostrar todas as abas" para consulta antecipada (somente leitura se a etapa ainda não pode iniciar).

| Aba | Visível a partir de | Etapas | Conteúdo principal |
|-----|--------------------|--------|--------------------|
| Visão geral | Sempre | todas | Resumo, etapas, pendências, checklist de lançamento (fase 4) |
| Requisitos técnicos | Fase 1 | 02 | Versões de requisitos, ficha do modelo Forza, acessórios |
| Fornecedores | Fase 1 | 03, 08 | Fornecedores do projeto, status, auditoria |
| Cotações | Fase 1 (após 02 aprovada) | 04 | Propostas, FOB USD, prazos, validade |
| Comparação técnica | Fase 1 | 05 | Matriz requisito × fornecedor; Forza × concorrentes |
| Concorrentes | Fase 1 | 01 | Modelos vinculados, equivalência, preços |
| Precificação | Fase 1 | 01, 06, 07 | Comparação de mercado (mín/médio/máx, posicionamento) |
| Nacionalização | Fase 1 (após 1ª cotação) | 06 | Oficial + cenários |
| Viabilidade | Fase 1 | 07 | Indicadores, riscos, decisão |
| Amostra | Fase 2 | 09, 10 | Pedido, produção, alterações |
| Testes | Fase 2 | 11 | Plano de testes, resultados, não conformidades |
| Homologação | Fase 2 | 12, 13 | Configuração congelada, versões, solicitações de alteração, SKU |
| Documentação | Fase 3 | 13, 15, 17 | Documentos controlados, liberação marketing |
| Peças | Fase 3 | 14 | Lista inicial de peças |
| Treinamentos | Fase 3 | 16 | Treinamentos e presença |
| Primeiro lote | Fase 4 (ou 18 iniciada) | 18, 19 | Pedido, conferência lote × homologado |
| Pós-lançamento | Fase 5 | 21 | Ocorrências e indicadores |
| Histórico | Sempre | — | Linha do tempo de alterações (filtro por relevância) |
| Anexos | Sempre | — | Todos os arquivos, filtro por tipo/entidade/evidência |

### 5.2 Telas-chave (comportamento)

- **Comparação técnica — modo "Concorrentes":** colunas Forza | Hangcha | Heli | Netmak | … (somente modelos da mesma categoria vinculados ao projeto). Linhas = atributos aplicáveis agrupados. Células coloridas: melhor / igual / pior que Forza (conforme `direcao_melhor`); "Não informado" em cinza. Selo de equivalência no topo de cada coluna.
- **Comparação técnica — modo "Fornecedores":** linhas = requisitos; colunas = cotações; célula = valor informado + badge (Atende / Não atende / Superior / Pendente / Não informado). Rodapé com resumo por fornecedor.
- **Precificação:** 4 cards (Menor · Média · Maior · Preço Forza) + diferença % + barra de faixa com o ponto Forza; filtros visíveis (tipo de preço, equivalência, base de impostos, desatualizados); tabela de apoio com data e fonte em cada preço.
- **Nacionalização:** bloco "FOB (USD)" separado do bloco "Custo nacionalizado (BRL)"; premissas (câmbio com data/fonte); itens de custo; composição. Área **Simulação** com fundo diferenciado e aviso "Simulação — não altera dados oficiais"; botões Salvar cenário / Comparar cenários / Promover a oficial (aprovador).
- **Painel da etapa:** botão "Concluir" desabilitado enquanto faltar evidência/gate, com lista do que falta.

## 6. Padrões de interface

- Badges de status com as 6 cores padrão (doc 01 §5.1), sempre com texto (não depender só da cor — acessibilidade).
- Moeda sempre explícita em todo valor (`USD 12.500,00` / `R$ 98.400,00`).
- Todo valor com fonte mostra ícone ⓘ com fonte e data.
- "Não informado" em cinza itálico — nunca campo vazio silencioso.
- Tabelas largas: primeira coluna fixa e rolagem horizontal; no celular, tabela principal vira lista de cards.

## 7. Notificações [PROPOSTA]

- Etapa atribuída ao usuário; etapa aguardando aprovação; etapa vencendo (X dias) ou atrasada; cotação vencendo; NC crítica aberta; ocorrência crítica pós-lançamento.
- Canal (e-mail / sistema) a definir.

## 8. Perfis e permissões [PROPOSTA]

| Perfil | Pode |
|--------|------|
| Administrador | Tudo, incluindo cadastros-base e parâmetros |
| Gestor de projeto (P&D) | Criar projetos, editar todas as abas do seu projeto, reabrir etapas |
| Área (Engenharia, Comercial, Comex, Pós-Vendas, Qualidade, Marketing) | Editar etapas/abas em que é responsável; ler o restante |
| Aprovador | Aprovar/reprovar etapas e versões atribuídas |
| Diretoria | Leitura total + aprovações de gate (07, 12, 20) |
| Leitor | Somente leitura |
